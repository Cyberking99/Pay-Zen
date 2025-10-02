import { getAccessToken } from "@privy-io/react-auth"
import { apiClient } from "./config"
import type { ApiResponse, PaginatedResponse, Transaction, SendMoneyRequest } from "./types"

export interface TransactionHistoryParams {
  page?: number
  limit?: number
  status?: "pending" | "confirmed" | "failed"
  search?: string
  startDate?: string
  endDate?: string
}

export interface EstimateFeeRequest {
  recipient: string
  amount: string
  recipientType: "username" | "address"
}

export interface EstimateFeeResponse {
  gasLimit: string
  gasPrice: string
  totalCost: string
  estimatedTime: string
}

export const transactionService = {
  // Send money
  async sendMoney(data: SendMoneyRequest): Promise<{ txHash: string; transactionId: string }> {
    const authToken = await getAccessToken()
    if (!authToken) {
      throw new Error("No auth token found")
    }

    const response = await apiClient.post<ApiResponse<{ txHash: string; transactionId: string }>>(
      "/transactions/send",
      data,
      {
        headers: {
          "X-Authorization-Override": `Bearer ${authToken}`,
        },
      },
    )

    if (response.status === 200) {
      console.log(response)
      // return response.data.txHash
    }

    throw new Error(response.data.error || "Failed to send money")
  },

  async recordTransaction(data: any): Promise<boolean> {
    const authToken = await getAccessToken()
    if (!authToken) {
      throw new Error("No auth token found")
    }
    
    const response = await apiClient.post<ApiResponse<void>>("/transactions/record", data, {
      headers: {
        "X-Authorization-Override": `Bearer ${authToken}`,
      },
    })
    
    if (response.status === 200) {
      console.log(response)
      return true;
    }

    throw new Error(response.data.error || "Failed to record transaction")
  },

  // Get transaction history
  async getHistory(params: TransactionHistoryParams = {}): Promise<PaginatedResponse<Transaction>> {
    const authToken = await getAccessToken()
    if (!authToken) {
      throw new Error("No auth token found")
    }

    const response = await apiClient.get("/transactions/history", {
      params,
      headers: {
        "X-Authorization-Override": `Bearer ${authToken}`,
      },
    })

    console.log(response)
    console.log(response.data)
    if (response.status === 200) {
      return {
        data: response.data.transactions,
        pagination: response.data.pagination,
      }
    }

    throw new Error(response.data.error || "Failed to get transaction history")
  },

  // Get specific transaction
  async getTransaction(id: string): Promise<Transaction> {
    const response = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`)

    if (response.data.success) {
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to get transaction")
  },

  // Estimate transaction fee
  async estimateFee(data: EstimateFeeRequest): Promise<EstimateFeeResponse> {
    const response = await apiClient.post<ApiResponse<EstimateFeeResponse>>("/transactions/estimate-fee", data)

    if (response.data.success) {
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to estimate fee")
  },
}
