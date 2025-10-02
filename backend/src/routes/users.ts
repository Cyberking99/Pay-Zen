import express from "express"
import { body, param } from "express-validator"
import { userController } from "../controllers/userController.js"
import { validateRequest } from "../middleware/validateRequest.js"
import { authController } from "../controllers/authController.js"

const router = express.Router()

// GET /api/users/profile
router.get("/profile", userController.getProfile)

// PUT /api/users/profile
router.put(
  "/profile",
  [
    body("username")
      .optional()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username must be 3-50 characters and contain only letters, numbers, and underscores"),
    body("fullName").optional().isLength({ min: 1, max: 255 }).withMessage("Full name must be 1-255 characters"),
    body("age").optional().isInt({ min: 13, max: 120 }).withMessage("Age must be between 13 and 120"),
  ],
  validateRequest,
  userController.updateProfile,
)

// GET /api/users/balance
router.get("/balance", userController.getBalance)

// GET /api/users/search
router.get(
  "/search",
  userController.searchUsers,
)

// POST /api/users/register
// router.post(
//   "/register",
//   [
//     body("privyId").isString().notEmpty().withMessage("Privy ID is required"),
//     body("walletAddress").isString().isLength({ min: 42, max: 42 }).withMessage("Invalid wallet address"),
//     body("username").isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/).withMessage("Invalid username format"),
//     body("fullName").isLength({ min: 1, max: 255 }).withMessage("Full name is required"),
//     body("age").isInt({ min: 13, max: 120 }).withMessage("Age must be between 13 and 120"),
//     body("email").optional().isEmail().withMessage("Invalid email format"),
//   ],
//   validateRequest,
//   authController.registerUser,
// )

// GET /api/users/check-username/:username
router.get(
  "/check-username/:username",
  [
    param("username")
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Invalid username format"),
  ],
  validateRequest,
  userController.checkUsername,
)

export default router
