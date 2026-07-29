/** Wire types for the FloPay API. Mirrors the backend DTOs exactly. */

export type OrderStatus = 'CREATED' | 'ATTEMPTED' | 'PAID'
export type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING'
export type PaymentStatus =
  | 'CREATED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
export type WebhookEventType = 'PAYMENT_CAPTURED' | 'PAYMENT_FAILED' | 'REFUND_PROCESSED'

export interface AuthResponse {
  token: string
  merchantId: number
  name: string
  email: string
}

export interface OrderResponse {
  id: string
  amount: number
  currency: string
  receipt: string | null
  status: OrderStatus
  createdAt: string
}

export interface PaymentResponse {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  signature: string | null
  failureReason: string | null
  createdAt: string
}

export interface RefundResponse {
  id: string
  paymentId: string
  amount: number
  status: 'PROCESSED'
  createdAt: string
}

export interface ApiKeyCreatedResponse {
  keyId: string
  keySecret: string
  active: boolean
  createdAt: string
}

export interface ApiKeySummaryResponse {
  keyId: string
  active: boolean
  createdAt: string
}

export interface WebhookConfigResponse {
  url: string | null
  secret: string | null
}

export interface WebhookLogResponse {
  id: number
  eventType: WebhookEventType
  delivered: boolean
  attempts: number
  lastResponseStatus: number | null
  createdAt: string
}

export interface VerifyPaymentResponse {
  valid: boolean
}

export interface ApiErrorBody {
  error: { code: string; description: string }
}

/* ---- request payloads --------------------------------------------------- */

export interface CreateOrderRequest {
  amount: number
  currency: string
  receipt?: string
}

export interface CreatePaymentRequest {
  orderId: string
  method: PaymentMethod
  instrument: string
}

export interface VerifyPaymentRequest {
  orderId: string
  paymentId: string
  signature: string | null
}

export interface CreateRefundRequest {
  /** null issues a full refund of the remaining balance. */
  amount: number | null
}

/* ---- derived view models ------------------------------------------------ */

/** A payment joined with its refunds — what the transactions table actually needs. */
export interface PaymentWithRefunds extends PaymentResponse {
  refundedAmount: number
  refundableAmount: number
  refunds: RefundResponse[]
}

export const TERMINAL_PAYMENT_STATUSES: readonly PaymentStatus[] = ['FAILED']

export function isSuccessfulPayment(status: PaymentStatus): boolean {
  return status === 'CAPTURED' || status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED'
}

export function isRefundable(payment: PaymentWithRefunds): boolean {
  return (
    (payment.status === 'CAPTURED' || payment.status === 'PARTIALLY_REFUNDED') &&
    payment.refundableAmount > 0
  )
}
