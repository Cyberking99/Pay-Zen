import { apiClient } from "./config"
import type { ApiResponse } from "./types"

export interface HealthStatus {
  status: "healthy" | "degraded" | "down"
  database: boolean
  blockchain: boolean
  timestamp: string
}

export interface SyncRequest {
  walletAddress: string
  fromBlock?: number
}

export const systemService = {
  // Health check
  async getHealth(): Promise<HealthStatus> {
    const response = await apiClient.get<ApiResponse<HealthStatus>>("/system/health")

    if (response.data.success) {
      return response.data.data
    }

    throw new Error("System health check failed")
  },

  // Sync blockchain state
  async syncBlockchain(data: SyncRequest): Promise<{ synced: boolean; latestBlock: number }> {
    const response = await apiClient.post<ApiResponse<{ synced: boolean; latestBlock: number }>>(
      "/blockchain/sync",
      data,
    )

    if (response.data.success) {
      return response.data.data
    }

    throw new Error(response.data.error || "Failed to sync blockchain")
  },
}
