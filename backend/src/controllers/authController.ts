import type { Response } from "express"
import { PrivyClient } from "@privy-io/server-auth"
import db from "../config/database.js"
import logger from "../utils/logger.js"
import { asyncHandler } from "../middleware/errorMiddleware.js"
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js"
import sequelize from "../config/sequelize.js"
import { QueryTypes } from "sequelize"
import { v4 as uuidv4 } from 'uuid'
import jwt from "jsonwebtoken"

const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

export const authController = {
  // POST /api/auth/login
  login: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { privyToken, walletAddress } = req.body

    try {
      // Verify Privy token
      const verifiedClaims = await privy.verifyAuthToken(privyToken)

      if (!verifiedClaims.userId) {
        return res.status(401).json({ error: "Invalid Privy token" })
      }

      // Check if user exists
      let user = await db("users").where("privy_id", verifiedClaims.userId).first()

      // Create user if doesn't exist
      if (!user) {
        const [newUser] = await db("users")
          .insert({
            privy_id: verifiedClaims.userId,
            wallet_address: walletAddress.toLowerCase(),
          })
          .returning("*")

        user = newUser
        logger.info(`New user created: ${user.id}`)
      } else {
        // Update wallet address if changed
        if (user.wallet_address !== walletAddress.toLowerCase()) {
          await db("users").where("id", user.id).update({
            wallet_address: walletAddress.toLowerCase(),
            updated_at: new Date(),
          })
        }
      }

      // include jwt token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "24h" })
      res.json({
        success: true,
        user: {
          id: user.id,
          privyId: user.privy_id,
          walletAddress: user.wallet_address,
          username: user.username,
          fullName: user.full_name,
          age: user.age,
          hasCompletedOnboarding: !!(user.username && user.full_name && user.age),
          token: token,
        },
        token: token,
      })
    } catch (error) {
      logger.error("Login error:", error)
      res.status(500).json({ error: "Login failed" })
    }
  }),

  // POST /api/users/register
  registerUser: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as any
    const { privyId, walletAddress, username, fullName, age } = body

    const email = body.email || null
    const id = uuidv4()
    
    if (!privyId || !walletAddress || !username || !fullName || !age) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: privyId, walletAddress, username, fullName, age"
      })
    }

    try {
      // Check if user already exists
      const existingUser = await sequelize.query(
        'SELECT id FROM users WHERE privy_id = ? OR wallet_address = ? OR username = ?',
        {
          replacements: [privyId, walletAddress, username],
          type: QueryTypes.SELECT
        }
      )

      if (existingUser.length > 0) {
        return res.status(400).json({ 
          success: false,
          error: "User already exists with this Privy ID, wallet address, or username" 
        })
      }

      // Create new user
      const [newUser] = await sequelize.query(
        `INSERT INTO users (id, privy_id, wallet_address, username, full_name, age, email, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
        {
          replacements: [id, privyId, walletAddress, username, fullName, age, email],
          type: QueryTypes.INSERT
        }
      )

      logger.info(`New user registered: ${username} (${walletAddress})`)

      res.status(201).json({
        success: true,
        data: {
          id: newUser,
          privyId,
          walletAddress,
          username,
          fullName,
          age,
          email,
          isActive: true
        }
      })
    } catch (error) {
      logger.error("User registration error:", error)
      res.status(500).json({ 
        success: false,
        error: "Failed to register user" 
      })
    }
  }),

  // POST /api/auth/logout
  logout: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // In a stateless JWT system, logout is handled client-side
    // But we can log the event for analytics
    logger.info(`User logged out: ${req.user?.id}`)

    res.json({ success: true, message: "Logged out successfully" })
  }),

  // POST /api/auth/verify
  verifyToken: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { token } = req.body

    try {
      const verifiedClaims = await privy.verifyAuthToken(token)

      if (!verifiedClaims.userId) {
        return res.status(401).json({ valid: false, error: "Invalid token" })
      }

      const user = await db("users").where("privy_id", verifiedClaims.userId).first()

      if (!user || !user.is_active) {
        return res.status(401).json({ valid: false, error: "User not found or inactive" })
      }

      res.json({
        valid: true,
        user: {
          id: user.id,
          privyId: user.privy_id,
          walletAddress: user.wallet_address,
          username: user.username,
          fullName: user.full_name,
        },
      })
    } catch (error) {
      logger.error("Token verification error:", error)
      res.status(401).json({ valid: false, error: "Token verification failed" })
    }
  }),
}
