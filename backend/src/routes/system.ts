import express from "express"
import { systemController } from "../controllers/systemController.js"

const router = express.Router()

// GET /api/system/health
router.get("/health", systemController.healthCheck)

// GET /api/system/stats
router.get("/stats", systemController.getSystemStats)

export default router
