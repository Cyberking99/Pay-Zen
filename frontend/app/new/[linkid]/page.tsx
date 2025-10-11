"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getAccessToken } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { USDC_ABI, getUSDCAddress, BLOCKCHAIN_CONFIG } from "@/lib/blockchain/config";
import { paymentLinkService } from "@/lib/api";
import { CustomField } from "@/components/payment/CustomField";
import { WalletConnectionStatus } from "@/components/payment/WalletConnectionStatus";
import { Loader2, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import Confetti from "react-confetti";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PaymentLink } from "@/lib/api/types";

export default function NewPaymentPage() {
  const { linkid } = useParams<{ linkid: string }>();
  const router = useRouter();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [amount, setAmount] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<any>({});
  const [step, setStep] = useState(1); // 1: form, 2: review, 3: result
  const [isPaying, setIsPaying] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'onchain' | 'backend'>('onchain');
  const [networkFee, setNetworkFee] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [selectedChain, setSelectedChain] = useState<number>(84532); // Default to Base Sepolia
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  // Privy wallet connection hooks
  const { login: privyLogin, authenticated: privyAuthenticated, ready: privyReady, linkWallet } = usePrivy();
  const { wallets } = useWallets();
  const primaryWallet = wallets.find((w: any) => w.walletClientType === "privy");

  // Fetch payment link data
  useEffect(() => {
    async function fetchLink() {
      setLoading(true);
      setError(null);
      try {
        const data = await paymentLinkService.getLink(linkid);
        // Parse customFields if it's a string
        if (data.customFields && typeof data.customFields === 'string') {
          try {
            data.customFields = JSON.parse(data.customFields);
          } catch {
            data.customFields = [];
          }
        }
        setLink(data);
        if (data.amount) setAmount(data.amount);
      } catch (err: any) {
        setError(err.message || "Payment link not found");
      } finally {
        setLoading(false);
      }
    }
    if (linkid) fetchLink();
  }, [linkid]);

  // Estimate network fee for on-chain payment
  useEffect(() => {
    async function estimateFee() {
      if (paymentMethod === 'onchain' && link && amount && !isNaN(Number(amount)) && Number(amount) > 0) {
        try {
          setNetworkFee('~0.01 USDC');
        } catch {
          setNetworkFee(null);
        }
      } else {
        setNetworkFee(null);
      }
    }
    estimateFee();
  }, [paymentMethod, link, amount]);

  // Handlers
  const handleCustomFieldChange = (name: string, value: string) => {
    setCustomFieldValues((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleConnectWallet = async () => {
    try {
      if (!privyAuthenticated) {
        await privyLogin();
      } else if (wallets.length === 0) {
        await linkWallet();
      }
      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet");
    }
  };

  const handleSwitchChain = async (chainId: number) => {
    if (!primaryWallet) return;
    
    setIsSwitchingChain(true);
    const provider = await primaryWallet.getEthereumProvider();
    
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      
      setSelectedChain(chainId);
      toast.success(`Switched to ${getChainName(chainId)}`);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          const chainConfig = getChainConfig(chainId);
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          });
          setSelectedChain(chainId);
          toast.success(`Added and switched to ${getChainName(chainId)}`);
        } catch (addError: any) {
          toast.error(`Failed to add chain: ${addError.message}`);
        }
      } else {
        toast.error(`Failed to switch chain: ${switchError.message}`);
      }
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const getChainConfig = (chainId: number) => {
    switch (chainId) {
      case 84532: // Base Sepolia
        return {
          chainId: `0x${chainId.toString(16)}`,
          chainName: 'Base Sepolia',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://sepolia.base.org'],
          blockExplorerUrls: ['https://sepolia.basescan.org'],
        };
      case 23448594291968334: // Starknet Sepolia
        return {
          chainId: `0x${chainId.toString(16)}`,
          chainName: 'Starknet Sepolia',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://starknet-sepolia.public.blastapi.io'],
          blockExplorerUrls: ['https://sepolia.starkscan.co'],
        };
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  };

  const getChainName = (chainId: number): string => {
    switch (chainId) {
      case 84532: return "Base Sepolia";
      case 23448594291968334: return "Starknet Sepolia";
      default: return `Chain ${chainId}`;
    }
  };

  const getChainIcon = (chainId: number): string => {
    switch (chainId) {
      case 84532:
        return "🔵"; // Base icon (blue circle)
      case 23448594291968334:
        return "⚡"; // Starknet icon (lightning bolt)
      default:
        return "⛓️"; // Generic chain icon
    }
  };

  const handleNext = () => {
    // Validate amount if required
    if (!link?.amount && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)) {
      toast.error("Please enter a valid amount");
      return;
    }
    // Validate required custom fields
    if (link?.customFields && Array.isArray(link.customFields)) {
      for (const field of link.customFields) {
        if (field.required && !customFieldValues[field.name]) {
          toast.error(`Please fill the required field: ${field.name}`);
          return;
        }
      }
    }
    setStep(2);
  };

  const recordTransaction = async (transactionData: any) => {
    try {
      await paymentLinkService.recordTransaction({
        ...transactionData,
        linkId: linkid,
      });
    } catch (err) {
      console.error("Failed to record transaction", err);
    }
  };

  const handlePay = async () => {
    setIsPaying(true);
    setPayError(null);
    try {
      if (paymentMethod === 'onchain') {
        if (wallets.length === 0) throw new Error("Connect your wallet first");
        // For now, we'll use a valid placeholder address - in real implementation, this should come from the link data
        // Using a known valid Ethereum address (Vitalik's address as example)
        const validAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
        const formattedAddress = ethers.getAddress(validAddress);
        
        const provider = new ethers.BrowserProvider(await wallets[0].getEthereumProvider());
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        const usdcAddress = getUSDCAddress(selectedChain);
        const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, signer);
        const amountInSmallestUnit = ethers.parseUnits(amount.toString(), 6);
        const tx = await usdcContract.transfer(formattedAddress, amountInSmallestUnit);
        const receipt = await tx.wait();
        setTxHash(tx.hash);
        setStep(3);
        setShowConfetti(true);
        toast.success("Payment sent!");
        
        await recordTransaction({
          txHash: tx.hash,
          from: wallets[0].address,
          to: formattedAddress,
          amount,
          memo: `Payment via link ${linkid}`,
          status: "confirmed",
          network: network.name || network.chainId,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          gasPrice: receipt.gasPrice?.toString(),
          payerName,
          payerEmail,
          customFields: customFieldValues,
        });
      } else {
        const authToken = await getAccessToken();
        if (!authToken) throw new Error("No auth token found");
        const receiptData = await paymentLinkService.processBackendPayment({
          linkId: linkid,
          amount,
          customFields: customFieldValues,
          payerName,
          payerEmail,
          authToken,
        });
        setReceipt(receiptData);
        setTxHash(receiptData.id);
        setStep(3);
        setShowConfetti(true);
        toast.success("Payment logged!");
      }
    } catch (err: any) {
      setPayError(err.message || "Payment failed");
    } finally {
      setIsPaying(false);
    }
  };

  const isWalletConnected = privyAuthenticated && wallets.length > 0;
  const isFormValid = link?.amount ? true : (amount && !isNaN(Number(amount)) && Number(amount) > 0);

  // Loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#A3FF50]" />
      </div>
    );
  }

  // Error state
  if (error || !link) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
        <p className="text-lg text-red-500 font-semibold">{error || "Link not found"}</p>
        <Button className="mt-4" onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen h-screen overflow-hidden flex bg-white">
      {/* Left Side - Payment Link Info */}
      <div className="w-[50%] h-full bg-[#000000] flex flex-col">
        <div className="flex h-full flex-col w-[70%] mx-auto py-14">
          <div className="flex items-center gap-2 text-white text-xl">
            <span className="size-[20px] bg-white border-b-8 border-[#A3FF50] rounded"></span>
            Payzen
          </div>

          <div className="mt-12 w-full overflow-hidden h-[250px] bg-[#262626] rounded-2xl relative">
            <Image
              src="https://img.freepik.com/free-photo/abstract-flowing-neon-wave-background_53876-101942.jpg?semt=ais_hybrid&w=740&q=80"
              alt="Payment"
              fill
              className="object-cover"
            />
          </div>
          
          <div className="text mt-8 font-medium leading-6 text-white/60">
            Payment Link
          </div>
          
          <div className="flex gap-1 my-2 text-3xl font-bold leading-10 text-white">
            <span className="text-white/40">$</span>
            <span>{link.amount || amount || "0"}</span>
          </div>
          
          <div className="text-white/60 text-sm leading-relaxed max-w-md">
            {link.description || "Complete your payment using the form on the right."}
          </div>
          
          <div className="mt-auto text-white/60 text-sm leading-relaxed max-w-md">
            Powered By{" "}
            <span className="text-white font-medium pr-2">Payzen</span> |
            <span className="text-white/40 px-2">
              © 2025 Payzen. All rights reserved.
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Payment Form */}
      <div className="w-[50%] bg-[#F9FAFB] h-full overflow-x-auto">
        <div className="w-[60%] mx-auto h-full flex flex-col mt-16">
          <div className="w-full bg-white p-6 rounded-xl border border-gray-100">
            
            {step === 1 && (
              <div className="space-y-6">
            <h3 className="text font-semibold text-gray-900">
                  Payment Information
            </h3>
            <div className="text-sm text-gray-500">
              Please fill in the following information to complete your payment.
            </div>

                {/* Amount Field */}
                {link.amount ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Amount</label>
                    <input
                      value={link.amount}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-[#A3FF50] focus:ring-1 focus:ring-[#A3FF50] transition-all duration-200"
                    />
                  </div>
                )}

                {/* Custom Fields */}
                {link.customFields && Array.isArray(link.customFields) && link.customFields.length > 0 && (
                  <div className="space-y-4">
                    {link.customFields.map((field: any, idx: number) => (
                      <CustomField
                        key={idx}
                        field={field}
                        value={customFieldValues[field.name] || ""}
                        onChange={handleCustomFieldChange}
                      />
                    ))}
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Payment Method</label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={paymentMethod === 'onchain' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('onchain')}
                      className={paymentMethod === 'onchain' ? 'bg-[#A3FF50] text-black hover:bg-[#A3FF50]' : ''}
                    >
                      On-chain
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'backend' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('backend')}
                      className={paymentMethod === 'backend' ? 'bg-[#A3FF50] text-black hover:bg-[#A3FF50]' : ''}
                    >
                      Backend
                    </Button>
                  </div>
                  
                  {/* {paymentMethod === 'onchain' && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Select Network</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(BLOCKCHAIN_CONFIG.NETWORKS).map(([name, chainId]) => (
                          <Button
                            key={`${name}-${chainId}`}
                            type="button"
                            variant={selectedChain === chainId ? 'default' : 'outline'}
                            onClick={() => handleSwitchChain(chainId)}
                            disabled={isSwitchingChain}
                            className={`${selectedChain === chainId ? 'bg-[#A3FF50] text-black hover:bg-[#A3FF50]' : ''} flex items-center justify-center gap-2`}
                          >
                            {isSwitchingChain && selectedChain === chainId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <span className="text-lg">{getChainIcon(chainId)}</span>
                            )}
                            {name.replace(/_/g, ' ')}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {getChainName(selectedChain)} | Estimated Fee: {networkFee || '~0.01 USDC'}
                      </p>
                    </div>
                  )} */}
                  
                  {paymentMethod === 'backend' && (
                    <div className="space-y-3">
              <input
                type="text"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-[#A3FF50] focus:ring-1 focus:ring-[#A3FF50] transition-all duration-200"
              />
              <input
                type="email"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        placeholder="Your Email"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-[#A3FF50] focus:ring-1 focus:ring-[#A3FF50] transition-all duration-200"
                      />
                    </div>
                  )}
                </div>

                {/* Wallet Connection */}
                {paymentMethod === 'onchain' && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">
                      {isWalletConnected
                        ? "Your wallet is connected and ready for payment."
                        : "Connect your wallet to complete your payment."}
                    </div>
                    
                    <WalletConnectionStatus
                      isConnected={isWalletConnected}
                      walletAddress={primaryWallet?.address}
                    />

                    {!isWalletConnected && (
                      <Button
                        type="button"
                        onClick={handleConnectWallet}
                        disabled={!privyReady}
                        className="h-[40px] w-full bg-[#A3FF50] hover:bg-[#A3FF50] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        variant="destructive"
                      >
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                )}

                {/* Proceed Button */}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isFormValid || (paymentMethod === 'onchain' && !isWalletConnected)}
                  className="h-[40px] mt-6 w-full bg-[#A3FF50] hover:bg-[#A3FF50] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  variant="destructive"
                >
                  Review Payment
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text font-semibold text-gray-900">Review Payment</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <input
                    value={link.amount || amount}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700"
                  />
            </div>

                {link.customFields && Array.isArray(link.customFields) && link.customFields.length > 0 && (
                  <div className="space-y-4">
                    {link.customFields.map((field: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{field.name}</label>
                        <input
                          value={customFieldValues[field.name] || ""}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePay}
                    disabled={isPaying}
                    className="flex-1 bg-[#A3FF50] hover:bg-[#A3FF50] text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    variant="destructive"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                        Processing...
                      </>
                    ) : (
                      "Pay Now"
                    )}
                  </Button>
                </div>

                {payError && (
                  <p className="text-red-500 text-sm mt-2">{payError}</p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-10">
                {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-xl font-bold text-green-600 mb-2">
                  {paymentMethod === 'onchain' ? 'Payment Successful!' : 'Payment Logged!'}
                </p>
                
                {paymentMethod === 'onchain' && txHash && (
                  <div className="w-full max-w-md bg-gradient-to-br from-green-900/80 to-emerald-900/80 rounded-xl p-4 mb-4 flex flex-col items-center shadow-lg">
                    <p className="text-white mb-2 font-medium">Transaction Hash</p>
                    <div className="flex items-center gap-2 w-full justify-center">
                      <span className="font-mono text-xs text-white break-all select-all bg-slate-800/60 px-2 py-1 rounded">
                        {txHash}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(txHash);
                                toast.success("Transaction hash copied!");
                              }}
                              aria-label="Copy transaction hash"
                            >
                              <Copy className="h-4 w-4 text-green-300" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy Hash</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}

                {paymentMethod === 'backend' && receipt && (
                  <div className="space-y-2 text-center">
                    <p className="text-gray-500">Receipt ID:</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{receipt.id}</p>
                    <p className="text-gray-500">Amount: <span className="text-black font-semibold">{receipt.amount}</span></p>
                    <p className="text-gray-500">Payer: <span className="text-black font-semibold">{receipt.payerName}</span></p>
                  </div>
                )}

                <Button
                  onClick={() => router.push("/")}
                  className="bg-[#A3FF50] hover:bg-[#A3FF50] text-black mt-4"
                  variant="destructive"
                >
                  Go Home
                </Button>
              </div>
            )}
          </div>

          <div className="flex mt-8 flex-row gap-4 items-center w-full justify-center">
            <div className="text-xs font-medium leading-6 text-[#858B8A] flex flex-row gap-2 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                color="currentColor"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  d="M4.26781 18.8447C4.49269 20.515 5.87613 21.8235 7.55966 21.9009C8.97627 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.879 17.7547 20 16.6376 20 15.5C20 14.3624 19.879 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97627 9.03397 7.55966 9.09909C5.87613 9.17649 4.49269 10.485 4.26781 12.1553C4.12104 13.2453 4 14.3624 4 15.5C4 16.6376 4.12104 17.7547 4.26781 18.8447Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M11.9961 15.5H12.0051"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
              Secure and encrypted by payzen.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}