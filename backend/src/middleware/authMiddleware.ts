import type { Request, Response, NextFunction } from "express"
import { PrivyClient } from "@privy-io/server-auth"
import db from "../config/database.js"
import logger from "../utils/logger.js"

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    privyId: string
    walletAddress: string
    username?: string
    fullName?: string
  }
}

const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    // Verify Privy token
    const verifiedClaims = await privy.verifyAuthToken(token)

    console.log("verifiedClaims", verifiedClaims)

    if (!verifiedClaims.userId) {
      return res.status(401).json({ error: "Invalid token" })
    }

    // Get user from database
    const user = await db("users").where("privy_id", verifiedClaims.userId).first()

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    if (!user.is_active) {
      return res.status(401).json({ error: "Account deactivated" })
    }

    req.user = {
      id: user.id,
      privyId: user.privy_id,
      walletAddress: user.wallet_address,
      username: user.username,
      fullName: user.full_name,
    }

    next()
  } catch (error) {
    logger.error("Auth middleware error:", error)
    res.status(401).json({ error: "Authentication failed" })
  }
}

export type { AuthenticatedRequest }
