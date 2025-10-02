import type { Response } from "express"
import { ethers } from "ethers"
import { v4 as uuidv4 } from "uuid"
import db from "../config/database.js"
import logger from "../utils/logger.js"
import { asyncHandler } from "../middleware/errorMiddleware.js"
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js"
import { paymentLinkService } from "../services/paymentLinkService.js"
import { blockchainService } from "../services/blockchainService.js"

export const paymentLinkController = {
  // POST /api/payment-links/create
  createPaymentLink: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, amount, expirationType, expiresAt, maxUses, customFields } = req.body
    const userId = req.user!.id

    try {
      // Generate unique link ID
      const linkId = uuidv4()

      // Validate expiration
      if (expirationType === "time-based" && !expiresAt) {
        return res.status(400).json({ error: "Expiration date is required for time-based links" })
      }

      // Validate custom fields
      if (customFields && !paymentLinkService.validateCustomFields(customFields)) {
        return res.status(400).json({ error: "Invalid custom fields format" })
      }

      // Create payment link
      const [paymentLink] = await db("payment_links")
        .insert({
          id: uuidv4(),
          creator_id: userId,
          link_id: linkId,
          title: title || null,
          description: description || null,
          amount: amount ? ethers.formatUnits(ethers.parseUnits(amount.toString(), 6), 6) : null,
          expiration_type: expirationType,
          expires_at: expirationType === "time-based" ? new Date(expiresAt) : null,
          max_uses: maxUses || null,
          custom_fields: customFields ? JSON.stringify(customFields) : '[]',
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*")

      logger.info(`Payment link created: ${linkId} by user ${userId}`)

      res.json({
        success: true,
        paymentLink: {
          id: paymentLink.id,
          linkId: paymentLink.link_id,
          title: paymentLink.title,
          description: paymentLink.description,
          amount: paymentLink.amount,
          expirationType: paymentLink.expiration_type,
          expiresAt: paymentLink.expires_at,
          maxUses: paymentLink.max_uses,
          customFields: paymentLink.custom_fields,
          isActive: paymentLink.is_active,
          usageCount: paymentLink.usage_count,
          createdAt: paymentLink.created_at,
          url: `${process.env.FRONTEND_URL}/pay/${linkId}`,
          creatorAddress: null, // Placeholder, will be fetched later
        },
      })
    } catch (error) {
      logger.error("Payment link creation error:", error)
      res.status(500).json({ error: "Failed to create payment link" })
    }
  }),

  // GET /api/payment-links
  getPaymentLinks: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id
    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Number.parseInt(req.query.limit as string) || 20
    const status = req.query.status as string

    try {
      let query = db("payment_links").where("creator_id", userId)

      // Filter by status
      if (status === "active") {
        query = query.where("is_active", true).where((builder) => {
          builder
            .whereNull("expires_at")
            .orWhere("expires_at", ">", new Date())
            .where((subBuilder) => {
              subBuilder.whereNull("max_uses").orWhereRaw("usage_count < max_uses")
            })
        })
      } else if (status === "inactive") {
        query = query.where("is_active", false)
      } else if (status === "expired") {
        query = query.where((builder) => {
          builder
            .where("expires_at", "<=", new Date())
            .orWhereRaw("usage_count >= max_uses")
            .where("max_uses", "is not", null)
        })
      }

      // Get total count
      const totalQuery = query.clone()
      const countResult = await totalQuery.count("* as count");
      const count = countResult?.[0]?.count ?? 0;

      // Get paginated results
      const paymentLinks = await query
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset((page - 1) * limit)

      // Format results
      const formattedLinks = paymentLinks.map((link) => ({
        id: link.id,
        linkId: link.link_id,
        title: link.title,
        description: link.description,
        amount: link.amount,
        expirationType: link.expiration_type,
        expiresAt: link.expires_at,
        maxUses: link.max_uses,
        isActive: link.is_active,
        usageCount: link.usage_count,
        createdAt: link.created_at,
        url: `${process.env.FRONTEND_URL}/pay/${link.link_id}`,
        status: paymentLinkService.getLinkStatus(link),
      }))

      res.json({
        paymentLinks: formattedLinks,
        pagination: {
          page,
          limit,
          total: Number.parseInt(count.toString()),
          pages: Math.ceil(Number.parseInt(count.toString()) / limit),
        },
      })
    } catch (error) {
      logger.error("Payment links fetch error:", error)
      res.status(500).json({ error: "Failed to fetch payment links" })
    }
  }),

  // GET /api/payment-links/:id
  getPaymentLinkDetails: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const userId = req.user!.id

    try {
      const paymentLink = await db("payment_links").where("link_id", id).first()

      if (!paymentLink) {
        return res.status(404).json({ error: "Payment link not found" })
      }

      // Fetch creator's wallet address
      const creator = await db("users").where("id", paymentLink.creator_id).first()

      // Get recent transactions for this link
      const recentTransactions = await db("transactions")
        .leftJoin("users", "transactions.from_user_id", "users.id")
        .where("transactions.payment_link_id", id)
        .select(
          "transactions.id",
          "transactions.amount",
          "transactions.status",
          "transactions.created_at",
          "users.username",
          "users.full_name",
        )
        .orderBy("transactions.created_at", "desc")
        .limit(10)

      res.json({
        id: paymentLink.id,
        linkId: paymentLink.link_id,
        title: paymentLink.title,
        description: paymentLink.description,
        amount: paymentLink.amount,
        expirationType: paymentLink.expiration_type,
        expiresAt: paymentLink.expires_at,
        maxUses: paymentLink.max_uses,
        customFields: paymentLink.custom_fields,
        isActive: paymentLink.is_active,
        usageCount: paymentLink.usage_count,
        createdAt: paymentLink.created_at,
        updatedAt: paymentLink.updated_at,
        url: `${process.env.FRONTEND_URL}/pay/${paymentLink.link_id}`,
        status: paymentLinkService.getLinkStatus(paymentLink),
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx.id,
          amount: tx.amount,
          status: tx.status,
          createdAt: tx.created_at,
          payer: {
            username: tx.username,
            fullName: tx.full_name,
          },
        })),
        creatorAddress: creator?.wallet_address || null,
      })
    } catch (error) {
      logger.error("Payment link details error:", error)
      res.status(500).json({ error: "Failed to fetch payment link details" })
    }
  }),

  // PUT /api/payment-links/:id/deactivate
  deactivatePaymentLink: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const userId = req.user!.id

    try {
      const [updatedLink] = await db("payment_links")
        .where("id", id)
        .where("creator_id", userId)
        .update({
          is_active: false,
          updated_at: new Date(),
        })
        .returning("*")

      if (!updatedLink) {
        return res.status(404).json({ error: "Payment link not found" })
      }

      logger.info(`Payment link deactivated: ${id} by user ${userId}`)

      res.json({
        success: true,
        message: "Payment link deactivated successfully",
      })
    } catch (error) {
      logger.error("Payment link deactivation error:", error)
      res.status(500).json({ error: "Failed to deactivate payment link" })
    }
  }),

  // GET /api/payment-links/:id/analytics
  getPaymentLinkAnalytics: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const userId = req.user!.id

    try {
      const paymentLink = await db("payment_links").where("id", id).where("creator_id", userId).first()

      if (!paymentLink) {
        return res.status(404).json({ error: "Payment link not found" })
      }

      // Get analytics data
      if (!id) throw new Error("id is required")
      const analytics = await paymentLinkService.getAnalytics(id)

      res.json({
        linkId: paymentLink.link_id,
        title: paymentLink.title,
        totalAmount: analytics.totalAmount,
        totalTransactions: analytics.totalTransactions,
        successfulTransactions: analytics.successfulTransactions,
        failedTransactions: analytics.failedTransactions,
        averageAmount: analytics.averageAmount,
        dailyStats: analytics.dailyStats,
        topPayers: analytics.topPayers,
        createdAt: paymentLink.created_at,
      })
    } catch (error) {
      logger.error("Payment link analytics error:", error)
      res.status(500).json({ error: "Failed to fetch analytics" })
    }
  }),

  // GET /api/public/payment-links/:linkId (public endpoint)
  getPublicPaymentLink: asyncHandler(async (req: any, res: Response) => {
    const { linkId } = req.params

    try {
      const paymentLink = await db("payment_links")
        .leftJoin("users", "payment_links.creator_id", "users.id")
        .where("payment_links.link_id", linkId)
        .select("payment_links.*", "users.username as creator_username", "users.full_name as creator_full_name")
        .first()

      if (!paymentLink) {
        return res.status(404).json({ error: "Payment link not found" })
      }

      // Check if link is valid
      const status = paymentLinkService.getLinkStatus(paymentLink)
      if (status !== "active") {
        return res.status(400).json({ error: "Payment link is no longer active" })
      }

      res.json({
        linkId: paymentLink.link_id,
        title: paymentLink.title,
        description: paymentLink.description,
        amount: paymentLink.amount,
        customFields: paymentLink.custom_fields,
        creator: {
          username: paymentLink.creator_username,
          fullName: paymentLink.creator_full_name,
        },
        expirationType: paymentLink.expiration_type,
        expiresAt: paymentLink.expires_at,
        usageCount: paymentLink.usage_count,
        maxUses: paymentLink.max_uses,
      })
    } catch (error) {
      logger.error("Public payment link fetch error:", error)
      res.status(500).json({ error: "Failed to fetch payment link" })
    }
  }),

  // POST /api/public/payment-links/:linkId/pay (public endpoint)
  processPaymentLink: asyncHandler(async (req: any, res: Response) => {
    const { linkId } = req.params
    const { payerAddress, txHash, customFieldData, network = "ethereum" } = req.body

    try {
      const paymentLink = await db("payment_links").where("link_id", linkId).first()

      if (!paymentLink) {
        return res.status(404).json({ error: "Payment link not found" })
      }

      // Check if link is valid
      const status = paymentLinkService.getLinkStatus(paymentLink)
      if (status !== "active") {
        return res.status(400).json({ error: "Payment link is no longer active" })
      }

      // Verify transaction on blockchain
      const receipt = await blockchainService.getTransactionReceipt(txHash, network)
      if (!receipt || receipt.status !== 1) {
        return res.status(400).json({ error: "Transaction not found or failed" })
      }

      // Get payer user (if exists)
      const payerUser = await db("users").where("wallet_address", payerAddress.toLowerCase()).first()

      // Create transaction record
      const [transaction] = await db("transactions")
        .insert({
          tx_hash: txHash,
          from_user_id: payerUser?.id || null,
          to_user_id: paymentLink.creator_id,
          from_address: payerAddress.toLowerCase(),
          to_address: receipt.to?.toLowerCase() ?? "",
          amount: paymentLink.amount,
          payment_link_id: paymentLink.id,
          status: "confirmed",
          block_number: receipt.blockNumber,
          gas_used: receipt.gasUsed.toString(),
          gas_price: receipt.gasPrice?.toString() || null,
          network,
        })
        .returning("*")

      // Update payment link usage count
      await db("payment_links").where("id", paymentLink.id).increment("usage_count", 1).update("updated_at", new Date())

      // Deactivate if one-time link
      if (paymentLink.expiration_type === "one-time") {
        await db("payment_links").where("id", paymentLink.id).update("is_active", false)
      }

      logger.info(`Payment processed for link ${linkId}: ${transaction.id}`)

      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          txHash: transaction.tx_hash,
          amount: transaction.amount,
          status: transaction.status,
        },
      })
    } catch (error) {
      logger.error("Payment link processing error:", error)
      res.status(500).json({ error: "Failed to process payment" })
    }
  }),

  // PUT /api/payment-links/:id
  updatePaymentLink: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params
    const { title, description, customFields } = req.body
    const userId = req.user!.id

    try {
      // Validate custom fields
      if (customFields && !paymentLinkService.validateCustomFields(customFields)) {
        return res.status(400).json({ error: "Invalid custom fields format" })
      }

      const [updatedLink] = await db("payment_links")
        .where("id", id)
        .where("creator_id", userId)
        .update({
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(customFields !== undefined && { custom_fields: customFields }),
          updated_at: new Date(),
        })
        .returning("*")

      if (!updatedLink) {
        return res.status(404).json({ error: "Payment link not found" })
      }

      res.json({
        success: true,
        paymentLink: {
          id: updatedLink.id,
          linkId: updatedLink.link_id,
          title: updatedLink.title,
          description: updatedLink.description,
          customFields: updatedLink.custom_fields,
          updatedAt: updatedLink.updated_at,
        },
      })
    } catch (error) {
      logger.error("Payment link update error:", error)
      res.status(500).json({ error: "Failed to update payment link" })
    }
  }),

  payWithBackend: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { linkId } = req.params
    const { amount, customFields, payerName, payerEmail } = req.body
    const userId = req.user?.id || null

    try {
      // Fetch payment link
      const paymentLink = await db("payment_links").where("link_id", linkId).first()
      if (!paymentLink) {
        return res.status(404).json({ error: "Payment link not found" })
      }
      // Validate amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ error: "Invalid amount" })
      }
      // Validate custom fields
      if (paymentLink.custom_fields) {
        const requiredFields = paymentLink.custom_fields.filter((f: any) => f.required)
        for (const field of requiredFields) {
          if (!customFields || !customFields[field.name]) {
            return res.status(400).json({ error: `Missing required field: ${field.name}` })
          }
        }
      }
      // Log payment (as a transaction)
      const [transaction] = await db("transactions")
        .insert({
          from_user_id: userId,
          to_user_id: paymentLink.creator_id,
          from_address: req.user?.walletAddress || null,
          to_address: null,
          amount,
          memo: `Backend payment for link ${linkId}`,
          status: "confirmed",
          network: "backend",
          payment_link_id: paymentLink.id,
          custom_fields: customFields ? JSON.stringify(customFields) : '{}',
          payer_name: payerName || null,
          payer_email: payerEmail || null,
        })
        .returning("*")
      res.json({
        success: true,
        receipt: {
          id: transaction.id,
          linkId,
          amount: transaction.amount,
          payerName: transaction.payer_name,
          payerEmail: transaction.payer_email,
          customFields: transaction.custom_fields,
          createdAt: transaction.created_at,
        },
      })
    } catch (error) {
      logger.error("Backend payment error:", error)
      res.status(500).json({ error: "Failed to log payment" })
    }
  }),
}
