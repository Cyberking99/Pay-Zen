import express from "express"
import { body, query } from "express-validator"
import { paymentLinkController } from "../controllers/paymentLinkController.js"
import { validateRequest } from "../middleware/validateRequest.js"

const router = express.Router()

// POST /api/payment-links/create
router.post(
  "/create",
  [
    body("title").isLength({ max: 255 }).withMessage("Title must be less than 255 characters"),
    body("description").optional().isLength({ max: 1000 }).withMessage("Description must be less than 1000 characters"),
    body("amount").optional().isNumeric().isFloat({ min: 0.000001 }).withMessage("Amount must be a positive number"),
    body("expirationType")
      .isIn(["one-time", "time-based", "public"])
      .withMessage("Expiration type must be one-time, time-based, or public"),
    body("expiresAt").optional().isISO8601().withMessage("Invalid expiration date"),
    body("maxUses").optional().isInt({ min: 1 }).withMessage("Max uses must be a positive integer"),
    body("customFields").optional().isArray().withMessage("Custom fields must be an array"),
  ],
  validateRequest,
  paymentLinkController.createPaymentLink,
)

// GET /api/payment-links
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("status").optional().isIn(["active", "inactive", "expired"]).withMessage("Invalid status"),
  ],
  validateRequest,
  paymentLinkController.getPaymentLinks,
)

// GET /api/payment-links/:id
router.get("/:id", paymentLinkController.getPaymentLinkDetails)

// PUT /api/payment-links/:id/deactivate
router.put("/:id/deactivate", paymentLinkController.deactivatePaymentLink)

// GET /api/payment-links/:id/analytics
router.get("/:id/analytics", paymentLinkController.getPaymentLinkAnalytics)

// PUT /api/payment-links/:id
router.put(
  "/:id",
  [
    body("title").optional().isLength({ max: 255 }).withMessage("Title must be less than 255 characters"),
    body("description").optional().isLength({ max: 1000 }).withMessage("Description must be less than 1000 characters"),
    body("customFields").optional().isArray().withMessage("Custom fields must be an array"),
  ],
  validateRequest,
  paymentLinkController.updatePaymentLink,
)

router.post('/:linkId/pay', paymentLinkController.payWithBackend)

export default router
