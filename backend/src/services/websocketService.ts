import type { Server, Socket } from "socket.io"
import logger from "../utils/logger.js"
import db from "../config/database.js"
import { blockchainService } from "./blockchainService.js"
import { ethers } from "ethers"

export const setupWebSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    logger.info(`WebSocket connection established: ${socket.id}`)

    // Handle user authentication and room joining
    socket.on("authenticate", async (data: { userId: string; token: string }) => {
      try {
        // Verify user token here if needed
        const { userId } = data

        // Join user-specific room
        socket.join(`user-${userId}`)
        socket.data.userId = userId

        logger.info(`User ${userId} authenticated and joined room`)

        // Send initial balance
        const user = await db("users").where("id", userId).first()
        if (user) {
          const balance = await blockchainService.getUSDCBalance(user.wallet_address, "ethereum")
          socket.emit("balance-updated", {
            balance: ethers.formatUnits(balance, 6),
            network: "ethereum",
          })
        }
      } catch (error) {
        logger.error("WebSocket authentication error:", error)
        socket.emit("auth-error", { message: "Authentication failed" })
      }
    })

    // Handle balance refresh requests
    socket.on("refresh-balance", async (data: { network?: string }) => {
      try {
        const userId = socket.data.userId
        if (!userId) {
          socket.emit("error", { message: "Not authenticated" })
          return
        }

        const user = await db("users").where("id", userId).first()
        if (!user) {
          socket.emit("error", { message: "User not found" })
          return
        }

        const network = data.network || "ethereum"
        const balance = await blockchainService.getUSDCBalance(user.wallet_address, network)

        socket.emit("balance-updated", {
          balance: ethers.formatUnits(balance, 6),
          network,
        })
      } catch (error) {
        logger.error("Balance refresh error:", error)
        socket.emit("error", { message: "Failed to refresh balance" })
      }
    })

    // Handle transaction status requests
    socket.on("check-transaction", async (data: { txHash: string; network: string }) => {
      try {
        const { txHash, network } = data
        const receipt = await blockchainService.getTransactionReceipt(txHash, network)

        if (receipt) {
          socket.emit("transaction-status", {
            txHash,
            status: receipt.status === 1 ? "confirmed" : "failed",
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
          })
        } else {
          socket.emit("transaction-status", {
            txHash,
            status: "pending",
          })
        }
      } catch (error) {
        logger.error("Transaction check error:", error)
        socket.emit("error", { message: "Failed to check transaction" })
      }
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      logger.info(`WebSocket disconnected: ${socket.id}`)
    })
  })
}
