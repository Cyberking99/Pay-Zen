import { ethers } from "ethers"
import logger from "../utils/logger.js"

// USDC Contract ABI (ERC-20 standard)
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
]

// Network configurations
const NETWORKS = {
  base: {
    rpcUrl: process.env.BASE_RPC_URL,
    usdcAddress: process.env.USDC_BASE,
    chainId: 84532,
  },
}

export const blockchainService = {
  // Get provider for network
  getProvider(network: string): ethers.JsonRpcProvider {
    const config = NETWORKS[network as keyof typeof NETWORKS]
    console.log(config)
    if (!config) {
      throw new Error(`Unsupported network: ${network}`)
    }
    return new ethers.JsonRpcProvider(config.rpcUrl)
  },

  // Get USDC contract instance
  getUSDCContract(network: string, provider: ethers.JsonRpcProvider): ethers.Contract {
    const config = NETWORKS[network as keyof typeof NETWORKS]
    if (!config) {
      throw new Error(`Unsupported network: ${network}`)
    }
    return new ethers.Contract((config.usdcAddress as string), USDC_ABI, provider)
  },

  // Get USDC balance for an address
  async getUSDCBalance(address: string, network: string): Promise<bigint> {
    try {
      const provider = this.getProvider(network)
      const usdcContract = this.getUSDCContract(network, provider)

      const balance = await usdcContract?.balanceOf?.(address) ?? 0;
      return balance
    } catch (error) {
      logger.error(`Balance fetch error for ${address} on ${network}:`, error)
      throw error
    }
  },

  // Estimate gas for USDC transfer
  async estimateTransferGas(
    from: string,
    to: string,
    amount: bigint,
    network: string,
  ): Promise<{
    gasLimit: bigint
    gasPrice: bigint
  }> {
    try {
      const provider = this.getProvider(network)
      const usdcContract = this.getUSDCContract(network, provider)

      // Estimate gas limit
      const gasLimit = await usdcContract?.transfer?.estimateGas?.(to, amount, { from })

      // Get current gas price
      const feeData = await provider.getFeeData()
      const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei")

      if (gasLimit === undefined) throw new Error("Failed to estimate gas limit")
      return {
        gasLimit: (gasLimit * 120n) / 100n, // Add 20% buffer
        gasPrice,
      }
    } catch (error) {
      logger.error(`Gas estimation error for ${from} -> ${to} on ${network}:`, error)
      throw error
    }
  },

  // Get transaction receipt
  async getTransactionReceipt(txHash: string, network: string): Promise<ethers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider(network)
      return await provider.getTransactionReceipt(txHash)
    } catch (error) {
      logger.error(`Transaction receipt error for ${txHash} on ${network}:`, error)
      return null
    }
  },

  // Monitor transaction status
  async waitForTransaction(txHash: string, network: string, confirmations = 1): Promise<ethers.TransactionReceipt> {
    try {
      const provider = this.getProvider(network)
      const receipt = await provider.waitForTransaction(txHash, confirmations)
      if (!receipt) throw new Error("Transaction not found")
      return receipt
    } catch (error) {
      logger.error(`Transaction monitoring error for ${txHash} on ${network}:`, error)
      throw error
    }
  },
}

// Export individual functions for backward compatibility
export const getUSDCBalance = blockchainService.getUSDCBalance.bind(blockchainService)
