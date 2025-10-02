"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History, LinkIcon, Plus, Send } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BalanceCard } from "@/components/ui/balance-card"
import { QuickActionCard } from "@/components/ui/quick-action-card"
import { ActivityItem } from "@/components/ui/activity-item"
import { PageHeader } from "@/components/ui/page-header"
import { BalanceSkeleton, ActivitySkeleton } from "@/components/ui/loading-skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { useAuth } from "@/hooks/use-auth"
import { useBlockchain } from "@/hooks/use-blockchain" // Uncomment if you have blockchain hook
import { CreatePaymentLinkModal } from "@/components/payment-link/create-payment-link-modal"
import { PaymentLinksList, PaymentLink } from "@/components/payment-link/payment-links-list"
import { getAccessToken } from "@privy-io/react-auth"
import { transactionService } from "@/lib/api/transactions"
import { Transaction } from "@/lib/api/types"

export default function DashboardPage() {
  const { profile, walletAddress, authenticated, ready, logout } = useAuth()
  const { balance, loading: blockchainLoading, refreshBalance } = useBlockchain() // Uncomment if you have blockchain hook
  const [showCreateLink, setShowCreateLink] = useState(false)
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [linksLoading, setLinksLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch payment links
  const fetchLinks = async () => {
    setLinksLoading(true)
    try {
      const authToken = await getAccessToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-links`, {
        headers: {
          "Authorization": `Bearer ${authToken}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch payment links")
      const data = await res.json()
      setLinks(data.paymentLinks || [])
    } catch (err) {
      console.error("Error fetching payment links", err)
      setLinks([])
    } finally {
      setLinksLoading(false)
    }
  }

  useEffect(() => {
    if (ready && authenticated) {
      fetchLinks()
    }
  }, [ready, authenticated])

  // Fetch transactions
  useEffect(() => {
    if (ready && authenticated) {
      setLoading(true)
      transactionService.getHistory({ page: 1, limit: 5 })
        .then(res => {
          setTransactions(res.data)
        })
        .catch(err => {
          setTransactions([])
        })
        .finally(() => setLoading(false))
    }
  }, [ready, authenticated])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    window.location.reload()
  }

  console.log("authenticated", ready)

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState title="Dashboard Error" message={error} type="api" onRetry={handleRetry} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description={`Welcome back${profile?.fullName ? `, ${profile.fullName}` : ""}`}
          action={{
            label: "Create Link",
            icon: Plus,
            onClick: () => setShowCreateLink(true),
          }}
        />

        {/* Balance Card with loading state */}
        {/* Replace 0 with real balance, received, sent, activeLinks, monthlyChange */}
        {loading ? (
          <BalanceSkeleton />
        ) : (
          <BalanceCard
            balance={Number(balance)}
            received={0}
            sent={0}
            activeLinks={links.length}
            monthlyChange={0}
          />
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/send">
            <QuickActionCard
              title="Send Money"
              description="Transfer to username or wallet"
              icon={Send}
              iconColor="bg-emerald-500/20 text-emerald-400"
              borderColor="border-emerald-500/20"
            />
          </Link>
          <div onClick={() => setShowCreateLink(true)}>
            <QuickActionCard
              title="Create Link"
              description="Generate payment link"
              icon={LinkIcon}
              iconColor="bg-amber-500/20 text-amber-400"
              borderColor="border-amber-500/20"
            />
          </div>
          <Link href="/history">
            <QuickActionCard
              title="View History"
              description="Track all transactions"
              icon={History}
              iconColor="bg-teal-500/20 text-teal-400"
              borderColor="border-teal-500/20"
            />
          </Link>
        </div>

        {/* Recent Activity with loading state */}
        <Card className="glass-effect">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ActivitySkeleton />
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <ActivityItem
                    key={index}
                    type={transaction.type === "sent" ? "sent" : "received"}
                    amount={`${transaction.type === "sent" ? "-" : "+"}$${transaction.amount}`}
                    from={transaction.type === "sent" ? undefined : (transaction.from?.username || transaction.from?.address)}
                    to={transaction.type === "sent" ? (transaction.to?.username || transaction.to?.address) : undefined}
                    time={new Date(transaction.createdAt).toLocaleString()}
                    status={transaction.status}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">No recent activity</p>
                <Link href="/send">
                  <Button className="mt-4 gradient-primary text-white">Send Your First Payment</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Link Modal */}
        <CreatePaymentLinkModal open={showCreateLink} onOpenChange={setShowCreateLink} onCreated={fetchLinks} />
        {/* Payment Links List */}
        <PaymentLinksList links={links} loading={linksLoading} />
      </div>
    </DashboardLayout>
  )
}
