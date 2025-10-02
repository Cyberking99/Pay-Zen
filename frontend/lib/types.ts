export interface UserProfile {
  name: string
  username: string
  age: string
}

export interface Transaction {
  id: string
  type: "received" | "sent" | "link_payment"
  amount: number
  currency: string
  from: string
  to: string
  description: string
  status: "completed" | "pending" | "failed"
  timestamp: string
  hash: string
  fee: number
  confirmations: number
  linkId?: string
}

export interface PaymentLink {
  id: string
  title: string
  description: string
  amount: number
  fixedAmount: boolean
  status: "active" | "expired" | "deactivated"
  expirationType: "one-time" | "time-based" | "public"
  expirationDate: string | null
  createdDate: string
  url: string
  paymentsReceived: number
  totalReceived: number
  clicks: number
  customFields: number
}

export interface CustomField {
  id: number
  type: "text" | "select" | "textarea"
  label: string
  required: boolean
  options?: string[]
}
