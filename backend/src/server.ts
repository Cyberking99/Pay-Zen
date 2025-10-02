import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import compression from "compression"
import rateLimit from "express-rate-limit"
import { createServer } from "http"
import { Server } from "socket.io"

import { errorHandler, notFound } from "./middleware/errorMiddleware.js"
import { authMiddleware } from "./middleware/authMiddleware.js"
import logger from "./utils/logger.js"
import { connectDatabase } from "./config/sequelize.js"
import { connectRedis } from "./config/redis.js"
import { startBlockchainMonitoring } from "./services/blockchainMonitorService.js"
import { initializeQueues } from "./services/queueService.js"

// Routes
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/users.js"
import transactionRoutes from "./routes/transactions.js"
import paymentLinkRoutes from "./routes/paymentLinks.js"
import systemRoutes from "./routes/system.js"
import publicRoutes from "./routes/public.js"

import { userController } from "./controllers/userController.js";
import { param, body } from "express-validator";
import { validateRequest } from "./middleware/validateRequest.js";
import { authController } from "./controllers/authController.js"

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

const PORT = process.env.PORT || 5000

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(compression())
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(limiter)

// Routes
app.use("/api/auth", authRoutes)
app.get(
  "/api/users/check-username/:username",
  [
    param("username")
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Invalid username format"),
    validateRequest,
  ],
  userController.checkUsername
)
app.post(
  "/api/users/register",
  [
    body("privyId").isString().notEmpty().withMessage("Privy ID is required"),
    body("walletAddress").isString().isLength({ min: 42, max: 42 }).withMessage("Invalid wallet address"),
    body("username").isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/).withMessage("Invalid username format"),
    body("fullName").isLength({ min: 1, max: 255 }).withMessage("Full name is required"),
    body("age").isInt({ min: 13, max: 120 }).withMessage("Age must be between 13 and 120"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
  ],
  validateRequest,
  authController.registerUser,
)

app.use("/api/users", authMiddleware, userRoutes)
app.use("/api/transactions", authMiddleware, transactionRoutes)
app.use("/api/payment-links", authMiddleware, paymentLinkRoutes)
app.use("/api/system", systemRoutes)
app.use("/api/public", publicRoutes)

// Error handling
app.use(notFound)
app.use(errorHandler)

// Socket.io connection handling
io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`)

  socket.on("join-user-room", (userId) => {
    socket.join(`user-${userId}`)
    logger.info(`User ${userId} joined their room`)
  })

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`)
  })
})

// Make io available to routes
app.set("io", io)

async function startServer() {
  try {
    // Connect to database
    await connectDatabase()
    logger.info("Database connected successfully")

    // Connect to Redis
    await connectRedis()
    logger.info("Redis connected successfully")

    await initializeQueues()
    logger.info("Job queues initialized")

    await startBlockchainMonitoring(io)
    logger.info("Blockchain monitoring started")

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

export { io }
