"use client"

import React from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { WagmiProvider } from "@privy-io/wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { privyConfig } from "@/lib/privy-config"
import { wagmiConfig } from "@/lib/wagmi-config"
import { Toaster } from "sonner"

const queryClient = new QueryClient()

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
          <Toaster position="top-right" />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
