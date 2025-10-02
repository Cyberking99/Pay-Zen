import { apiClient } from "./config"
import type { ApiResponse, UserProfile } from "./types"

export interface LoginRequest {
  privyToken: string
  walletAddress: string
}

export interface LoginResponse {
  token: string
  user: UserProfile
}

export interface UpdateProfileRequest {
  username?: string
  fullName?: string
  age?: number
}

export const authService = {
  // Login with Privy token
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login", data)

    if (response.data.success) {
      // Store auth token
      localStorage.setItem("auth_token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
      return response.data.user
    }

    throw new Error(response.data.error || "Login failed")
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout")
    } finally {
      // Always remove token from storage
      localStorage.removeItem("auth_token")
    }
  },

  // Get user profile
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>("/user/profile")

    if (response.data.success) {
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to get profile")
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient.put<ApiResponse<UserProfile>>("/user/profile", data)

    if (response.data.success) {
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to update profile")
  },

  // Get user balance
  async getBalance(): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ balance: string }>>("/user/balance")

    if (response.data.success) {
      return response.data.user.balance
    }

    throw new Error(response.data.error || "Failed to get balance")
  },
}
