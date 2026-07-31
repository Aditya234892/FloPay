import type { AxiosInstance } from 'axios'
import { dashboardApi } from './client'
import type {
  AdminMerchantResponse,
  AdminTicketResponse,
  AdminTopUpRequestResponse,
  AdminUserResponse,
  ApiKeyCreatedResponse,
  ApiKeySummaryResponse,
  AuditLogResponse,
  AuthResponse,
  CreateOrderRequest,
  CreatePaymentRequest,
  CreateRefundRequest,
  FraudSignalResponse,
  MerchantWalletPaymentResponse,
  MerchantWalletSummaryResponse,
  OrderResponse,
  PaymentResponse,
  RefundResponse,
  ResolveTicketRequest,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  WalletHealthResponse,
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

  logout: (refreshToken: string) =>
    dashboardApi.post<void>('/api/auth/logout', { refreshToken }).then((r) => r.data),
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

/** Every method here requires the ADMIN role — the backend rejects a merchant token with 403. */
export const adminApi = {
  pendingTopUpRequests: () =>
    dashboardApi
      .get<AdminTopUpRequestResponse[]>('/api/dashboard/admin/topup-requests')
      .then((r) => r.data),

  approveTopUpRequest: (requestId: string) =>
    dashboardApi
      .post<AdminTopUpRequestResponse>(`/api/dashboard/admin/topup-requests/${requestId}/approve`)
      .then((r) => r.data),

  rejectTopUpRequest: (requestId: string) =>
    dashboardApi
      .post<AdminTopUpRequestResponse>(`/api/dashboard/admin/topup-requests/${requestId}/reject`)
      .then((r) => r.data),

  auditLogs: () =>
    dashboardApi.get<AuditLogResponse[]>('/api/dashboard/admin/audit-logs').then((r) => r.data),

  users: (q?: string) =>
    dashboardApi
      .get<AdminUserResponse[]>('/api/dashboard/admin/users', { params: q ? { q } : undefined })
      .then((r) => r.data),

  freezeUser: (userId: number) =>
    dashboardApi.post<AdminUserResponse>(`/api/dashboard/admin/users/${userId}/freeze`).then((r) => r.data),

  unfreezeUser: (userId: number) =>
    dashboardApi.post<AdminUserResponse>(`/api/dashboard/admin/users/${userId}/unfreeze`).then((r) => r.data),

  merchants: (q?: string) =>
    dashboardApi
      .get<AdminMerchantResponse[]>('/api/dashboard/admin/merchants', { params: q ? { q } : undefined })
      .then((r) => r.data),

  walletHealth: () =>
    dashboardApi.get<WalletHealthResponse>('/api/dashboard/admin/wallet-health').then((r) => r.data),

  fraudSignals: () =>
    dashboardApi.get<FraudSignalResponse[]>('/api/dashboard/admin/fraud-signals').then((r) => r.data),

  supportTickets: () =>
    dashboardApi.get<AdminTicketResponse[]>('/api/dashboard/admin/support-tickets').then((r) => r.data),

  resolveTicket: (ticketId: string, body: ResolveTicketRequest) =>
    dashboardApi
      .post<AdminTicketResponse>(`/api/dashboard/admin/support-tickets/${ticketId}/resolve`, body)
      .then((r) => r.data),
}

export const walletPaymentsApi = {
  list: () =>
    dashboardApi.get<MerchantWalletPaymentResponse[]>('/api/dashboard/wallet-payments').then((r) => r.data),

  summary: () =>
    dashboardApi.get<MerchantWalletSummaryResponse>('/api/dashboard/wallet-payments/summary').then((r) => r.data),
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
