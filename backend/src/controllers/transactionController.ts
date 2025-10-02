import type { Response } from "express"
import { ethers } from "ethers"
import db from "../config/database.js"
import logger from "../utils/logger.js"
import { asyncHandler } from "../middleware/errorMiddleware.js"
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js"
import { blockchainService } from "../services/blockchainService.js"
import { transactionService } from "../services/transactionService.js"
import { v4 as uuidv4 } from "uuid"

export const transactionController = {
  // POST /api/transactions/send
  sendTransaction: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { recipient, amount, memo, network = "ethereum" } = req.body
    const userId = req.user!.id
    const fromAddress = req.user!.walletAddress

    try {
      // Resolve recipient address
      const recipientAddress = await transactionService.resolveRecipient(recipient)
      if (!recipientAddress) {
        return res.status(400).json({ error: "Invalid recipient" })
      }

      // Validate amount
      const amountWei = ethers.parseUnits(amount.toString(), 6) // USDC has 6 decimals

      // Check balance
      const balance = await blockchainService.getUSDCBalance(fromAddress, network)
      if (balance < amountWei) {
        return res.status(400).json({ error: "Insufficient balance" })
      }

      // Estimate gas fee
      const gasEstimate = await blockchainService.estimateTransferGas(fromAddress, recipientAddress, amountWei, network)

      // Get recipient user (if exists)
      const recipientUser = await db("users").where("wallet_address", recipientAddress.toLowerCase()).first()

      // Create transaction record
      const [transaction] = await db("transactions")
        .insert({
          from_user_id: userId,
          to_user_id: recipientUser?.id || null,
          from_address: fromAddress.toLowerCase(),
          to_address: recipientAddress.toLowerCase(),
          amount: ethers.formatUnits(amountWei, 6),
          memo: memo || null,
          status: "pending",
          network,
        })
        .returning("*")

      logger.info(`Transaction created: ${transaction.id}`)

      // Return transaction details for frontend to execute
      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          fromAddress,
          toAddress: recipientAddress,
          amount: ethers.formatUnits(amountWei, 6),
          amountWei: amountWei.toString(),
          memo,
          network,
          gasEstimate: {
            gasLimit: gasEstimate.gasLimit.toString(),
            gasPrice: gasEstimate.gasPrice.toString(),
            estimatedFee: ethers.formatEther(gasEstimate.gasLimit * gasEstimate.gasPrice),
          },
        },
      })
    } catch (error) {
      logger.error("Send transaction error:", error)
      res.status(500).json({ error: "Failed to prepare transaction" })
    }
  }),

  // GET /api/transactions/history
  getTransactionHistory: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id
    const walletAddress = req.user!.walletAddress
    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Number.parseInt(req.query.limit as string) || 20
    const status = req.query.status as string
    const type = req.query.type as string

    try {
      let query = db("transactions")
        .leftJoin("users as from_users", "transactions.from_user_id", "from_users.id")
        .leftJoin("users as to_users", "transactions.to_user_id", "to_users.id")
        .select(
          "transactions.*",
          "from_users.username as from_username",
          "from_users.full_name as from_full_name",
          "to_users.username as to_username",
          "to_users.full_name as to_full_name",
        )

      // Filter by transaction type
      if (type === "sent") {
        query = query.where("transactions.from_user_id", userId)
      } else if (type === "received") {
        query = query.where("transactions.to_user_id", userId)
      } else {
        query = query.where((builder) => {
          builder.where("transactions.from_user_id", userId).orWhere("transactions.to_user_id", userId)
        })
      }

      // Filter by status
      if (status) {
        query = query.where("transactions.status", status)
      }

      // Get total count
      const totalQuery = query.clone()
      const countResult = await totalQuery.count("* as count");
      const count = countResult?.[0]?.count ?? 0;

      // Get paginated results
      const transactions = await query
        .orderBy("transactions.created_at", "desc")
        .limit(limit)
        .offset((page - 1) * limit)

      // Format transactions
      const formattedTransactions = transactions.map((tx) => ({
        id: tx.id,
        txHash: tx.tx_hash,
        type: tx.from_user_id === userId ? "sent" : "received",
        amount: tx.amount,
        memo: tx.memo,
        status: tx.status,
        network: tx.network,
        blockNumber: tx.block_number,
        createdAt: tx.created_at,
        from: {
          address: tx.from_address,
          username: tx.from_username,
          fullName: tx.from_full_name,
        },
        to: {
          address: tx.to_address,
          username: tx.to_username,
          fullName: tx.to_full_name,
        },
      }))

      res.json({
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total: Number.parseInt(count.toString()),
          pages: Math.ceil(Number.parseInt(count.toString()) / limit),
        },
      })
    } catch (error) {
      logger.error("Transaction history error:", error)
      res.status(500).json({ error: "Failed to fetch transaction history" })
    }
  }),

  // GET /api/transactions/:id
  getTransactionDetails: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const userId = req.user!.id

    try {
      const transaction = await db("transactions")
        .leftJoin("users as from_users", "transactions.from_user_id", "from_users.id")
        .leftJoin("users as to_users", "transactions.to_user_id", "to_users.id")
        .leftJoin("payment_links", "transactions.payment_link_id", "payment_links.id")
        .where("transactions.id", id)
        .where((builder) => {
          builder.where("transactions.from_user_id", userId).orWhere("transactions.to_user_id", userId)
        })
        .select(
          "transactions.*",
          "from_users.username as from_username",
          "from_users.full_name as from_full_name",
          "to_users.username as to_username",
          "to_users.full_name as to_full_name",
          "payment_links.title as payment_link_title",
        )
        .first()

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" })
      }

      res.json({
        id: transaction.id,
        txHash: transaction.tx_hash,
        type: transaction.from_user_id === userId ? "sent" : "received",
        amount: transaction.amount,
        memo: transaction.memo,
        status: transaction.status,
        network: transaction.network,
        blockNumber: transaction.block_number,
        gasUsed: transaction.gas_used,
        gasPrice: transaction.gas_price,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        from: {
          address: transaction.from_address,
          username: transaction.from_username,
          fullName: transaction.from_full_name,
        },
        to: {
          address: transaction.to_address,
          username: transaction.to_username,
          fullName: transaction.to_full_name,
        },
        paymentLink: transaction.payment_link_title
          ? {
              title: transaction.payment_link_title,
            }
          : null,
      })
    } catch (error) {
      logger.error("Transaction details error:", error)
      res.status(500).json({ error: "Failed to fetch transaction details" })
    }
  }),

  // POST /api/transactions/estimate-fee
  estimateFee: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { recipient, amount, network = "ethereum" } = req.body
    const fromAddress = req.user!.walletAddress

    try {
      // Resolve recipient address
      const recipientAddress = await transactionService.resolveRecipient(recipient)
      if (!recipientAddress) {
        return res.status(400).json({ error: "Invalid recipient" })
      }

      const amountWei = ethers.parseUnits(amount.toString(), 6)

      // Estimate gas
      const gasEstimate = await blockchainService.estimateTransferGas(fromAddress, recipientAddress, amountWei, network)

      res.json({
        gasLimit: gasEstimate.gasLimit.toString(),
        gasPrice: gasEstimate.gasPrice.toString(),
        estimatedFee: ethers.formatEther(gasEstimate.gasLimit * gasEstimate.gasPrice),
        network,
      })
    } catch (error) {
      logger.error("Fee estimation error:", error)
      res.status(500).json({ error: "Failed to estimate fee" })
    }
  }),

  // POST /api/transactions/validate-recipient
  validateRecipient: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { recipient } = req.body

    try {
      const result = await transactionService.validateRecipient(recipient)
      res.json(result)
    } catch (error) {
      logger.error("Recipient validation error:", error)
      res.status(500).json({ error: "Failed to validate recipient" })
    }
  }),

  // POST /api/transactions/record
  recordTransaction: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      txHash,
      from,
      to,
      amount,
      memo,
      status = "confirmed",
      network = "ethereum",
      block_number,
      gas_used,
      gas_price,
      fromUserId,
      toUserId
    } = req.body

    const userId = req.user!.id

    try {
      const [transaction] = await db("transactions")
        .insert({
          id: uuidv4(),
          tx_hash: txHash,
          from_address: from.toLowerCase(),
          to_address: to.toLowerCase(),
          amount,
          memo: memo || null,
          status,
          network,
          block_number,
          gas_used,
          gas_price,
          from_user_id: userId,
          to_user_id: toUserId || null,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*")

      logger.info(`Transaction recorded: ${transaction.id}`)
      res.json({ success: true, transaction })
    } catch (error) {
      logger.error("Record transaction error:", error)
      res.status(500).json({ error: "Failed to record transaction" })
    }
  }),
}
