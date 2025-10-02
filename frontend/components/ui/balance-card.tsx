"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Wallet } from "lucide-react"

interface BalanceCardProps {
  balance: number
  currency?: string
  received: number
  sent: number
  activeLinks: number
  monthlyChange?: number
}

export function BalanceCard({
  balance,
  currency = "USDC",
  received,
  sent,
  activeLinks,
  monthlyChange = 0,
}: BalanceCardProps) {
  const [balanceVisible, setBalanceVisible] = useState(true)

  return (
    <Card className="glass-effect border-teal-500/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Balance</p>
              <div className="flex items-center gap-2">
                {balanceVisible ? (
                  <p className="text-2xl font-bold text-white">
                    ${balance.toFixed(2)} {currency}
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-white">••••••</p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-slate-400 hover:text-white"
                >
                  {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          {/* <div className="text-right">
            <p className={`text-sm ${monthlyChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {monthlyChange >= 0 ? "+" : ""}
              {monthlyChange.toFixed(1)}% this month
            </p>
            <p className="text-xs text-slate-500">≈ ${balance.toFixed(2)} USD</p>
          </div> */}
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
          <div className="text-center">
            <p className="text-lg font-semibold text-emerald-400">${received.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Received</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-amber-400">${sent.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Sent</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-teal-400">{activeLinks}</p>
            <p className="text-xs text-slate-400">Active Links</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
