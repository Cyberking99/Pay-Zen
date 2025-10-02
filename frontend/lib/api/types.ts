export interface ApiResponse<T = any> {
  success: boolean
  user: T
  token: string
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserProfile {
  id: string
  privyId: string
  walletAddress: string
  username?: string
  fullName?: string
  age?: number
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  txHash: string
  type: "sent" | "received"
  amount: string
  memo?: string
  status: "pending" | "confirmed" | "failed"
  network?: string
  blockNumber?: number
  createdAt: string
  from: {
    address: string
    username?: string
    fullName?: string
  }
  to: {
    address: string
    username?: string
    fullName?: string
  }
}

export interface PaymentLink {
  id: string
  creatorId: string
  linkId: string
  amount: string
  description?: string
  expirationType: "one-time" | "time-based" | "public"
  expiresAt?: string
  customFields?: Record<string, any>
  isActive: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface PaymentLinkResponse {
  paymentLink: {
    url: string,
    creatorAddress: string,
  }
  success: boolean
  error?: string
}

export interface PaymentLinkAnalytics {
  linkId: string
  totalViews: number
  totalPayments: number
  totalAmount: string
  conversionRate: number
  recentActivity: {
    date: string
    views: number
    payments: number
    amount: string
  }[]
}

export interface SendMoneyRequest {
  recipient: string // username or wallet address
  amount: string
  memo?: string
  recipientType: "username" | "address"
}

export interface CreatePaymentLinkRequest {
  amount?: string
  description?: string
  expirationType: "one-time" | "time-based" | "public"
  expiresAt?: string
  customFields?: Array<{
    name: string
    type: "text" | "select" | "textarea"
    required: boolean
    options?: string[]
  }>
}

export interface ProcessPaymentRequest {
  linkId: string
  customFieldData?: Record<string, string>
}
