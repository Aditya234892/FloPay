import type { AxiosInstance } from 'axios'
import { dashboardApi } from './client'
import type {
  ApiKeyCreatedResponse,
  ApiKeySummaryResponse,
  AuthResponse,
  CreateOrderRequest,
  CreatePaymentRequest,
  CreateRefundRequest,
  OrderResponse,
  PaymentResponse,
  RefundResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  WebhookConfigResponse,
  WebhookLogResponse,
} from './types'

/**
 * Every backend call in one typed place. Pages and hooks call these instead of
 * embedding URLs, so a route change is a one-line edit rather than a grep.
 */

export const authApi = {
  signup: (body: { name: string; email: string; password: string }) =>
    dashboardApi.post<AuthResponse>('/api/auth/signup', body).then((r) => r.data),

  login: (body: { email: string; password: string }) =>
    dashboardApi.post<AuthResponse>('/api/auth/login', body).then((r) => r.data),
}

export const merchantApi = {
  listKeys: () =>
    dashboardApi.get<ApiKeySummaryResponse[]>('/api/dashboard/keys').then((r) => r.data),

  createKey: () =>
    dashboardApi.post<ApiKeyCreatedResponse>('/api/dashboard/keys').then((r) => r.data),

  revokeKey: (keyId: string) =>
    dashboardApi.delete<void>(`/api/dashboard/keys/${encodeURIComponent(keyId)}`).then(() => undefined),
}

export const dashboardDataApi = {
  orders: () => dashboardApi.get<OrderResponse[]>('/api/dashboard/orders').then((r) => r.data),

  payments: () => dashboardApi.get<PaymentResponse[]>('/api/dashboard/payments').then((r) => r.data),

  refunds: () => dashboardApi.get<RefundResponse[]>('/api/dashboard/refunds').then((r) => r.data),

  refundPayment: (paymentId: string, body: CreateRefundRequest) =>
    dashboardApi
      .post<RefundResponse>(`/api/dashboard/payments/${encodeURIComponent(paymentId)}/refund`, body)
      .then((r) => r.data),
}

export const webhookApi = {
  get: () => dashboardApi.get<WebhookConfigResponse>('/api/dashboard/webhook').then((r) => r.data),

  configure: (url: string) =>
    dashboardApi.put<WebhookConfigResponse>('/api/dashboard/webhook', { url }).then((r) => r.data),

  logs: () =>
    dashboardApi.get<WebhookLogResponse[]>('/api/dashboard/webhook/logs').then((r) => r.data),
}

/**
 * Merchant-key-authenticated calls. These take the client explicitly because the
 * credentials are per-call, not ambient like the dashboard session.
 */
export const paymentsApi = {
  createOrder: (client: AxiosInstance, body: CreateOrderRequest) =>
    client.post<OrderResponse>('/api/v1/orders', body).then((r) => r.data),

  createPayment: (client: AxiosInstance, body: CreatePaymentRequest) =>
    client.post<PaymentResponse>('/api/v1/payments', body).then((r) => r.data),

  verifyPayment: (client: AxiosInstance, body: VerifyPaymentRequest) =>
    client.post<VerifyPaymentResponse>('/api/v1/payments/verify', body).then((r) => r.data),
}
