export interface Transaction {
  hash: string
  from: string
  to: string
  amount: string
  memo?: string
  timestamp: number
  status: "pending" | "confirmed" | "failed"
  blockNumber?: number
  gasUsed?: string
  gasPrice?: string
}

export interface PaymentLink {
  id: string
  linkId: string
  creator: string
  amount: string
  description?: string
  expirationType: "one-time" | "time-based" | "public"
  expiresAt?: number
  customFields?: Record<string, any>
  isActive: boolean
  usageCount: number
  createdAt: number
}

export interface TransferParams {
  to: string
  amount: string
  memo?: string
}

export interface TransferToUsernameParams {
  username: string
  amount: string
  memo?: string
}

export interface CreatePaymentLinkParams {
  amount: string
  expiration: number
  linkId: string
}

export interface ProcessPaymentLinkParams {
  linkId: string
  payerData?: string
}

export interface GasEstimate {
  gasLimit: string
  gasPrice: string
  totalCost: string
}
