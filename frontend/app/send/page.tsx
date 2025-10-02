"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Check, Copy, Shield, User, Wallet, AlertTriangle, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useBlockchain } from "@/hooks/use-blockchain"
import { useAuth } from "@/hooks/use-auth"
import { transactionService, userService } from "@/lib/api"
import { toast } from "sonner"
import { ErrorState } from "@/components/ui/error-state"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import { USDC_ABI, getUSDCAddress } from "@/lib/blockchain/config"
import { getAccessToken } from "@privy-io/react-auth"

export default function SendMoneyPage() {
  const { authenticated, user, primaryWallet } = useAuth()
  const router = useRouter()
  const { balance, sendTransfer, sendTransferToUsername, estimateTransferGas } = useBlockchain()
  const [step, setStep] = useState(1)
  const [sendData, setSendData] = useState({
    recipientType: "username",
    recipient: "",
    amount: "",
    note: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionHash, setTransactionHash] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [gasEstimate, setGasEstimate] = useState<any>(null)
  const [recipientValidation, setRecipientValidation] = useState<{
    isValid: boolean
    isChecking: boolean
    resolvedAddress?: string
  }>({ isValid: false, isChecking: false })
  const [txStatus, setTxStatus] = useState<"pending" | "confirmed" | "failed" | null>(null)
  const [explorerUrl, setExplorerUrl] = useState<string>("")
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const [validatedUser, setValidatedUser] = useState<any>(null)
  const [recipientInput, setRecipientInput] = useState("")

  // if (!authenticated) {
  //   toast.error("Please login to continue")
  //   router.push("/")
  //   return null
  // }

  const profile = JSON.parse(localStorage.getItem("user") || "{}")

  const validateRecipient = async (recipient: string, type: string) => {
    if (!recipient.trim()) {
      setRecipientValidation({ isValid: false, isChecking: false })
      setValidatedUser(null)
      return
    }

    setRecipientValidation({ isValid: false, isChecking: true })
    setValidatedUser(null)

    try {
      if (type === "username") {
        const user = await userService.searchUsers({ query: recipient.replace("@", ""), limit: 1 })
        console.log("user", user)
        if (user) {
          setRecipientValidation({
            isValid: true,
            isChecking: false,
            resolvedAddress: user.wallet_address,
          })
          setValidatedUser(user)
        } else {
          setRecipientValidation({ isValid: false, isChecking: false })
          setValidatedUser(null)
        }
      } else {
        // Basic wallet address validation
        const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(recipient)
        setRecipientValidation({ isValid: isValidAddress, isChecking: false })
        setValidatedUser(null)
      }
    } catch (error) {
      console.error("Recipient validation failed:", error)
      setRecipientValidation({ isValid: false, isChecking: false })
      setValidatedUser(null)
    }
  }

  const estimateGas = async () => {
    if (!sendData.recipient || !sendData.amount) return

    console.log("sendData", sendData)
    console.log("recipientValidation", recipientValidation)

    try {
      const recipient =
        sendData.recipientType === "username"
          ? recipientValidation.resolvedAddress || sendData.recipient
          : sendData.recipient

      const estimate = await estimateTransferGas(recipient, sendData.amount, sendData.note)
      setGasEstimate(estimate)
    } catch (error) {
      console.error("Gas estimation failed:", error)
      toast.error("Failed to estimate transaction fee")
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      await estimateGas()
    }
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Helper to get explorer URL
  const getExplorerUrl = (txHash: string) => {
    // Default to Etherscan for mainnet, can be improved for other networks
    return `https://sepolia.basescan.org/tx/${txHash}`
  }

  // Poll for transaction status after sending (wallet address only)
  useEffect(() => {
    if (transactionHash && sendData.recipientType === "wallet" && txStatus === "pending" && typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const poll = async () => {
        try {
          const receipt = await provider.getTransactionReceipt(transactionHash)
          if (receipt && Number(receipt.confirmations) > 0) {
            setTxStatus("confirmed")
            setExplorerUrl(getExplorerUrl(transactionHash))
            if (pollingRef.current) clearInterval(pollingRef.current)
          }
        } catch (e) {
          // ignore
        }
      }
      pollingRef.current = setInterval(poll, 3000)
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current)
      }
    }
    return undefined
  }, [transactionHash, sendData.recipientType, txStatus])

  // For username, poll backend for status (optional, not implemented here)

  const recordTransaction = async ({ txHash, from, to, amount, memo, status, network, blockNumber, gasUsed, gasPrice, fromUserId, toUserId }: any) => {
    console.log("recordTransaction", { txHash, from, to, amount, memo, status, network, blockNumber, gasUsed, gasPrice, fromUserId, toUserId })
    
    await transactionService.recordTransaction({ txHash, from, to, amount, memo, status, network, blockNumber, gasUsed, gasPrice, fromUserId, toUserId });

    return true;
  }

  const handleSend = async () => {
    setIsProcessing(true)
    setError(null)
    setTxStatus("pending")
    setExplorerUrl("")
    try {
      let txHash: string = ""
      if (sendData.recipientType === "username") {
        // On-chain transfer to resolved address
        if (!recipientValidation.resolvedAddress) throw new Error("No resolved address for username")
        if (!primaryWallet) throw new Error("No Privy wallet found")
        const provider = new ethers.BrowserProvider(await primaryWallet.getEthereumProvider())
        const signer = await provider.getSigner()
        const network = await provider.getNetwork()
        const usdcAddress = getUSDCAddress(Number(network.chainId))
        const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, signer)
        const amountInSmallestUnit = ethers.parseUnits(sendData.amount, 6)
        const tx = await usdcContract.transfer(recipientValidation.resolvedAddress, amountInSmallestUnit)
        const receipt = await tx.wait()
        txHash = tx.hash
        setTxStatus("confirmed")
        setExplorerUrl(getExplorerUrl(txHash))
        setTransactionHash(txHash)
        // Record transaction in backend
        await recordTransaction({
          txHash,
          from: primaryWallet.address,
          to: recipientValidation.resolvedAddress,
          amount: sendData.amount,
          memo: sendData.note,
          status: "confirmed",
          network: network.name || network.chainId,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          gasPrice: receipt.gasPrice?.toString(),
          fromUserId: user?.id,
          toUserId: validatedUser?.id,
        })
      } else {
        // On-chain transfer to wallet address (already implemented)
        txHash = await sendTransfer(sendData.recipient, sendData.amount, sendData.note)
        setTransactionHash(txHash)
        setTxStatus("pending")
        setExplorerUrl(getExplorerUrl(txHash))
        // Record transaction in backend
        const provider = new ethers.BrowserProvider(await (primaryWallet?.getEthereumProvider() as any))
        const network = await provider.getNetwork()
        const receipt = await provider.getTransactionReceipt(txHash)
        await recordTransaction({
          txHash,
          from: primaryWallet?.address,
          to: sendData.recipient,
          amount: sendData.amount,
          memo: sendData.note,
          status: "pending",
          network: network.name || network.chainId,
          blockNumber: receipt?.blockNumber,
          gasUsed: receipt?.gasUsed?.toString(),
          gasPrice: receipt?.gasPrice?.toString(),
          fromUserId: user?.id,
          toUserId: null,
        })
      }
      setTransactionHash(txHash)
      toast.success("Transaction sent successfully!")
      setStep(4)
    } catch (error) {
      console.error("Transaction failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Transaction failed"
      setError(errorMessage)
      setTxStatus("failed")
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSendData({
      recipientType: "username",
      recipient: "",
      amount: "",
      note: "",
    })
    setTransactionHash("")
    setError(null)
    setGasEstimate(null)
    setRecipientValidation({ isValid: false, isChecking: false })
    setTxStatus(null)
    setExplorerUrl("")
    setValidatedUser(null)
    setRecipientInput("")
  }

  // Check if user has sufficient balance
  const hasInsufficientBalance = () => {
    const amount = Number.parseFloat(sendData.amount)
    const userBalance = Number.parseFloat(balance)
    const fee = gasEstimate ? Number.parseFloat(gasEstimate.totalCost) : 0.01
    return amount + fee > userBalance
  }

  if (error && step === 3) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <ErrorState
            title="Transaction Failed"
            message={error}
            type="blockchain"
            onRetry={() => {
              setError(null)
              setStep(2)
            }}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          {step > 1 && step < 4 && (
            <Button className="bg-transparent border border-white text-white hover:bg-white hover:text-black" variant="ghost" size="sm" onClick={handleBack} disabled={isProcessing}>
              ← Back
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">Send Money</h1>
            <p className="text-slate-400">
              {step === 1
                ? "Choose recipient and amount"
                : step === 2
                  ? "Review transaction details"
                  : step === 3
                    ? "Processing transaction"
                    : "Transaction complete"}
            </p>
          </div>
        </div>

        {/* Balance Warning */}
        {Number.parseFloat(balance) < 10 && (
          <Card className="glass-effect border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <p className="text-sm text-amber-400">
                  Low balance: ${balance} USDC. Consider adding funds to your wallet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-6">
            {/* Recipient Selection */}
            <Card className="glass-effect border-teal-500/20">
              <CardHeader>
                <CardTitle className="text-white">Send To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={sendData.recipientType === "username" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSendData({ ...sendData, recipientType: "username" })}
                    className={sendData.recipientType === "username" ? "gradient-primary text-white" : "bg-[#ffffff] border border-[#ffffff] text-black hover:bg-[#ffffff] hover:border-[#ffffff] hover:text-black"}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Username
                  </Button>
                  <Button
                    variant={sendData.recipientType === "wallet" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSendData({ ...sendData, recipientType: "wallet" })}
                    className={sendData.recipientType === "wallet" ? "gradient-primary text-white" : "bg-[#ffffff] border border-[#ffffff] text-black hover:bg-[#ffffff] hover:border-[#ffffff] hover:text-black"}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet Address
                  </Button>
                </div>

                <div>
                  <Label className="text-white">
                    {sendData.recipientType === "username" ? "Username" : "Wallet Address"}
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder={
                        sendData.recipientType === "username" ? "Enter username (e.g., @alice)" : "Enter wallet address"
                      }
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      className="mt-1 bg-white text-black border border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                    {sendData.recipientType === "username" && (
                      <Button
                        type="button"
                        onClick={() => {
                          setSendData({ ...sendData, recipient: recipientInput })
                          validateRecipient(recipientInput, sendData.recipientType)
                        }}
                        className="mt-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded shadow"
                        disabled={!recipientInput.trim()}
                      >
                        Validate Username
                      </Button>
                    )}
                    {recipientValidation.isChecking && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {sendData.recipient && !recipientValidation.isChecking && (
                    <p className={`text-sm mt-1 ${recipientValidation.isValid ? "text-emerald-400" : "text-red-400"}`}>
                      {recipientValidation.isValid ? "✓ Valid recipient" : "✗ Invalid recipient"}
                    </p>
                  )}
                </div>

                {sendData.recipientType === "username" && (
                  <div>
                    {validatedUser ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-emerald-500/20 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-lg text-white font-bold">
                          {validatedUser.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="text-white font-medium text-base">@{validatedUser.username}</div>
                          {validatedUser.full_name && <div className="text-slate-400 text-sm">{validatedUser.full_name}</div>}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Amount Selection */}
            <Card className="glass-effect border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-white">Amount</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Amount (USDC)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.00"
                    value={sendData.amount}
                    onChange={(e) => setSendData({ ...sendData, amount: e.target.value })}
                    className="mt-1 text-lg bg-white text-black border border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-3">Quick Amounts</p>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setSendData({ ...sendData, amount: amount.toString() })}
                        className="bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 hover:text-teal-800 font-semibold shadow-sm"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white">Note (Optional)</Label>
                  <Textarea
                    placeholder="Add a note for this transaction"
                    value={sendData.note}
                    onChange={(e) => setSendData({ ...sendData, note: e.target.value })}
                    className="mt-1 bg-gray-50 text-black border border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-inner placeholder:text-gray-400"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleNext}
              disabled={
                !sendData.recipient || !sendData.amount || !recipientValidation.isValid || hasInsufficientBalance()
              }
              className="w-full gradient-primary text-white"
            >
              {hasInsufficientBalance() ? "Insufficient Balance" : "Review Transaction"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="glass-effect border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white">Review Transaction</CardTitle>
                <CardDescription className="text-slate-400">Please confirm the details below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Sending To</p>
                    <p className="font-medium text-white">{sendData.recipient}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Amount</p>
                    <p className="font-medium text-white">${sendData.amount} USDC</p>
                  </div>
                </div>

                {sendData.note && (
                  <div>
                    <p className="text-sm text-slate-400">Note</p>
                    <p className="text-white">{sendData.note}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Network Fee</span>
                    <span className="text-white">${gasEstimate ? gasEstimate.totalCost : 0.01} USDC</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold mt-2">
                    <span className="text-white">Total</span>
                    <span className="text-white">
                      $
                      {(
                        Number.parseFloat(sendData.amount) +
                        (gasEstimate ? Number.parseFloat(gasEstimate.totalCost) : 0.01)
                      ).toFixed(2)}{" "}
                      USDC
                    </span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-400">Security Reminder</p>
                      <p className="text-xs text-slate-300">
                        Double-check the recipient details. Blockchain transactions cannot be reversed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent bg-blue-500 hover:bg-blue-600 text-white" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Back
              </Button>
              <Button onClick={handleSend} className="flex-1 gradient-primary text-white" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirm & Send
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <Card className="glass-effect border-teal-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-8 w-8 text-white" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {isProcessing ? "Processing Transaction" : "Transaction Sent!"}
              </h2>
              <p className="text-slate-400 mb-6">
                {isProcessing
                  ? "Your transaction is being processed on the blockchain..."
                  : "Your payment has been successfully sent"}
              </p>
              {!isProcessing && (
                <Button onClick={() => setStep(4)} className="gradient-primary text-white">
                  View Details
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <Card className="glass-effect border-emerald-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    {isProcessing ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : txStatus === "pending" ? (
                      <Badge className="bg-amber-500/20 text-amber-400"><Loader2 className="h-4 w-4 animate-spin text-white" /></Badge>
                    ) : txStatus === "confirmed" ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400"><Check className="h-4 w-4 text-xl text-white" /></Badge>
                    ) : txStatus === "failed" ? (
                      <Badge className="bg-red-500/20 text-red-400"><AlertTriangle className="h-4 w-4 text-white" /></Badge>
                    ) : (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-white">Transaction Complete</CardTitle>
                    <CardDescription className="text-slate-400">Payment sent successfully</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Sent To</p>
                    <p className="font-medium text-white">{sendData.recipient}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Amount</p>
                    <p className="font-medium text-white">${sendData.amount} USDC</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs text-white truncate">{transactionHash}</p>
                      <Button variant="ghost" size="sm" onClick={() => {
                        navigator.clipboard.writeText(transactionHash)
                        toast.success("Transaction hash copied!")
                      }}>
                        <Copy className="h-3 w-3 text-white bg-primary" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    {txStatus === "pending" && <Badge className="bg-amber-500/20 text-amber-400">Pending</Badge>}
                    {txStatus === "confirmed" && <Badge className="bg-emerald-500/20 text-emerald-400">Confirmed</Badge>}
                    {txStatus === "failed" && <Badge className="bg-red-500/20 text-red-400">Failed</Badge>}
                  </div>
                </div>

                {sendData.note && (
                  <div>
                    <p className="text-sm text-slate-400">Note</p>
                    <p className="text-white">{sendData.note}</p>
                  </div>
                )}
                {explorerUrl && (
                  <Button asChild variant="outline" className="flex-1 gradient-primary text-white">
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer">View in Explorer</a>
                  </Button>
                )}
                {txStatus === "failed" && (
                  <Button
                    variant="outline"
                    onClick={handleSend}
                    className="flex-1 bg-transparent bg-primary"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Retry
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetForm} className="flex-1 bg-transparent bg-blue-500 text-white hover:bg-blue-600" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Send Another
              </Button>
              {explorerUrl && (
                <a href={getExplorerUrl(transactionHash)} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="flex-1 gradient-primary text-white">View in Explorer</Button>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

const recentRecipients = [
  { username: "alice_crypto", name: "Alice Johnson", avatar: "A" },
  { username: "bob_defi", name: "Bob Smith", avatar: "B" },
  { username: "charlie_web3", name: "Charlie Brown", avatar: "C" },
]

const quickAmounts = [5, 10, 25, 50, 100, 250, 500]
