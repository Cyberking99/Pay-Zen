"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  valueColor?: string
}

export function StatsCard({ title, value, icon: Icon, iconColor, valueColor = "text-white" }: StatsCardProps) {
  return (
    <Card className="glass-effect">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
