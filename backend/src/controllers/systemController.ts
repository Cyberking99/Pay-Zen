import type { Request, Response } from "express"
import db from "../config/database.js"
import redis from "../config/redis.js"
import logger from "../utils/logger.js"
import { asyncHandler } from "../middleware/errorMiddleware.js"

export const systemController = {
  // GET /api/system/health
  healthCheck: asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check database connection
      await db.raw("SELECT 1")

      // Check Redis connection
      await redis.ping()

      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
          redis: "connected",
        },
      })
    } catch (error) {
      logger.error("Health check failed:", error)
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Service unavailable",
      })
    }
  }),

  // GET /api/system/stats
  getSystemStats: asyncHandler(async (req: Request, res: Response) => {
    try {
      // Get basic system statistics
      const [userCount] = await db("users").count("* as count")
      const [transactionCount] = await db("transactions").count("* as count")
      const [paymentLinkCount] = await db("payment_links").count("* as count")

      // Get transaction volume (last 24 hours)
      const [dailyVolume] = await db("transactions")
        .where("status", "confirmed")
        .where("created_at", ">=", db.raw("NOW() - INTERVAL '24 hours'"))
        .sum("amount as volume")

      res.json({
        users: Number.parseInt(userCount?.count?.toString() ?? "0"),
        transactions: Number.parseInt(transactionCount?.count?.toString() ?? "0"),
        paymentLinks: Number.parseInt(paymentLinkCount?.count?.toString() ?? "0"),
        dailyVolume: dailyVolume?.volume?.toString() ?? "0",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      logger.error("System stats error:", error)
      res.status(500).json({ error: "Failed to fetch system stats" })
    }
  }),
}
