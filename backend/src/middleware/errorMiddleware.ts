import type { Request, Response, NextFunction } from "express"
import logger from "../utils/logger.js"

interface CustomError extends Error {
  statusCode?: number
}

export const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack)

  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as CustomError
  error.statusCode = 404
  next(error)
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next)
