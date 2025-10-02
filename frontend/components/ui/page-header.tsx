"use client"

import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
    variant?: "default" | "outline" | "ghost"
  }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {description && <p className="text-slate-400 mt-1">{description}</p>}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "default"}
          className={action.variant === "default" ? "gradient-primary text-white" : ""}
        >
          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
