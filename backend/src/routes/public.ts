import express from "express"
import { body } from "express-validator"
import { paymentLinkController } from "../controllers/paymentLinkController.js"
import { validateRequest } from "../middleware/validateRequest.js"

const router = express.Router()

// GET /api/public/payment-links/:linkId
router.get("/payment-links/:linkId", paymentLinkController.getPublicPaymentLink)

// POST /api/public/payment-links/:linkId/pay
router.post(
  "/payment-links/:linkId/pay",
  [
    body("payerAddress").isEthereumAddress().withMessage("Valid payer address is required"),
    body("txHash")
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage("Valid transaction hash is required"),
    body("customFieldData").optional().isObject().withMessage("Custom field data must be an object"),
    body("network").optional().isIn(["ethereum", "polygon", "sepolia"]).withMessage("Invalid network"),
  ],
  validateRequest,
  paymentLinkController.processPaymentLink,
)

export default router
