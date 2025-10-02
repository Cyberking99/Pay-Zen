import { getAccessToken } from "@privy-io/react-auth"
import { apiClient } from "./config"
import type {
  ApiResponse,
  PaymentLink,
  PaymentLinkAnalytics,
  CreatePaymentLinkRequest,
  ProcessPaymentRequest,
  PaymentLinkResponse,
} from "./types"

export interface PaymentLinksParams {
  page?: number
  limit?: number
  status?: "active" | "inactive" | "expired"
  search?: string
}

export const paymentLinkService = {
  // Create payment link
  async create(data: CreatePaymentLinkRequest): Promise<PaymentLink> {
    const authToken = await getAccessToken()
    const response = await apiClient.post<ApiResponse<PaymentLink>>("/payment-links/create", data, {
      headers: {
        "X-Authorization-Override": `Bearer ${authToken}`,
      },
    })

    if (response.data.success) {
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to create payment link")
  },

  // Create payment link with explicit authToken
  async createPaymentLink({ amount, description, expirationType, expiresAt, customFields, authToken }: { amount?: string, description?: string, expirationType: 'one-time' | 'time-based' | 'public', expiresAt?: string, customFields?: any[], authToken: string }): Promise<PaymentLink> {
    const response = await apiClient.post<ApiResponse<PaymentLinkResponse>>(
      "/payment-links/create",
      { amount, description, expirationType, expiresAt, customFields },
      {
        headers: {
          "X-Authorization-Override": `Bearer ${authToken}`,
        },
      }
    )
    if (response.status === 200) {
      return response.data
    }
    
    throw new Error(response.data.error || "Failed to create payment link")
  },

  // Get user's payment links
  async getLinks(params: PaymentLinksParams = {}): Promise<PaymentLink[]> {
    const authToken = await getAccessToken()

    const response = await apiClient.get<ApiResponse<PaymentLink[]>>("/payment-links", {
      params,
      headers: {
        "X-Authorization-Override": `Bearer ${authToken}`,
      },
    })

    if (response.data.success) {
      console.log("response", response.data)
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to get payment links")
  },

  // Get specific payment link
  async getLink(id: string): Promise<PaymentLink> {
    const authToken = await getAccessToken()
    const response = await apiClient.get<PaymentLink>(`/payment-links/${id}`, {
      headers: {
        "X-Authorization-Override": `Bearer ${authToken}`,
      },
    })

    if (response.status === 200) {
      console.log("response", response.data)
      return response.data
    }

    throw new Error("Failed to get payment link")
  },

  // Deactivate payment link
  async deactivate(id: string): Promise<void> {
    const authToken = await getAccessToken()
    const response = await apiClient.put<ApiResponse<void>>(`/payment-links/${id}/deactivate`, {
      headers: {
        "X-Authorization-Override": `Bearer ${authToken}`,
      },
    })

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to deactivate payment link")
    }
  },

  // Get payment link analytics
  async getAnalytics(id: string): Promise<PaymentLinkAnalytics> {
    const authToken = await getAccessToken()
    const response = await apiClient.get<ApiResponse<PaymentLinkAnalytics>>(`/payment-links/${id}/analytics`, {
      headers: {
        "X-Authorization-Override": `Bearer ${authToken}`,
      },
    })

    if (response.data.success) {
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to get analytics")
  },

  // Process payment via link (public endpoint)
  async processPayment(data: ProcessPaymentRequest): Promise<{ txHash: string; success: boolean }> {
    const response = await apiClient.post<ApiResponse<{ txHash: string; success: boolean }>>(
      `/payment-links/${data.linkId}/pay`,
      { customFieldData: data.customFieldData },
    )

    if (response.data.success) {
      return response.data.user
    }

    throw new Error(response.data.error || "Failed to process payment")
  },

  // Log a backend payment for a payment link
  async processBackendPayment({ linkId, amount, customFields, payerName, payerEmail, authToken }: { linkId: string, amount: string, customFields?: any, payerName?: string, payerEmail?: string, authToken: string }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/payment-links/${linkId}/pay`,
      { amount, customFields, payerName, payerEmail },
      {
        headers: {
          "X-Authorization-Override": `Bearer ${authToken}`,
        },
      }
    )
    if (response.data.success) {
      return response.data.user
    }
    throw new Error(response.data.error || "Failed to log payment")
  },

  // Store a transaction for a payment link payment
  async recordTransaction({ txHash, from, to, amount, memo, status, network, blockNumber, gasUsed, gasPrice, payerName, payerEmail, customFields, linkId }: any): Promise<void> {
    const authToken = await getAccessToken()
    await apiClient.post(
      "/transactions/record",
      {
        tx_hash: txHash,
        from_address: from,
        to_address: to,
        amount,
        memo,
        status,
        network,
        block_number: blockNumber,
        gas_used: gasUsed,
        gas_price: gasPrice,
        payer_name: payerName,
        payer_email: payerEmail,
        custom_fields: customFields,
        payment_link_id: linkId,
      },
      {
        headers: {
          "X-Authorization-Override": `Bearer ${authToken}`,
        },
      }
    )
  },
}
