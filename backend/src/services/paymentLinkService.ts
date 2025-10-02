import db from "../config/database.js"
import logger from "../utils/logger.js"

interface PaymentLink {
  id: string
  expiration_type: string
  expires_at: Date | null
  max_uses: number | null
  usage_count: number
  is_active: boolean
}

interface CustomField {
  id: string
  type: "text" | "select" | "textarea"
  label: string
  required: boolean
  options?: string[]
}

export const paymentLinkService = {
  // Validate custom fields format
  validateCustomFields(customFields: any[]): boolean {
    try {
      for (const field of customFields) {
        if (!field.name || !field.type) {
          return false
        }

        if (!["text", "select", "textarea"].includes(field.type)) {
          return false
        }

        if (field.type === "select" && (!field.options || !Array.isArray(field.options))) {
          return false
        }

        if (typeof field.required !== "boolean") {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  },

  // Get payment link status
  getLinkStatus(paymentLink: PaymentLink): "active" | "expired" | "inactive" | "used_up" {
    if (!paymentLink.is_active) {
      return "inactive"
    }

    // Check if expired by date
    if (paymentLink.expires_at && new Date(paymentLink.expires_at) <= new Date()) {
      return "expired"
    }

    // Check if used up
    if (paymentLink.max_uses && paymentLink.usage_count >= paymentLink.max_uses) {
      return "used_up"
    }

    return "active"
  },

  // Get analytics for a payment link
  async getAnalytics(paymentLinkId: string): Promise<{
    totalAmount: string
    totalTransactions: number
    successfulTransactions: number
    failedTransactions: number
    averageAmount: string
    dailyStats: Array<{ date: string; amount: string; count: number }>
    topPayers: Array<{ username: string; fullName: string; amount: string; count: number }>
  }> {
    try {
      // Get basic stats
      const [stats] = await db("transactions")
        .where("payment_link_id", paymentLinkId)
        .select(
          db.raw("COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount::numeric ELSE 0 END), 0) as total_amount"),
          db.raw("COUNT(*) as total_transactions"),
          db.raw("COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as successful_transactions"),
          db.raw("COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions"),
          db.raw("COALESCE(AVG(CASE WHEN status = 'confirmed' THEN amount::numeric END), 0) as average_amount"),
        )

      // Get daily stats for last 30 days
      const dailyStats = await db("transactions")
        .where("payment_link_id", paymentLinkId)
        .where("status", "confirmed")
        .where("created_at", ">=", db.raw("CURRENT_DATE - INTERVAL '30 days'"))
        .select(
          db.raw("DATE(created_at) as date"),
          db.raw("COALESCE(SUM(amount::numeric), 0) as amount"),
          db.raw("COUNT(*) as count"),
        )
        .groupBy(db.raw("DATE(created_at)"))
        .orderBy("date", "desc")

      // Get top payers
      const topPayers = await db("transactions")
        .leftJoin("users", "transactions.from_user_id", "users.id")
        .where("transactions.payment_link_id", paymentLinkId)
        .where("transactions.status", "confirmed")
        .select(
          "users.username",
          "users.full_name",
          db.raw("COALESCE(SUM(transactions.amount::numeric), 0) as amount"),
          db.raw("COUNT(*) as count"),
        )
        .groupBy("users.id", "users.username", "users.full_name")
        .orderBy("amount", "desc")
        .limit(10)

      return {
        totalAmount: stats.total_amount.toString(),
        totalTransactions: Number.parseInt(stats.total_transactions),
        successfulTransactions: Number.parseInt(stats.successful_transactions),
        failedTransactions: Number.parseInt(stats.failed_transactions),
        averageAmount: stats.average_amount.toString(),
        dailyStats: dailyStats.map((stat: { date: string; amount: any; count: any }) => ({
          date: stat.date,
          amount: stat.amount.toString(),
          count: Number.parseInt(stat.count),
        })),
        topPayers: topPayers.map((payer) => ({
          username: payer.username || "Anonymous",
          fullName: payer.full_name || "Anonymous User",
          amount: payer.amount.toString(),
          count: Number.parseInt(payer.count),
        })),
      }
    } catch (error) {
      logger.error("Analytics fetch error:", error)
      throw error
    }
  },

  // Clean up expired links (can be run as a cron job)
  async cleanupExpiredLinks(): Promise<void> {
    try {
      const result = await db("payment_links").where("is_active", true).where("expires_at", "<=", new Date()).update({
        is_active: false,
        updated_at: new Date(),
      })

      logger.info(`Cleaned up ${result} expired payment links`)
    } catch (error) {
      logger.error("Cleanup expired links error:", error)
      throw error
    }
  },
}
