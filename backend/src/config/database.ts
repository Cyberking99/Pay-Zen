import knex from "knex"
import dotenv from "dotenv"

dotenv.config()

const config = {
  client: "mysql",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "stable",
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
}

const db = knex(config)

export const connectDatabase = async () => {
  try {
    await db.raw("SELECT 1")
    return db
  } catch (error) {
    throw new Error(`Database connection failed: ${error}`)
  }
}

export default db
