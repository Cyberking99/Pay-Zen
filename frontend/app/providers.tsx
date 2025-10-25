"use client"

import React from "react"
import ClientProviders from "./ClientProviders"

export function AppProviders({ children }: { children: React.ReactNode }) {
  // ClientProviders is a client component that guards Privy initialization.
  return <ClientProviders>{children}</ClientProviders>
}
