"use client"

import { useEffect, useState } from "react"
import { ethers, BrowserProvider } from "ethers"
import { useWallets } from "@privy-io/react-auth"
import { StablecoinContract } from "@/lib/blockchain/contract"
import type { Transaction, PaymentLink, GasEstimate } from "@/lib/blockchain/types"

export function useBlockchain() {
  const { wallets } = useWallets()
  const [contract, setContract] = useState<StablecoinContract | null>(null)
  const [provider, setProvider] = useState<ethers.Provider | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const [loading, setLoading] = useState(true)

  const primaryWallet = wallets.find((wallet) => wallet.walletClientType === "privy")

  useEffect(() => {
    const initializeBlockchain = async () => {
      try {
        if (!primaryWallet) {
          setLoading(false)
          return
        }

        // Get provider from wallet
        const ethereumProvider = await primaryWallet.getEthereumProvider()
        const web3Provider = new BrowserProvider(ethereumProvider)
        const signer = await web3Provider.getSigner()
        const network = await web3Provider.getNetwork()
        const chainId = Number(network.chainId)
        setProvider(web3Provider)
        const contractInstance = new StablecoinContract(web3Provider, signer, chainId)
        setContract(contractInstance)

        // Get initial balance
        if (primaryWallet.address) {
          const userBalance = await contractInstance.getBalance(primaryWallet.address)
          console.log("userBalance", userBalance, primaryWallet.address)
          console.log("contractInstance", contractInstance)
          setBalance(userBalance)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error initializing blockchain:", error)
        setLoading(false)
      }
    }

    initializeBlockchain()
  }, [primaryWallet])

  // Balance operations
  const refreshBalance = async () => {
    if (!contract || !primaryWallet?.address) return

    try {
      const userBalance = await contract.getBalance(primaryWallet.address)
      setBalance(userBalance)
    } catch (error) {
      console.error("Error refreshing balance:", error)
    }
  }

  const sendTransfer = async (to: string, amount: string, memo?: string) => {
    if (!contract) throw new Error("Contract not initialized")

    const txHash = await contract.transfer({ to, amount })

    // Refresh balance after transaction
    setTimeout(refreshBalance, 2000)

    return txHash
  }

  const sendTransferToUsername = async (username: string, amount: string, memo?: string) => {
    throw new Error("Username transfers must be handled through the API backend")
  }

  const createPaymentLink = async (amount: string, expiration: number, linkId: string) => {
    throw new Error("Payment links must be handled through the API backend")
  }

  const processPaymentLink = async (linkId: string, payerData?: string) => {
    throw new Error("Payment links must be handled through the API backend")
  }

  const deactivatePaymentLink = async (linkId: string) => {
    throw new Error("Payment links must be handled through the API backend")
  }

  const getPaymentLinkDetails = async (linkId: string): Promise<PaymentLink | null> => {
    return null // Handled by API backend
  }

  const getUserTransactions = async (offset = 0, limit = 50): Promise<Transaction[]> => {
    return [] // Handled by API backend
  }

  const resolveUsername = async (username: string): Promise<string | null> => {
    return null // Handled by API backend
  }

  // Gas estimation for USDC transfers
  const estimateTransferGas = async (to: string, amount: string, memo?: string): Promise<GasEstimate> => {
    if (!contract) throw new Error("Contract not initialized")

    const { parseUSDCAmount } = await import("@/lib/blockchain/config")
    const amountWei = parseUSDCAmount(amount)

    return await contract.estimateGas("transfer", [to, amountWei])
  }

  return {
    // State
    contract,
    provider,
    balance,
    loading,
    walletAddress: primaryWallet?.address,

    // Balance operations
    refreshBalance,

    // Transfer operations (USDC only)
    sendTransfer,
    sendTransferToUsername, // Will throw error - use API instead

    // Payment link operations (API backend only)
    createPaymentLink, // Will throw error - use API instead
    processPaymentLink, // Will throw error - use API instead
    deactivatePaymentLink, // Will throw error - use API instead

    // Query operations (API backend only)
    getPaymentLinkDetails, // Returns null - use API instead
    getUserTransactions, // Returns empty - use API instead
    resolveUsername, // Returns null - use API instead

    // Gas estimation
    estimateTransferGas,
  }
}

export function useIsRegistered() {
  const { wallets } = useWallets()
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const primaryWallet = wallets.find((wallet) => wallet.walletClientType === "privy")

  useEffect(() => {
    const checkRegistration = async () => {
      setLoading(true)
      if (!primaryWallet) {
        setIsRegistered(null)
        setLoading(false)
        return
      }
      const ethereumProvider = await primaryWallet.getEthereumProvider()
      const web3Provider = new BrowserProvider(ethereumProvider)
      const signer = await web3Provider.getSigner()
      const { StablecoinContract } = await import("@/lib/blockchain/contract")
      const contract = new StablecoinContract(web3Provider, signer)
      const registered = await contract.isUserRegistered(primaryWallet.address)
      console.log("isUserRegistered", registered)
      setIsRegistered(registered)
      setLoading(false)
    }
    checkRegistration()
  }, [primaryWallet])

  return { isRegistered, loading }
}
