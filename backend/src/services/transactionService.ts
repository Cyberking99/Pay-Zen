import { ethers } from "ethers"
import db from "../config/database.js"
import logger from "../utils/logger.js"

export const transactionService = {
  // Resolve recipient (username or wallet address) to wallet address
  async resolveRecipient(recipient: string): Promise<string | null> {
    try {
      // Check if it's a valid Ethereum address
      if (ethers.isAddress(recipient)) {
        return ethers.getAddress(recipient) // Returns checksummed address
      }

      // Try to find user by username
      const user = await db("users").where("username", recipient).where("is_active", true).first()

      if (user) {
        return ethers.getAddress(user.wallet_address)
      }

      return null
    } catch (error) {
      logger.error("Recipient resolution error:", error)
      return null
    }
  },

  // Validate recipient and return detailed info
  async validateRecipient(recipient: string): Promise<{
    valid: boolean
    type: "address" | "username" | null
    address?: string
    user?: {
      username: string
      fullName: string
    }
    error?: string
  }> {
    try {
      // Check if it's a valid Ethereum address
      if (ethers.isAddress(recipient)) {
        const checksummedAddress = ethers.getAddress(recipient)

        // Check if this address belongs to a user
        const user = await db("users")
          .where("wallet_address", checksummedAddress.toLowerCase())
          .where("is_active", true)
          .first()

        return {
          valid: true,
          type: "address",
          address: checksummedAddress,
          ...(user && {
            user: {
              username: user.username,
              fullName: user.full_name,
            },
          }),
        }
      }

      // Try to find user by username
      const user = await db("users").where("username", recipient).where("is_active", true).first()

      if (user) {
        return {
          valid: true,
          type: "username",
          address: ethers.getAddress(user.wallet_address),
          user: {
            username: user.username,
            fullName: user.full_name,
          },
        }
      }

      return {
        valid: false,
        type: null,
        error: "Recipient not found",
      }
    } catch (error) {
      logger.error("Recipient validation error:", error)
      return {
        valid: false,
        type: null,
        error: "Validation failed",
      }
    }
  },

  // Update transaction status after blockchain confirmation
  async updateTransactionStatus(
    transactionId: string,
    txHash: string,
    status: "confirmed" | "failed",
    blockNumber?: number,
    gasUsed?: bigint,
    gasPrice?: bigint,
  ): Promise<void> {
    try {
      await db("transactions")
        .where("id", transactionId)
        .update({
          tx_hash: txHash,
          status,
          block_number: blockNumber || null,
          gas_used: gasUsed?.toString() || null,
          gas_price: gasPrice?.toString() || null,
          updated_at: new Date(),
        })

      logger.info(`Transaction ${transactionId} updated to ${status}`)
    } catch (error) {
      logger.error("Transaction status update error:", error)
      throw error
    }
  },

  // Get recent transactions for a user
  async getRecentTransactions(userId: string, limit = 5): Promise<any[]> {
    try {
      const transactions = await db("transactions")
        .leftJoin("users as from_users", "transactions.from_user_id", "from_users.id")
        .leftJoin("users as to_users", "transactions.to_user_id", "to_users.id")
        .where((builder) => {
          builder.where("transactions.from_user_id", userId).orWhere("transactions.to_user_id", userId)
        })
        .select("transactions.*", "from_users.username as from_username", "to_users.username as to_username")
        .orderBy("transactions.created_at", "desc")
        .limit(limit)

      return transactions.map((tx) => ({
        id: tx.id,
        type: tx.from_user_id === userId ? "sent" : "received",
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.created_at,
        counterparty: tx.from_user_id === userId ? tx.to_username : tx.from_username,
      }))
    } catch (error) {
      logger.error("Recent transactions error:", error)
      throw error
    }
  },
}
