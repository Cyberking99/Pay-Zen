"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message?: string
  type?: "network" | "api" | "blockchain" | "generic"
  onRetry?: () => void
  showRetry?: boolean
}

export function ErrorState({ title, message, type = "generic", onRetry, showRetry = true }: ErrorStateProps) {
  const getErrorConfig = () => {
    switch (type) {
      case "network":
        return {
          icon: WifiOff,
          defaultTitle: "Connection Error",
          defaultMessage: "Please check your internet connection and try again.",
          color: "text-red-400",
        }
      case "api":
        return {
          icon: AlertTriangle,
          defaultTitle: "Service Unavailable",
          defaultMessage: "Our servers are temporarily unavailable. Please try again later.",
          color: "text-amber-400",
        }
      case "blockchain":
        return {
          icon: Wifi,
          defaultTitle: "Blockchain Error",
          defaultMessage: "Unable to connect to the blockchain network. Please try again.",
          color: "text-orange-400",
        }
      default:
        return {
          icon: AlertTriangle,
          defaultTitle: "Something went wrong",
          defaultMessage: "An unexpected error occurred. Please try again.",
          color: "text-red-400",
        }
    }
  }
  const config = getErrorConfig()
  const Icon = config.icon
  return (
    <Card className="glass-effect border-red-500/20">
      <CardContent className="p-8 text-center">
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center ${config.color}`}
        >
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title || config.defaultTitle}</h3>
        <p className="text-slate-400 mb-6">{message || config.defaultMessage}</p>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="bg-transparent">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
