"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ArrowDownLeft,
  Calendar,
  Clock,
  Copy,
  Download,
  Eye,
  Filter,
  Globe,
  LinkIcon,
  Plus,
  Search,
  Settings,
  Zap,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCard } from "@/components/ui/stats-card"
import { getAccessToken } from "@privy-io/react-auth"

export default function ManageLinksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [paymentLinks, setPaymentLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true)
      setError(null)
      try {
        const authToken = await getAccessToken()
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-links`, {
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        })
        if (!res.ok) throw new Error("Failed to fetch payment links")
        const data = await res.json()
        setPaymentLinks(data.paymentLinks || [])
      } catch (err: any) {
        setError(err.message || "Failed to fetch payment links")
        setPaymentLinks([])
      } finally {
        setLoading(false)
      }
    }
    fetchLinks()
  }, [])

  const filteredLinks = paymentLinks.filter((link) => {
    const matchesSearch =
      searchTerm === "" ||
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || link.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
      case "expired":
        return <Badge className="bg-amber-500/20 text-amber-400">Expired</Badge>
      case "deactivated":
        return <Badge className="bg-slate-500/20 text-slate-400">Deactivated</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getExpirationBadge = (expirationType: string) => {
    switch (expirationType) {
      case "one-time":
        return (
          <Badge variant="outline" className="text-xs border-teal-500/20 text-white gradient-primary">
            <Clock className="h-3 w-3 mr-1" />
            One-time
          </Badge>
        )
      case "time-based":
        return (
          <Badge variant="outline" className="text-xs border-teal-500/20 text-white gradient-primary">
            <Calendar className="h-3 w-3 mr-1" />
            Time-based
          </Badge>
        )
      case "public":
        return (
          <Badge variant="outline" className="text-xs border-teal-500/20 text-white gradient-primary">
            <Globe className="h-3 w-3 mr-1" />
            Public
          </Badge>
        )
      default:
        return null
    }
  }

  const handleDeactivateLink = (linkId: string) => {
    console.log("Deactivating link:", linkId)
  }

  const handleDuplicateLink = (linkId: string) => {
    console.log("Duplicating link:", linkId)
  }

  const copyLinkUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 mt-2">Loading payment links...</p>
        </div>
      </DashboardLayout>
    )
  }
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-red-400 font-semibold mb-2">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </DashboardLayout>
    )
  }

  if (selectedLink) {
    const link = paymentLinks.find((l) => l.id === selectedLink)
    if (!link) return null

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedLink(null)}>
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Link Analytics</h1>
              <p className="text-slate-400">Detailed performance metrics for your payment link</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Link Overview */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-effect border-teal-500/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-white">{link.title}</CardTitle>
                      <CardDescription className="mt-1 text-slate-400">{link.description}</CardDescription>
                    </div>
                    {getStatusBadge(link.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400">Amount</span>
                      <p className="text-lg font-semibold text-white">
                        {link.fixedAmount ? `$${link.amount.toFixed(2)} USDC` : "Variable Amount"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Expiration</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getExpirationBadge(link.expirationType)}
                        {link.expirationDate && (
                          <span className="text-sm text-slate-400">Until {formatDate(link.expirationDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-slate-400">Payment Link URL</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={link.url} readOnly className="font-mono text-sm" />
                      <Button variant="outline" size="sm" onClick={() => copyLinkUrl(link.url)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card className="glass-effect border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Performance Metrics</CardTitle>
                  <CardDescription className="text-slate-400">
                    Track how your payment link is performing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-emerald-500/10">
                      <p className="text-2xl font-bold text-emerald-400">{link.paymentsReceived}</p>
                      <p className="text-sm text-slate-400">Payments</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-teal-500/10">
                      <p className="text-2xl font-bold text-teal-400">${link.totalReceived.toFixed(2)}</p>
                      <p className="text-sm text-slate-400">Total Received</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-amber-500/10">
                      <p className="text-2xl font-bold text-amber-400">{link.clicks}</p>
                      <p className="text-sm text-slate-400">Total Clicks</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-500/20">
                      <p className="text-2xl font-bold text-white">
                        {((link.paymentsReceived / link.clicks) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-slate-400">Conversion Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              <Card className="glass-effect border-amber-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-transparent" variant="outline" onClick={() => copyLinkUrl(link.url)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    className="w-full bg-transparent"
                    variant="outline"
                    onClick={() => handleDuplicateLink(link.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Duplicate Link
                  </Button>
                  {link.status === "active" && (
                    <Button
                      className="w-full bg-transparent"
                      variant="outline"
                      onClick={() => handleDeactivateLink(link.id)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Deactivate
                    </Button>
                  )}
                  <Button className="w-full bg-transparent" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Link Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Created:</span>
                    <span className="text-white">{formatDate(link.createdDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Custom Fields:</span>
                    <span className="text-white">{link.customFields}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Link ID:</span>
                    <span className="font-mono text-xs text-white">{link.id}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Payment Links</h1>
            <p className="text-slate-400">View, manage, and analyze your payment links</p>
          </div>
          <Button className="gradient-primary text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create New Link
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="glass-effect border-teal-500/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search links by title, description, or URL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-teal-500/20 text-white"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48 border-teal-500/20 text-white gradient-primary">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-effect border-teal-500/20 text-white gradient-primary">
                  <SelectItem value="all" className="text-white active:bg-teal-500/20 hover:bg-teal-500/20 selected:bg-teal-500/20">All Links</SelectItem>
                  <SelectItem value="active" className="text-white active:bg-teal-500/20 hover:bg-teal-500/20 selected:bg-teal-500/20">Active Only</SelectItem>
                  <SelectItem value="expired" className="text-white active:bg-teal-500/20 hover:bg-teal-500/20 selected:bg-teal-500/20">Expired Only</SelectItem>
                  <SelectItem value="deactivated" className="text-white active:bg-teal-500/20 hover:bg-teal-500/20 selected:bg-teal-500/20">Deactivated Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Link Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Links"
            value={paymentLinks.length}
            icon={LinkIcon}
            iconColor="bg-emerald-500/20 text-emerald-400"
            valueColor="text-emerald-400"
          />

          <StatsCard
            title="Active Links"
            value={paymentLinks.filter((l) => l.status === "active").length}
            icon={Zap}
            iconColor="bg-teal-500/20 text-teal-400"
            valueColor="text-teal-400"
          />

          <StatsCard
            title="Total Received"
            value={`$${paymentLinks.reduce((sum, link) => sum + link.totalReceived, 0).toFixed(2)}`}
            icon={ArrowDownLeft}
            iconColor="bg-amber-500/20 text-amber-400"
            valueColor="text-amber-400"
          />
        </div>

        {/* Links List */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-white">Your Payment Links</CardTitle>
            <CardDescription className="text-slate-400">
              {filteredLinks.length} of {paymentLinks.length} links
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLinks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payment links found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLinks.map((link) => (
                  <Card key={link.id} className="border-slate-700/50 hover:border-slate-600/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{link.title}</h3>
                            {getStatusBadge(link.status)}
                            {getExpirationBadge(link.expirationType)}
                          </div>
                          <p className="text-sm text-slate-400 mb-3">{link.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Amount:</span>
                              <p className="font-medium text-white">
                                {link.fixedAmount ? `$${link.amount.toFixed(2)}` : "Variable"}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-400">Payments:</span>
                              <p className="font-medium text-emerald-400">{link.paymentsReceived}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Total:</span>
                              <p className="font-medium text-teal-400">${link.totalReceived ? link.totalReceived.toFixed(2) : 0}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Input value={link.url} readOnly className="font-mono text-xs h-8 flex-1 border-teal-500/20 text-white" />
                            <Button className="gradient-primary text-white" variant="ghost" size="sm" onClick={() => copyLinkUrl(link.url)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button className="gradient-primary text-white" variant="outline" size="sm" onClick={() => setSelectedLink(link.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Analytics
                          </Button>
                          <div className="flex gap-1">
                            <Button className="gradient-primary text-white" variant="ghost" size="sm" onClick={() => handleDuplicateLink(link.id)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            {link.status === "active" && (
                              <Button className="gradient-primary text-white" variant="ghost" size="sm" onClick={() => handleDeactivateLink(link.id)}>
                                <Settings className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
