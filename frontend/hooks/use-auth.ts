"use client"

import { usePrivy, useWallets } from "@privy-io/react-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { authService, LoginRequest } from "@/lib/api/auth"
import type { UserProfile } from "@/lib/api/types"

export function useAuth() {
  const {
    getAccessToken,
    ready,
    authenticated,
    user,
    login,
    logout: privyLogout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
  } = usePrivy()

  const { wallets } = useWallets()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const primaryWallet = wallets.find((wallet) => wallet.walletClientType === "privy")
  const walletAddress = primaryWallet?.address || wallets[0]?.address

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        if (authenticated && user && walletAddress) {
          // Get Privy token
          const privyToken = await (user as any).getAccessToken?.()
          if (!privyToken) throw new Error("No Privy token available")

          // Login to backend
          const { user: backendProfile } = await authService.login({
            privyToken,
            walletAddress,
          })

          console.log("backendProfile", backendProfile)

          setProfile(backendProfile)
        } else {
          setProfile(null)
        }
      } catch (err: any) {
        setProfile(null)
        setError(err.message || "Failed to fetch profile")
      } finally {
        setLoading(false)
      }
    }
    if (ready) {
      fetchProfile()
    }
  }, [ready, authenticated, user, walletAddress])

  const logout = async () => {
    await privyLogout()
    setProfile(null)
    localStorage.removeItem("auth_token")
    router.push("/")
  }

  const accountLogin = async (data: LoginRequest) => {
    const { user: backendProfile } = await authService.login(data)
    setProfile(backendProfile)
    router.push("/dashboard")
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return
    const updatedProfile = { ...profile, ...updates }
    setProfile(updatedProfile)
    try {
      await authService.updateProfile(updates)
    } catch (error) {
      setProfile(profile)
      throw error
    }
  }

  return {
    ready,
    authenticated,
    loading,
    error,
    user,
    profile,
    walletAddress,
    primaryWallet,
    wallets,
    login,
    accountLogin,
    logout,
    updateProfile,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
  }
}
