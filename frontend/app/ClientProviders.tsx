"use client"

import React from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { WagmiProvider } from "@privy-io/wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { privyConfig } from "@/lib/privy-config"
import { wagmiConfig } from "@/lib/wagmi-config"
import { Toaster } from "sonner"

const queryClient = new QueryClient()

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""

  // If no appId is provided, render children without Privy to avoid runtime errors
  if (!appId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
          <Toaster position="top-right" />
        </WagmiProvider>
      </QueryClientProvider>
    )
  }

  return (
    <PrivyProvider appId={appId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
          <Toaster position="top-right" />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
