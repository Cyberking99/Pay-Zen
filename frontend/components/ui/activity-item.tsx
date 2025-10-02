"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight, LinkIcon } from "lucide-react"

interface ActivityItemProps {
  type: "received" | "sent" | "link"
  amount: string
  from?: string
  to?: string
  description?: string
  time: string
  status: string
}

export function ActivityItem({ type, amount, from, to, description, time, status }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case "received":
        return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
      case "sent":
        return <ArrowUpRight className="h-4 w-4 text-amber-400" />
      case "link":
        return <LinkIcon className="h-4 w-4 text-teal-400" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case "received":
        return "bg-emerald-500/20"
      case "sent":
        return "bg-amber-500/20"
      case "link":
        return "bg-teal-500/20"
    }
  }

  const getDisplayText = () => {
    if (type === "received" && from) return `Received from ${from}`
    if (type === "sent" && to) return `Sent to ${to}`
    if (type === "link" && description) return description
    return "Transaction"
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getBackgroundColor()}`}>
          {getIcon()}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{getDisplayText()}</p>
          <p className="text-xs text-slate-400">{time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium ${amount.startsWith("+") ? "text-emerald-400" : "text-amber-400"}`}>
          {amount} USDC
        </p>
        <Badge variant="secondary" className={`text-xs bg-slate-700/50 ${status === "pending" ? "bg-amber-500" : "bg-emerald-500"} text-white`}>
          {status}
        </Badge>
      </div>
    </div>
  )
}
