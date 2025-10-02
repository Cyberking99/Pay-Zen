"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface QuickActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor: string
  borderColor: string
  onClick?: () => void
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  iconColor,
  borderColor,
  onClick,
}: QuickActionCardProps) {
  return (
    <Card
      className={`glass-effect ${borderColor} hover:${borderColor.replace("/20", "/40")} transition-colors cursor-pointer`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-white">{title}</p>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
