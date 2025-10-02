"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  CreditCard,
  Download,
  Eye,
  Filter,
  History,
  LinkIcon,
  Search,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCard } from "@/components/ui/stats-card"
import { transactionService } from "@/lib/api/transactions"
import { Transaction } from "@/lib/api/types"
import { ethers } from "ethers"
import { toast } from "sonner"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import QRCode from "qrcode"

// Add this at the top of the file or in a .d.ts file if needed
// @ts-ignore
// eslint-disable-next-line
// declare module 'qrcode';

export default function TransactionHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [receipt, setReceipt] = useState<any>(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [receiptError, setReceiptError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      setError(null)
      try {
        const params: any = { page, limit: 20 }
        if (filterType !== "all") params.type = filterType
        // Optionally add searchTerm to params if backend supports it
        const res = await transactionService.getHistory(params)
        console.log(res)
        setTransactions(res.data)
        setTotal(res.pagination.total)
        setTotalPages(res.pagination.totalPages || 1)
      } catch (err: any) {
        console.log(err)
        setError(err.message || "Failed to load transactions")
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [filterType, page])

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!selectedTransaction) return
      const tx = transactions.find((t) => t.id === selectedTransaction)
      if (!tx?.txHash) return
      setReceipt(null)
      setReceiptError(null)
      setReceiptLoading(true)
      try {
        // You may want to map network name to RPC URL
        const rpcMap: Record<string, string> = {
          "base-sepolia": "https://sepolia.base.org", // Example, replace with your actual RPC
          // Add more networks as needed
        }
        const networkKey = tx.network as string | undefined
        if (!networkKey) throw new Error("No network specified for transaction")
        const rpcUrl = rpcMap[networkKey]
        if (!rpcUrl) throw new Error("Unsupported network for explorer")
        const provider = new ethers.JsonRpcProvider(rpcUrl)
        const receipt = await provider.getTransactionReceipt(tx.txHash)
        setReceipt(receipt)
      } catch (err: any) {
        setReceiptError(err.message || "Failed to fetch receipt")
      } finally {
        setReceiptLoading(false)
      }
    }
    if (selectedTransaction) fetchReceipt()
  }, [selectedTransaction, transactions])

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm) return true
    return (
      tx.memo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-emerald-500/20 text-emerald-400">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-400">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "received":
        return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
      case "sent":
        return <ArrowUpRight className="h-4 w-4 text-amber-400" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  // Helper to get explorer URL
  const getExplorerUrl = (txHash: string | undefined, network: string) => {
    const explorerMap: Record<string, string> = {
      "base-sepolia": "https://sepolia.basescan.org/tx/",
      // Add more networks as needed
    }
    return explorerMap[network] ? `${explorerMap[network]}${txHash || ''}` : null
  }

  // Helper to export receipt as JSON
  const exportReceipt = (tx: any, receipt: any) => {
    const data = JSON.stringify({ ...tx, receipt }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transaction-${tx.txHash}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Helper to download PDF receipt
  const downloadPdfReceipt = async (tx: any, receipt: any) => {
    const doc = new jsPDF()
    // Branding colors
    const primaryColor = "#14b8a6" // teal-500
    // Header bar
    doc.setFillColor(primaryColor)
    doc.rect(0, 0, 210, 25, "F")
    doc.setFontSize(18)
    doc.setTextColor(255,255,255)
    doc.text("PayZen", 30, 17)
    doc.setFontSize(12)
    doc.setTextColor(255,255,255)
    doc.text("Transaction Receipt", 150, 17, { align: "right" })
    // Watermark
    doc.saveGraphicsState?.()
    // @ts-ignore
    doc.setGState?.(new doc.GState({ opacity: 0.08 }))
    doc.setFontSize(60)
    doc.setTextColor(20,184,166)
    doc.text("PayZen", 105, 100, { angle: 30, align: "center" })
    doc.restoreGraphicsState?.()
    // Main box
    let y = 35
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(0.5)
    doc.roundedRect(10, y, 190, 100, 3, 3)
    y += 10
    doc.setFontSize(12)
    doc.setTextColor(33,37,41)
    doc.text(`Amount:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`$${tx.amount} USDC`, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8
    doc.text(`Type:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`${tx.type}`, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8
    doc.text(`Status:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`${tx.status}`, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8
    doc.text(`From:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`${tx.from?.username || tx.from?.address || "-"}`, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8
    doc.text(`To:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`${tx.to?.username || tx.to?.address || "-"}`, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8
    doc.text(`Tx Hash:`, 16, y)
    doc.setFont("helvetica", "bold")
    const hashLines = doc.splitTextToSize(`${tx.txHash}`, 120)
    doc.text(hashLines, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8 * (hashLines.length || 1)
    doc.text(`Block:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`${receipt?.blockNumber || "-"}`, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8
    doc.text(`Gas Used:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`${receipt?.gasUsed?.toString() || "-"}`, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8
    doc.text(`Network:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`${tx.network}`, 60, y)
    doc.setFont("helvetica", "normal")
    y += 8
    doc.text(`Date:`, 16, y)
    doc.setFont("helvetica", "bold")
    doc.text(`${formatDate(tx.createdAt)}`, 60, y)
    // QR code (explorer URL)
    const explorerUrl = getExplorerUrl(tx.txHash, tx.network || "")
    if (explorerUrl) {
      const qrDataUrl = await QRCode.toDataURL(explorerUrl)
      doc.addImage(qrDataUrl, "PNG", 160, 90, 35, 35)
      doc.setFontSize(8)
      doc.setTextColor(120,120,120)
      doc.text("Scan to view in explorer", 177, 128, { align: "center" })
    }
    // Footer
    doc.setFontSize(10)
    doc.setTextColor(120,120,120)
    doc.text("Thank you for using PayZen!", 105, 140, { align: "center" })
    doc.setTextColor(primaryColor)
    doc.text("https://payzen.app", 105, 146, { align: "center" })
    doc.save(`transaction-${tx.txHash}.pdf`)
  }

  // Helper to download receipt as image
  const downloadImageReceipt = async () => {
    const card = document.getElementById("receipt-card")
    if (!card) return
    const canvas = await html2canvas(card)
    const link = document.createElement("a")
    link.href = canvas.toDataURL("image/png")
    link.download = `transaction-receipt.png`
    link.click()
  }

  if (selectedTransaction) {
    const tx = transactions.find((t) => t.id === selectedTransaction)
    if (!tx) return null

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button className="gradient-primary text-white" variant="ghost" size="sm" onClick={() => setSelectedTransaction(null)}>
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Transaction Details</h1>
              <p className="text-slate-400">Complete information about this transaction</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-effect border-teal-500/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center">
                        {getTypeIcon(tx.type)}
                      </div>
                      <div>
                        <CardTitle className="text-white capitalize">{tx.type.replace("_", " ")}</CardTitle>
                        <CardDescription className="text-slate-400">{tx.memo}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(tx.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400">Amount</span>
                      <p className="text-2xl font-bold text-white">
                        {tx.type === "sent" ? "-" : "+"}${tx.amount} USDC
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Network Fee</span>
                      <p className="text-lg font-semibold text-slate-300">
                        {receiptLoading ? <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin inline-block"></span> :
                          receipt && receipt.gasUsed && receipt.effectiveGasPrice ?
                          `${ethers.formatUnits(receipt.gasUsed * receipt.effectiveGasPrice, 18)} ETH` :
                          "$0.00 USDC"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400">From</span>
                      <p className="font-medium text-white">{tx.from?.username}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">To</span>
                      <p className="font-medium text-white">{tx.to?.username}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400">Transaction Hash</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={tx.txHash || ""} readOnly className="font-mono text-sm border-teal-500/20 text-white" />
                      <Button className="gradient-primary text-white" variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(tx.txHash || "")
                        toast.success("Transaction hash copied!")
                      }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Blockchain details */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                    <div>
                      <span className="text-slate-400">Confirmations</span>
                      <p className="font-medium text-white">
                        {receiptLoading ? <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin inline-block"></span> :
                          receipt && receipt.confirmations !== undefined ? receipt.confirmations : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Block</span>
                      <p className="font-medium text-white">
                        {receiptLoading ? <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin inline-block"></span> :
                          receipt && receipt.blockNumber ? receipt.blockNumber : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Gas Used</span>
                      <p className="font-medium text-white">
                        {receiptLoading ? <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin inline-block"></span> :
                          receipt && receipt.gasUsed ? receipt.gasUsed.toString() : "-"}
                      </p>
                    </div>
                  </div>
                  {receiptError && <div className="text-red-400 text-xs mt-2">{receiptError}</div>}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="glass-effect">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="gradient-primary text-white w-full" variant="outline" onClick={() => {
                    const explorerUrl = getExplorerUrl(tx.txHash, tx.network || '')
                    if (explorerUrl) window.open(explorerUrl, "_blank")
                    else toast.error("Explorer not supported for this network")
                  }}>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    View in Explorer
                  </Button>
                  <Button className="gradient-primary text-white w-full" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(tx.txHash || "")
                    toast.success("Transaction hash copied!")
                  }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Hash
                  </Button>
                  <Button className="gradient-primary text-white w-full" variant="outline" onClick={() => exportReceipt(tx, receipt)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Receipt
                  </Button>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Button className="gradient-primary text-white" variant="outline" size="sm" onClick={() => downloadPdfReceipt(tx, receipt)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF Receipt
                    </Button>
                    <Button className="gradient-primary text-white" variant="outline" size="sm" onClick={downloadImageReceipt}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Image Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Initiated:</span>
                    <span className="text-white">{formatDate(tx.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confirmed:</span>
                    <span className="text-white">{formatDate(tx.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400">Final</span>
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
            <h1 className="text-3xl font-bold text-white">Transaction History</h1>
            <p className="text-slate-400">Track all your payments and transfers</p>
          </div>
          <Button className="gradient-primary text-white">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        {/* Stats Overview (optional, can be computed from transactions) */}
        {/* Filters */}
        <Card className="glass-effect border-teal-500/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative border-teal-500/20 text-white">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48 border-teal-500/20 text-white gradient-primary">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-effect border-teal-500/20 text-white gradient-primary">
                  <SelectItem value="all" className="text-white hover:bg-teal-500/20 active:bg-teal-500/20 selected:bg-teal-500/20">All Transactions</SelectItem>
                  <SelectItem value="received" className="text-white hover:bg-teal-500/20 active:bg-teal-500/20 selected:bg-teal-500/20">Received Only</SelectItem>
                  <SelectItem value="sent" className="text-white hover:bg-teal-500/20 active:bg-teal-500/20 selected:bg-teal-500/20">Sent Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* Transactions List */}
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-slate-400">
              {filteredTransactions.length} of {total} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-400">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Loading transactions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No transactions found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((tx) => (
                  <Card key={tx.id} className="border-slate-700/50 hover:border-slate-600/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center">
                            {getTypeIcon(tx.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-white capitalize">{tx.type}</p>
                              {getStatusBadge(tx.status)}
                            </div>
                            <p className="text-sm text-slate-400">{tx.memo}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                              <span>{formatDate(tx.createdAt)}</span>
                              <span>•</span>
                              <span className="font-mono">{tx.txHash?.substring(0, 10)}...</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-semibold ${
                              tx.type === "sent" ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {tx.type === "sent" ? "-" : "+"}${tx.amount} USDC
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTransaction(tx.id)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
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
        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-4">
          <Button
            className="gradient-primary text-white"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-slate-400 px-4">Page {page} of {totalPages}</span>
          <Button
            className="gradient-primary text-white"
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
