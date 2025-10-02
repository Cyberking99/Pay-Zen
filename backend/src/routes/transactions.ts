import express from "express"
import { body, query } from "express-validator"
import { transactionController } from "../controllers/transactionController.js"
import { validateRequest } from "../middleware/validateRequest.js"

const router = express.Router()

// POST /api/transactions/send
router.post(
  "/send",
  [
    body("recipient").notEmpty().withMessage("Recipient is required"),
    body("amount").isNumeric().isFloat({ min: 0.000001 }).withMessage("Amount must be a positive number"),
    body("memo").optional().isLength({ max: 500 }).withMessage("Memo must be less than 500 characters"),
    body("network").optional().isIn(["ethereum", "polygon", "sepolia"]).withMessage("Invalid network"),
  ],
  validateRequest,
  transactionController.sendTransaction,
)

// GET /api/transactions/history
router.get(
  "/history",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("status").optional().isIn(["pending", "confirmed", "failed"]).withMessage("Invalid status"),
    query("type").optional().isIn(["sent", "received", "all"]).withMessage("Invalid type"),
  ],
  validateRequest,
  transactionController.getTransactionHistory,
)

// POST /api/transactions/estimate-fee
router.post(
  "/estimate-fee",
  [
    body("recipient").notEmpty().withMessage("Recipient is required"),
    body("amount").isNumeric().isFloat({ min: 0.000001 }).withMessage("Amount must be a positive number"),
    body("network").optional().isIn(["ethereum", "polygon", "sepolia"]).withMessage("Invalid network"),
  ],
  validateRequest,
  transactionController.estimateFee,
)

// POST /api/transactions/validate-recipient
router.post(
  "/validate-recipient",
  [body("recipient").notEmpty().withMessage("Recipient is required")],
  validateRequest,
  transactionController.validateRecipient,
)

// POST /api/transactions/record
router.post("/record", transactionController.recordTransaction)

// GET /api/transactions/:id
router.get("/:id", transactionController.getTransactionDetails)

export default router
