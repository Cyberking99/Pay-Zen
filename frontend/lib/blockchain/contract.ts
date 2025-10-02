import { ethers } from "ethers"
import { BLOCKCHAIN_CONFIG, USDC_ABI, getUSDCAddress, formatUSDCAmount, parseUSDCAmount } from "./config"
import type {
  Transaction,
  PaymentLink,
  TransferParams,
  TransferToUsernameParams,
  CreatePaymentLinkParams,
  ProcessPaymentLinkParams,
  GasEstimate,
} from "./types"
import GreatPayABI from "@/components/ABIS/GreatPay.json"

export class StablecoinContract {
  private contract: ethers.Contract
  private provider: ethers.Provider
  private signer?: ethers.Signer
  private chainId: number
  private greatPayContract: ethers.Contract

  constructor(provider: ethers.Provider, signer?: ethers.Signer, chainId: number = BLOCKCHAIN_CONFIG.DEFAULT_NETWORK) {
    this.provider = provider
    this.signer = signer
    this.chainId = chainId

    const usdcAddress = getUSDCAddress(chainId)
    this.contract = new ethers.Contract("0x036CbD53842c5426634e7929541eC2318f3dCF7e", USDC_ABI, signer || provider)
    
    const greatPayAddress = "0xa7c2227e7285f638E1D00E83c28538f3c919Dfc8"
    this.greatPayContract = new ethers.Contract(greatPayAddress, GreatPayABI, signer || provider)
  }

  // Balance operations
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(address)
      console.log("[getBalance] Balance:", balance)
      return formatUSDCAmount(balance)
    } catch (error) {
      console.error("Error getting balance:", error)
      throw new Error("Failed to get balance")
    }
  }

  // Transfer operations - simplified for standard ERC-20
  async transfer(params: TransferParams): Promise<string> {
    if (!this.signer) throw new Error("Signer required for transfers")

    try {
      const amount = parseUSDCAmount(params.amount)

      const tx = await this.contract.transfer(params.to, amount)
      return tx.hash
    } catch (error) {
      console.error("Error sending transfer:", error)
      throw new Error("Failed to send transfer")
    }
  }

  async transferToUsername(params: TransferToUsernameParams): Promise<string> {
    throw new Error("Username transfers must be handled through the API backend")
  }

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<string> {
    throw new Error("Payment links must be handled through the API backend")
  }

  async processPaymentLink(params: ProcessPaymentLinkParams): Promise<string> {
    throw new Error("Payment links must be handled through the API backend")
  }

  async deactivatePaymentLink(linkId: string): Promise<string> {
    throw new Error("Payment links must be handled through the API backend")
  }

  async getPaymentLinkDetails(linkId: string): Promise<PaymentLink | null> {
    // Payment links are handled by backend API
    return null
  }

  async getUserTransactions(address: string, offset = 0, limit = 50): Promise<Transaction[]> {
    // Transaction history should be fetched from backend API or blockchain indexer
    return []
  }

  async resolveUsername(username: string): Promise<string | null> {
    // Username resolution handled by backend API
    return null
  }

  async isUserRegistered(address: string): Promise<boolean> {
    try {
      // Debug: log network and contract address
      const network = await this.provider.getNetwork();
      console.log("[isUserRegistered] Network:", network.chainId, "Contract address:", this.greatPayContract.target);
      // Debug: check if contract code exists at address
      const code = await this.provider.getCode(this.greatPayContract.target);
      console.log("[isUserRegistered] Contract code at address:", code);
      if (code === "0x") {
        console.error("[isUserRegistered] No contract deployed at this address on the current network.");
        return false;
      }
      const username = await this.greatPayContract.addressToUsername(address)
      console.log("[isUserRegistered] Username:", username);
      return !!username && username.length > 0
    } catch (error) {
      console.error("Error checking registration:", error)
      return false
    }
  }

  // Gas estimation for standard ERC-20 operations
  async estimateGas(method: string, params: any[]): Promise<GasEstimate> {
    try {
      const gasLimit = await this.contract[method].estimateGas(...params)
      const feeData = await this.provider.getFeeData()
      const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei")

      const totalCost = gasLimit * gasPrice

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, "gwei"),
        totalCost: ethers.formatEther(totalCost),
      }
    } catch (error) {
      console.error("Error estimating gas:", error)
      throw new Error("Failed to estimate gas")
    }
  }

  onTransfer(callback: (from: string, to: string, amount: string) => void) {
    this.contract.on("Transfer", (from, to, value) => {
      callback(from, to, formatUSDCAmount(value))
    })
  }

  onPaymentLinkCreated(callback: (linkId: string, creator: string, amount: string) => void) {
    // Not available in standard USDC contract
  }

  onPaymentLinkUsed(callback: (linkId: string, payer: string, amount: string) => void) {
    // Not available in standard USDC contract
  }

  removeAllListeners() {
    this.contract.removeAllListeners()
  }
}
