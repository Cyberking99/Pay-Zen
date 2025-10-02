import type { Response } from "express"
import { ethers } from "ethers"
import db from "../config/database.js"
import logger from "../utils/logger.js"
import { asyncHandler } from "../middleware/errorMiddleware.js"
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js"
import { getUSDCBalance } from "../services/blockchainService.js"
import sequelize from "../config/sequelize.js"
import { QueryTypes } from "sequelize"

export const userController = {
  // GET /api/users/profile
  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await db("users").where("id", req.user!.id).first()

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      id: user.id,
      privyId: user.privy_id,
      walletAddress: user.wallet_address,
      username: user.username,
      fullName: user.full_name,
      age: user.age,
      email: user.email,
      createdAt: user.created_at,
      hasCompletedOnboarding: !!(user.username && user.full_name && user.age),
    })
  }),

  // PUT /api/users/profile
  updateProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { username, fullName, age } = req.body
    const userId = req.user!.id

    try {
      // Check if username is already taken (if provided)
      if (username) {
        const existingUser = await db("users").where("username", username).where("id", "!=", userId).first()

        if (existingUser) {
          return res.status(400).json({ error: "Username already taken" })
        }
      }

      // Update user profile
      const [updatedUser] = await db("users")
        .where("id", userId)
        .update({
          ...(username && { username }),
          ...(fullName && { full_name: fullName }),
          ...(age && { age }),
          updated_at: new Date(),
        })
        .returning("*")

      logger.info(`User profile updated: ${userId}`)

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          privyId: updatedUser.privy_id,
          walletAddress: updatedUser.wallet_address,
          username: updatedUser.username,
          fullName: updatedUser.full_name,
          age: updatedUser.age,
          hasCompletedOnboarding: !!(updatedUser.username && updatedUser.full_name && updatedUser.age),
        },
      })
    } catch (error) {
      logger.error("Profile update error:", error)
      res.status(500).json({ error: "Failed to update profile" })
    }
  }),

  // GET /api/users/balance
  getBalance: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const walletAddress = req.user!.walletAddress
      const network = (req.query.network as string) || "ethereum"

      const balance = await getUSDCBalance(walletAddress, network)

      res.json({
        balance: balance.toString(),
        formatted: ethers.formatUnits(balance, 6), // USDC has 6 decimals
        network,
        walletAddress,
      })
    } catch (error) {
      logger.error("Balance fetch error:", error)
      res.status(500).json({ error: "Failed to fetch balance" })
    }
  }),

  // GET /api/users/search
  searchUsers: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query } = req.query as { query: string }

    try {
      // Search for exact username match (case-insensitive)
      const users = await db("users")
        .whereRaw('LOWER(username) = ?', [query.toLowerCase()])
        .where("is_active", true)
        .where("id", "!=", req.user!.id) // Exclude current user
        .select("id", "username", "full_name", "wallet_address")
        .limit(1)

      const user = users[0] || null
      res.json({ user })
    } catch (error) {
      logger.error("User search error:", error)
      res.status(500).json({ error: "Search failed" })
    }
  }),

  // GET /api/users/check-username/:username
  checkUsername: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { username } = req.params

    try {
      const [existingUser] = await sequelize.query(
        'SELECT id FROM users WHERE username = ?',
        {
          replacements: [username],
          type: QueryTypes.SELECT
        }
      )

      res.json({
        success: true,
        data: {
          available: !existingUser,
          username,
        }
      })
    } catch (error) {
      logger.error("Username check error:", error)
      res.status(500).json({ error: "Username check failed" })
    }
  }),
}
