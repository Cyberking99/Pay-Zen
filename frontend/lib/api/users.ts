import { apiClient } from "./config"
import type { ApiResponse } from "./types"
import { getAccessToken } from "@privy-io/react-auth"

export interface UserSearchResult {
  id: string
  username: string
  full_name?: string
  wallet_address: string
}

export interface SearchUsersParams {
  query: string
  limit?: number
}

export interface CheckUsernameResponse {
  available: boolean
}

export const userService = {

  // Search users by username
  async searchUsers(params: SearchUsersParams): Promise<UserSearchResult> {
    
    const authToken = await getAccessToken()
    console.log("authToken", authToken)
    if (!authToken) {
      throw new Error("No auth token found")
    }

    const response = await apiClient.get<ApiResponse<UserSearchResult>>("/users/search", {
      params,
      headers: {
        "X-Authorization-Override": `Bearer ${authToken}`,
      },
    })

    console.log("response", response)

    if (response.status === 200) {
      console.log("response", response.data)
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to search user")
  },

  // Check if username is available
  async checkUsername(username: string): Promise<{ available: boolean }> {
    const response = await apiClient.get<any>(`/users/check-username/${username}`)
    console.log("response", response)
    if (response.data.success) {
      return response.data.data
    }

    throw new Error(response.data.error || "Failed to check username")
  },
}