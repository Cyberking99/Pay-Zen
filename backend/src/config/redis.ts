import { createClient } from "redis"
import logger from "../utils/logger.js"

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})

client.on("error", (err) => {
  logger.error("Redis Client Error:", err)
})

client.on("connect", () => {
  logger.info("Redis Client Connected")
})

export const connectRedis = async () => {
  await client.connect()
  return client
}

export default client
