"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Link2 } from "lucide-react"
import { toast } from "sonner"

export interface PaymentLink {
  id: string
  url: string
  amount: number
  description?: string
  status: string
  createdAt: string
  expiry?: string
}

interface PaymentLinksListProps {
  links: PaymentLink[]
  loading?: boolean
}

export function PaymentLinksList({ links, loading }: PaymentLinksListProps) {
  if (loading) {
    return (
      <Card className="mb-8 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">Your Payment Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!links.length) {
    return (
      <Card className="mb-8 bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">Your Payment Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">No payment links yet. Create one above!</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8 bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">Your Payment Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="py-2 px-4 text-left">Link</th>
                <th className="py-2 px-4 text-left">Amount</th>
                <th className="py-2 px-4 text-left">Description</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Created</th>
                <th className="py-2 px-4 text-left">Expiry</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map(link => (
                <tr key={link.id} className="border-b border-slate-700 hover:bg-slate-800/30">
                  <td className="py-2 px-4">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline flex items-center">
                      <Link2 className="w-4 h-4 mr-1" />
                      {link.url.slice(0, 24)}...
                    </a>
                  </td>
                  <td className="py-2 px-4 text-white">{link.amount ? `$${link.amount.toFixed(2)}` : "N/A"}</td>
                  <td className="py-2 px-4 text-white">{link.description?.slice(0, 24).concat("...") || "N/A"}</td>
                  <td className="py-2 px-4">
                    <Badge variant={link.status === "active" ? "secondary" : "outline"} className={link.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-700 text-slate-400 border-slate-600"}>
                      {link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-2 px-4 text-white">{new Date(link.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 px-4 text-white">{link.expiry ? new Date(link.expiry).toLocaleDateString() : "N/A"}</td>
                  <td className="py-2 px-4 text-white">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(link.url)
                        toast.success("Link copied!")
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 