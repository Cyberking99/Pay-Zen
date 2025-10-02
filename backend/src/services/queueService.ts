import Bull from "bull"
import logger from "../utils/logger.js"
import { blockchainService } from "./blockchainService.js"
import { transactionService } from "./transactionService.js"

// Job queues
export const transactionMonitorQueue = new Bull("transaction-monitor", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
  },
})

export const notificationQueue = new Bull("notifications", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number.parseInt(process.env.REDIS_PORT || "6379"),
  },
})

interface TransactionMonitorJob {
  transactionId: string
  txHash: string
  network: string
  userId: string
}

interface NotificationJob {
  userId: string
  type: "transaction-confirmed" | "transaction-failed" | "payment-received"
  data: any
}

export const initializeQueues = async () => {
  // Transaction monitoring job processor
  transactionMonitorQueue.process("monitor-transaction", async (job) => {
    const { transactionId, txHash, network, userId } = job.data as TransactionMonitorJob

    try {
      logger.info(`Monitoring transaction: ${txHash} on ${network}`)

      // Wait for transaction confirmation
      const receipt = await blockchainService.waitForTransaction(txHash, network, 1)

      if (receipt) {
        const status = receipt.status === 1 ? "confirmed" : "failed"

        // Update transaction in database
        await transactionService.updateTransactionStatus(
          transactionId,
          txHash,
          status,
          receipt.blockNumber,
          receipt.gasUsed,
          receipt.gasPrice,
        )

        // Add notification job
        await addNotificationJob({
          userId,
          type: status === "confirmed" ? "transaction-confirmed" : "transaction-failed",
          data: {
            transactionId,
            txHash,
            status,
            blockNumber: receipt.blockNumber,
          },
        })

        logger.info(`Transaction ${txHash} ${status}`)
      }
    } catch (error) {
      logger.error(`Transaction monitoring failed for ${txHash}:`, error)

      // Mark as failed after timeout
      await transactionService.updateTransactionStatus(transactionId, txHash, "failed")

      await addNotificationJob({
        userId,
        type: "transaction-failed",
        data: {
          transactionId,
          txHash,
          error: "Transaction timeout",
        },
      })
    }
  })

  // Notification job processor
  notificationQueue.process("send-notification", async (job) => {
    const { userId, type, data } = job.data as NotificationJob

    try {
      // Here you would integrate with your Socket.io instance
      // For now, we'll just log the notification
      logger.info(`Notification for user ${userId}: ${type}`, data)

      // You can also integrate with email/SMS services here
      // await sendEmailNotification(userId, type, data)
      // await sendPushNotification(userId, type, data)
    } catch (error) {
      logger.error(`Notification failed for user ${userId}:`, error)
    }
  })

  logger.info("Job queues initialized successfully")
}

export const addTransactionMonitorJob = async (data: TransactionMonitorJob) => {
  await transactionMonitorQueue.add("monitor-transaction", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  })
}

export const addNotificationJob = async (data: NotificationJob) => {
  await notificationQueue.add("send-notification", data, {
    attempts: 3,
    delay: 1000,
    removeOnComplete: 100,
    removeOnFail: 50,
  })
}
