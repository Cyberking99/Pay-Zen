import express from "express"
import { body } from "express-validator"
import { authController } from "../controllers/authController.js"
import { validateRequest } from "../middleware/validateRequest.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const router = express.Router()

// POST /api/auth/login
router.post(
  "/login",
  [
    body("privyToken").notEmpty().withMessage("Privy token is required"),
    body("walletAddress").isEthereumAddress().withMessage("Valid wallet address is required"),
  ],
  validateRequest,
  authController.login,
)

// POST /api/auth/logout
router.post("/logout", authController.logout)

// POST /api/auth/verify
router.post("/verify", authController.verifyToken)

// GET /api/auth/me
router.get("/me", authMiddleware, authController.me)

export default router
