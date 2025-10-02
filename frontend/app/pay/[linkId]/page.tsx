"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { paymentLinkService } from "@/lib/api"
import { Loader2, CheckCircle, AlertTriangle, Copy } from "lucide-react"
import Confetti from "react-confetti"
import { getAccessToken } from "@privy-io/react-auth"
import { usePrivy, useWallets, useLogin } from "@privy-io/react-auth"
import { ethers } from "ethers"
import { USDC_ABI, getUSDCAddress } from "@/lib/blockchain/config"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function PayLinkPage() {
  const { linkId } = useParams<{ linkId: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<any>(null)
  const [amount, setAmount] = useState("")
  const [customFieldValues, setCustomFieldValues] = useState<any>({})
  const [step, setStep] = useState(1) // 1: form, 2: review, 3: result
  const [isPaying, setIsPaying] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [payError, setPayError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'onchain' | 'backend'>('onchain')
  const [networkFee, setNetworkFee] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [payerName, setPayerName] = useState("")
  const [payerEmail, setPayerEmail] = useState("")
  const [receipt, setReceipt] = useState<any>(null)
  const { login: privyLogin, authenticated: privyAuthenticated, ready: privyReady, linkWallet } = usePrivy()
  const { wallets } = useWallets()
  const primaryWallet = wallets.find((w: any) => w.walletClientType === "privy")
  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();
  const { login } = useLogin({
    onComplete: () => router.push("/pay/" + linkId),
  });

  useEffect(() => {
    async function fetchLink() {
      setLoading(true)
      setError(null)
      try {
        const data = await paymentLinkService.getLink(linkId)
        // Parse customFields if it's a string
        if (data.customFields && typeof data.customFields === 'string') {
          try {
            data.customFields = JSON.parse(data.customFields)
          } catch {
            data.customFields = []
          }
        }
        console.log("Pyament", data.amount)
        setLink(data)
        if (data.amount) setAmount(data.amount.toString())
      } catch (err: any) {
        setError(err.message || "Link not found")
      } finally {
        setLoading(false)
      }
    }
    if (linkId) fetchLink()
  }, [linkId])

  useEffect(() => {
    // Estimate network fee for on-chain payment
    async function estimateFee() {
      if (paymentMethod === 'onchain' && link && link.creatorAddress && amount && !isNaN(Number(amount)) && Number(amount) > 0) {
        try {
          // Dummy estimate, replace with real estimateTransferGas if available
          setNetworkFee('~0.01 USDC')
        } catch {
          setNetworkFee(null)
        }
      } else {
        setNetworkFee(null)
      }
    }
    estimateFee()
  }, [paymentMethod, link, amount])

  const handleCustomFieldChange = (name: string, value: string) => {
    setCustomFieldValues((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    // Validate amount if required
    if (!link.amount && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)) {
      toast.error("Please enter a valid amount")
      return
    }
    // Validate required custom fields
    if (link.customFields) {
      for (const field of link.customFields) {
        if (field.required && !customFieldValues[field.name]) {
          toast.error(`Please fill the required field: ${field.name}`)
          return
        }
      }
    }
    setStep(2)
  }

  const recordTransaction = async ({ txHash, from, to, amount, memo, status, network, blockNumber, gasUsed, gasPrice, payerName, payerEmail, customFields }: any) => {
    try {
      await paymentLinkService.recordTransaction({
        txHash,
        from,
        to,
        amount,
        memo,
        status,
        network,
        blockNumber,
        gasUsed,
        gasPrice,
        payerName,
        payerEmail,
        customFields,
        linkId,
      })
    } catch (err) {
      // Optionally handle/log error
      console.error("Failed to record transaction", err)
    }
  }

  const handlePay = async () => {
    setIsPaying(true)
    setPayError(null)
    try {
      if (paymentMethod === 'onchain') {
        if (wallets.length === 0) throw new Error("Connect your wallet first")
        if (!link.creatorAddress) throw new Error("Invalid payment link: missing recipient")
        // Use ethers.js directly for USDC transfer
        const provider = new ethers.BrowserProvider(await wallets[0].getEthereumProvider())
        const signer = await provider.getSigner()
        const network = await provider.getNetwork()
        const usdcAddress = getUSDCAddress(Number(network.chainId))
        const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, signer)
        const amountInSmallestUnit = ethers.parseUnits(amount, 6)
        const tx = await usdcContract.transfer(link.creatorAddress, amountInSmallestUnit)
        const receipt = await tx.wait()
        setTxHash(tx.hash)
        setStep(3)
        setShowConfetti(true)
        toast.success("Payment sent!")
        // Store transaction in backend
        await recordTransaction({
          txHash: tx.hash,
          from: wallets[0].address,
          to: link.creatorAddress,
          amount,
          memo: `Payment via link ${linkId}`,
          status: "confirmed",
          network: network.name || network.chainId,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          gasPrice: receipt.gasPrice?.toString(),
          payerName,
          payerEmail,
          customFields: customFieldValues,
          linkId,
        })
      } else {
        // Real backend-logged payment
        const authToken = await getAccessToken()
        if (!authToken) throw new Error("No auth token found")
        const receiptData = await paymentLinkService.processBackendPayment({
          linkId,
          amount,
          customFields: customFieldValues,
          payerName,
          payerEmail,
          authToken,
        })
        setReceipt(receiptData)
        setTxHash(receiptData.id)
        setStep(3)
        setShowConfetti(true)
        toast.success("Payment logged!")
      }
    } catch (err: any) {
      setPayError(err.message || "Payment failed")
    } finally {
      setIsPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
        <p className="text-lg text-red-500 font-semibold">{error}</p>
        <Button className="mt-4" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    )
  }

  // UI logic for wallet connection state
  if (privyAuthenticated && wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-gradient-to-br from-emerald-900/80 to-teal-900/80 rounded-xl p-8 shadow-lg flex flex-col items-center w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-amber-400 mb-3 animate-pulse-slow">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v10.5A2.25 2.25 0 009.75 19.5h4.5a2.25 2.25 0 002.25-2.25V13.5m-6.75 0h6.75m0 0l-2.25-2.25M16.5 13.5l-2.25 2.25" />
          </svg>
          <p className="text-lg text-amber-400 font-bold mb-2">Wallet Not Connected</p>
          <p className="text-slate-300 text-center mb-6 text-sm">To pay with crypto, you need to link your wallet to your account. This lets you sign and send transactions securely.</p>
          <div className="flex gap-3 w-full justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={linkWallet} className="bg-emerald-500 text-white font-semibold px-4 py-2 rounded hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition" aria-label="Link Wallet">
                    Link Wallet
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Connect your Privy wallet to this account</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={login} className="bg-white text-emerald-700 font-semibold px-4 py-2 rounded border border-emerald-400 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition" aria-label="Login">
                    Login
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Re-authenticate if you are having trouble</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-10">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-teal-700">{link.title || "Payment Link"}</CardTitle>
          <p className="text-gray-500 mt-1">{link.description}</p>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleNext() }}>
              {link.amount ? (
                <div>
                  <Label className="text-gray-700 font-medium">Amount</Label>
                  <Input value={link.amount} readOnly className="mt-1 bg-gray-100 text-black" />
                </div>
              ) : (
                <div>
                  <Label className="text-gray-700 font-medium">Amount</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-1 bg-white text-black border border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              )}
              {link.customFields && (
                <div className="space-y-4">
                  {link.customFields.map((field: any, idx: number) => (
                    <div key={idx}>
                      <Label className="text-gray-700 font-medium">{field.name}{field.required && <span className="text-emerald-600 ml-1">*</span>}</Label>
                      {field.type === "text" && (
                        <Input
                          value={customFieldValues[field.name] || ""}
                          onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                          placeholder={field.name}
                          className="mt-1 bg-white text-black border border-gray-300"
                        />
                      )}
                      {field.type === "textarea" && (
                        <textarea
                          value={customFieldValues[field.name] || ""}
                          onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                          placeholder={field.name}
                          className="mt-1 bg-white text-black border border-gray-300 rounded w-full min-h-[80px]"
                        />
                      )}
                      {field.type === "select" && (
                        <select
                          value={customFieldValues[field.name] || ""}
                          onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                          className="mt-1 bg-white text-black border border-gray-300 rounded"
                        >
                          <option value="">Select...</option>
                          {field.options && field.options.map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Label className="text-gray-700 font-medium">Payment Method</Label>
                <div className="flex gap-3 mt-1">
                  <Button type="button" variant={paymentMethod === 'onchain' ? 'default' : 'outline'} onClick={() => setPaymentMethod('onchain')} className={paymentMethod === 'onchain' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' : ''}>On-chain</Button>
                  <Button type="button" variant={paymentMethod === 'backend' ? 'default' : 'outline'} onClick={() => setPaymentMethod('backend')} className={paymentMethod === 'backend' ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' : ''}>Backend</Button>
                </div>
                {paymentMethod === 'onchain' && networkFee && (
                  <p className="text-xs text-slate-500 mt-2">Estimated Network Fee: {networkFee}</p>
                )}
                {paymentMethod === 'backend' && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Your Name</Label>
                    <Input value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="Name" className="bg-white text-black border border-gray-300" />
                    <Label className="text-gray-700 font-medium">Your Email</Label>
                    <Input value={payerEmail} onChange={e => setPayerEmail(e.target.value)} placeholder="Email" className="bg-white text-black border border-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 pt-2">
                {!privyAuthenticated && (
                  <Button
                    type="button"
                    className="bg-emerald-500 text-white"
                    onClick={privyLogin}
                    disabled={!privyReady}
                  >
                    Connect Wallet
                  </Button>
                )}
                <Button type="submit" className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-md hover:from-teal-600 hover:to-emerald-600" disabled={!privyAuthenticated || wallets.length === 0}>
                  Review Payment
                </Button>
              </div>
            </form>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-gray-700 font-medium">Amount</Label>
                <Input value={amount} readOnly className="mt-1 bg-gray-100 text-black" />
              </div>
              {link.customFields && link.customFields.length > 0 && (
                <div className="space-y-4">
                  {link.customFields.map((field: any, idx: number) => (
                    <div key={idx}>
                      <Label className="text-gray-700 font-medium">{field.name}</Label>
                      <Input value={customFieldValues[field.name] || ""} readOnly className="mt-1 bg-gray-100 text-black" />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handlePay} className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold shadow-md hover:from-teal-600 hover:to-emerald-600" disabled={isPaying}>
                  {isPaying ? <Loader2 className="h-4 w-4 mr-2 animate-spin inline" /> : null}
                  Pay
                </Button>
              </div>
              {payError && <p className="text-red-500 text-sm mt-2">{payError}</p>}
            </div>
          )}
          {step === 3 && paymentMethod === 'backend' && receipt && (
            <div className="flex flex-col items-center justify-center py-10">
              {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />} 
              <CheckCircle className="h-12 w-12 text-emerald-500 mb-2" />
              <p className="text-xl font-bold text-emerald-600 mb-2">Payment Logged!</p>
              <p className="text-gray-500 mb-2">Receipt ID:</p>
              <p className="font-mono text-xs text-gray-700 break-all mb-2">{receipt.id}</p>
              <p className="text-gray-500 mb-2">Amount: <span className="text-black font-semibold">{receipt.amount}</span></p>
              <p className="text-gray-500 mb-2">Payer: <span className="text-black font-semibold">{receipt.payerName}</span></p>
              <p className="text-gray-500 mb-2">Email: <span className="text-black font-semibold">{receipt.payerEmail}</span></p>
              <Button onClick={() => router.push("/")} className="bg-emerald-500 text-white mt-4">Go Home</Button>
            </div>
          )}
          {step === 3 && paymentMethod === 'onchain' && txHash && (
            <div className="flex flex-col items-center justify-center py-10">
              {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />} 
              <CheckCircle className="h-12 w-12 text-emerald-500 mb-2" />
              <p className="text-xl font-bold text-emerald-600 mb-2">Payment Successful!</p>
              <div className="w-full max-w-md bg-gradient-to-br from-emerald-900/80 to-teal-900/80 rounded-xl p-4 mb-4 flex flex-col items-center shadow-lg">
                <p className="text-slate-300 mb-2 font-medium">Transaction Hash</p>
                <div className="flex items-center gap-2 w-full justify-center">
                  <span className="font-mono text-xs text-white break-all select-all bg-slate-800/60 px-2 py-1 rounded">{txHash}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(txHash); toast.success("Transaction hash copied!") }} aria-label="Copy transaction hash">
                          <Copy className="h-4 w-4 text-emerald-300" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Hash</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button asChild variant="outline" size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white border-none ml-1" aria-label="View in Explorer">
                    <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75V6A2.25 2.25 0 0015 3.75h-6A2.25 2.25 0 006.75 6v12A2.25 2.25 0 009 20.25h6A2.25 2.25 0 0017.25 18v-.75M15 12h6m0 0l-2.25-2.25M21 12l-2.25 2.25" />
                      </svg>
                    </a>
                  </Button>
                </div>
              </div>
              <Button onClick={() => router.push("/")} className="bg-emerald-500 text-white mt-4 hover:bg-emerald-600">Go Home</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 