import { ethers } from "ethers"
import type { Server } from "socket.io"
import db from "../config/database.js"
import logger from "../utils/logger.js"
import { blockchainService } from "./blockchainService.js"
import { transactionService } from "./transactionService.js"
import { addTransactionMonitorJob } from "./queueService.js"

interface MonitoringState {
  isRunning: boolean
  lastProcessedBlocks: Record<string, number>
}

const monitoringState: MonitoringState = {
  isRunning: false,
  lastProcessedBlocks: {},
}

export const startBlockchainMonitoring = async (io: Server) => {
  if (monitoringState.isRunning) {
    logger.warn("Blockchain monitoring is already running")
    return
  }

  monitoringState.isRunning = true
  logger.info("Starting blockchain monitoring service")

  // Monitor each network
  const networks = ["base"]

  for (const network of networks) {
    try {
      const provider = blockchainService.getProvider(network)
      const usdcContract = blockchainService.getUSDCContract(network, provider)

      // Get current block number
      const currentBlock = await provider.getBlockNumber()
      monitoringState.lastProcessedBlocks[network] = currentBlock

      logger.info(`Starting monitoring for ${network} from block ${currentBlock}`)

      // Listen for USDC Transfer events
      usdcContract.on("Transfer", async (from: string, to: string, amount: bigint, event: any) => {
        try {
          await handleTransferEvent(from, to, amount, event, network, io)
        } catch (error) {
          logger.error(`Error handling Transfer event on ${network}:`, error)
        }
      })

      // Monitor pending transactions
      startPendingTransactionMonitoring(network, io)
    } catch (error) {
      logger.error(`Failed to start monitoring for ${network}:`, error)
    }
  }
}

const handleTransferEvent = async (
  from: string,
  to: string,
  amount: bigint,
  event: any,
  network: string,
  io: Server,
) => {
  try {
    const txHash = event.transactionHash
    const blockNumber = event.blockNumber

    logger.info(`USDC Transfer detected: ${txHash} on ${network}`)

    // Check if this transaction exists in our database
    const existingTransaction = await db("transactions").where("tx_hash", txHash).first()

    if (existingTransaction) {
      // Update transaction status
      await transactionService.updateTransactionStatus(
        existingTransaction.id,
        txHash,
        "confirmed",
        blockNumber,
        event.gasUsed,
        event.gasPrice,
      )

      // Emit real-time update to users
      if (existingTransaction.from_user_id) {
        io.to(`user-${existingTransaction.from_user_id}`).emit("transaction-confirmed", {
          transactionId: existingTransaction.id,
          txHash,
          status: "confirmed",
          blockNumber,
        })
      }

      if (existingTransaction.to_user_id) {
        io.to(`user-${existingTransaction.to_user_id}`).emit("transaction-received", {
          transactionId: existingTransaction.id,
          txHash,
          amount: ethers.formatUnits(amount, 6),
          from: from.toLowerCase(),
          blockNumber,
        })

        // Update recipient's balance
        const recipientUser = await db("users").where("id", existingTransaction.to_user_id).first()
        if (recipientUser) {
          const newBalance = await blockchainService.getUSDCBalance(recipientUser.wallet_address, network)
          io.to(`user-${existingTransaction.to_user_id}`).emit("balance-updated", {
            balance: ethers.formatUnits(newBalance, 6),
            network,
          })
        }
      }
    } else {
      // This might be an external transaction to one of our users
      const recipientUser = await db("users").where("wallet_address", to.toLowerCase()).first()

      if (recipientUser) {
        // Create transaction record for external transfer
        const [newTransaction] = await db("transactions")
          .insert({
            tx_hash: txHash,
            from_user_id: null,
            to_user_id: recipientUser.id,
            from_address: from.toLowerCase(),
            to_address: to.toLowerCase(),
            amount: ethers.formatUnits(amount, 6),
            status: "confirmed",
            block_number: blockNumber,
            network,
          })
          .returning("*")

        // Notify recipient
        io.to(`user-${recipientUser.id}`).emit("transaction-received", {
          transactionId: newTransaction.id,
          txHash,
          amount: ethers.formatUnits(amount, 6),
          from: from.toLowerCase(),
          blockNumber,
        })

        // Update balance
        const newBalance = await blockchainService.getUSDCBalance(recipientUser.wallet_address, network)
        io.to(`user-${recipientUser.id}`).emit("balance-updated", {
          balance: ethers.formatUnits(newBalance, 6),
          network,
        })
      }
    }
  } catch (error) {
    logger.error("Error handling transfer event:", error)
  }
}

const startPendingTransactionMonitoring = (network: string, io: Server) => {
  setInterval(async () => {
    try {
      // Get pending transactions from database
      const pendingTransactions = await db("transactions").where("status", "pending").where("network", network)

      for (const transaction of pendingTransactions) {
        if (transaction.tx_hash) {
          // Add to monitoring queue
          await addTransactionMonitorJob({
            transactionId: transaction.id,
            txHash: transaction.tx_hash,
            network,
            userId: transaction.from_user_id,
          })
        }
      }
    } catch (error) {
      logger.error(`Error monitoring pending transactions on ${network}:`, error)
    }
  }, 30000) // Check every 30 seconds
}

export const stopBlockchainMonitoring = () => {
  monitoringState.isRunning = false
  logger.info("Blockchain monitoring stopped")
}
