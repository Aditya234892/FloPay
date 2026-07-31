import { walletApi } from './client'
import type {
  BadgeResponse,
  CheckInResponse,
  CompleteProfileRequest,
  CreatePaymentLinkRequest,
  CreateRequestRequest,
  CreateSplitRequest,
  CreateScheduledTransferRequest,
  CreateTicketRequest,
  CreateTopUpRequest,
  FavoriteContactResponse,
  MerchantPaymentResponse,
  NotificationResponse,
  OtpRequestResponse,
  PayMerchantRequest,
  PayViaLinkRequest,
  PaymentLinkPreviewResponse,
  PaymentLinkResponse,
  PaymentRequestResponse,
  PinStatusResponse,
  ReferralSummaryResponse,
  RewardHistoryEntry,
  RewardsResponse,
  ScheduledTransferResponse,
  SplitSummaryResponse,
  StreakStatusResponse,
  TicketResponse,
  TopUpRequestResponse,
  TransferRequest,
  TransferResponse,
  VpaAvailabilityResponse,
  VpaSuggestion,
  WalletAuthResponse,
  WalletResponse,
  WalletTransaction,
} from '@flopay/api-types'

export interface WebAuthnStatusResponse {
  enabled: boolean
}

export const webauthnApi = {
  status: () => walletApi.get<WebAuthnStatusResponse>('/api/wallet/webauthn/status').then((r) => r.data),

  remove: () => walletApi.delete<void>('/api/wallet/webauthn/credential').then((r) => r.data),

  registerStart: () => walletApi.post<unknown>('/api/wallet/webauthn/register/start').then((r) => r.data),

  registerFinish: (credential: unknown) =>
    walletApi.post<void>('/api/wallet/webauthn/register/finish', credential).then((r) => r.data),

  loginStart: (phone: string) =>
    walletApi.post<unknown>('/api/wallet/webauthn/login/start', { phone }).then((r) => r.data),

  loginFinish: (phone: string, credential: unknown) =>
    walletApi
      .post<WalletAuthResponse>('/api/wallet/webauthn/login/finish', { phone, credential })
      .then((r) => r.data),
}

export const consumerAuthApi = {
  requestOtp: (phone: string) =>
    walletApi.post<OtpRequestResponse>('/api/wallet/auth/otp/request', { phone }).then((r) => r.data),

  verifyOtp: (phone: string, otp: string) =>
    walletApi.post<WalletAuthResponse>('/api/wallet/auth/otp/verify', { phone, otp }).then((r) => r.data),

  logout: (refreshToken: string) =>
    walletApi.post<void>('/api/wallet/auth/logout', { refreshToken }).then((r) => r.data),

  vpaSuggestions: (displayName: string) =>
    walletApi
      .get<VpaSuggestion[]>('/api/wallet/auth/vpa-suggestions', { params: { displayName } })
      .then((r) => r.data),

  vpaAvailability: (vpa: string) =>
    walletApi
      .get<VpaAvailabilityResponse>('/api/wallet/auth/vpa-availability', { params: { vpa } })
      .then((r) => r.data.available),

  completeProfile: (request: CompleteProfileRequest) =>
    walletApi.post<WalletAuthResponse>('/api/wallet/auth/complete-profile', request).then((r) => r.data),
}

export const walletDataApi = {
  getWallet: () => walletApi.get<WalletResponse>('/api/wallet').then((r) => r.data),

  getTransactions: () =>
    walletApi.get<WalletTransaction[]>('/api/wallet/transactions').then((r) => r.data),
}

export const topUpRequestApi = {
  create: (request: CreateTopUpRequest) =>
    walletApi.post<TopUpRequestResponse>('/api/wallet/topup-requests', request).then((r) => r.data),

  history: () =>
    walletApi.get<TopUpRequestResponse[]>('/api/wallet/topup-requests').then((r) => r.data),
}

export const favoritesApi = {
  list: () => walletApi.get<FavoriteContactResponse[]>('/api/wallet/favorites').then((r) => r.data),

  add: (vpa: string) => walletApi.post<void>('/api/wallet/favorites', { vpa }).then((r) => r.data),

  remove: (vpa: string) =>
    walletApi.delete<void>(`/api/wallet/favorites/${encodeURIComponent(vpa)}`).then((r) => r.data),
}

export const rewardsApi = {
  balance: () => walletApi.get<RewardsResponse>('/api/wallet/rewards').then((r) => r.data),

  history: () =>
    walletApi.get<RewardHistoryEntry[]>('/api/wallet/rewards/history').then((r) => r.data),
}

export const referralApi = {
  summary: () => walletApi.get<ReferralSummaryResponse>('/api/wallet/rewards/referral').then((r) => r.data),
}

export const streakApi = {
  status: () => walletApi.get<StreakStatusResponse>('/api/wallet/rewards/streak').then((r) => r.data),

  checkIn: () =>
    walletApi.post<CheckInResponse>('/api/wallet/rewards/streak/check-in').then((r) => r.data),
}

export const badgesApi = {
  list: () => walletApi.get<BadgeResponse[]>('/api/wallet/rewards/badges').then((r) => r.data),
}

export const pinApi = {
  status: () => walletApi.get<PinStatusResponse>('/api/wallet/security/pin/status').then((r) => r.data),

  set: (pin: string) => walletApi.post<void>('/api/wallet/security/pin', { pin }).then((r) => r.data),

  verify: (pin: string) =>
    walletApi
      .post<{ valid: boolean }>('/api/wallet/security/pin/verify', { pin })
      .then((r) => r.data.valid),
}

export const notificationApi = {
  list: () => walletApi.get<NotificationResponse[]>('/api/wallet/notifications').then((r) => r.data),

  unreadCount: () =>
    walletApi
      .get<{ count: number }>('/api/wallet/notifications/unread-count')
      .then((r) => r.data.count),

  markRead: () => walletApi.post<void>('/api/wallet/notifications/mark-read').then((r) => r.data),
}

export const transferApi = {
  /**
   * The idempotency key is generated by the caller (see SendMoneyScreen), not
   * here — it must stay stable across a retry of the *same* user intent, and a
   * key minted inside this function would be new on every call, defeating the
   * point.
   */
  send: (request: TransferRequest) =>
    walletApi.post<TransferResponse>('/api/wallet/transfers', request).then((r) => r.data),
}

export const merchantPaymentApi = {
  pay: (request: PayMerchantRequest) =>
    walletApi.post<MerchantPaymentResponse>('/api/wallet/merchant-payments', request).then((r) => r.data),
}

export const requestApi = {
  create: (request: CreateRequestRequest) =>
    walletApi.post<PaymentRequestResponse>('/api/wallet/requests', request).then((r) => r.data),

  createSplit: (request: CreateSplitRequest) =>
    walletApi.post<SplitSummaryResponse>('/api/wallet/requests/split', request).then((r) => r.data),

  listIncoming: () =>
    walletApi.get<PaymentRequestResponse[]>('/api/wallet/requests/incoming').then((r) => r.data),

  listOutgoing: () =>
    walletApi.get<PaymentRequestResponse[]>('/api/wallet/requests/outgoing').then((r) => r.data),

  incomingPendingCount: () =>
    walletApi
      .get<{ count: number }>('/api/wallet/requests/incoming/pending-count')
      .then((r) => r.data.count),

  approve: (requestId: string) =>
    walletApi
      .post<PaymentRequestResponse>(`/api/wallet/requests/${requestId}/approve`)
      .then((r) => r.data),

  decline: (requestId: string) =>
    walletApi
      .post<PaymentRequestResponse>(`/api/wallet/requests/${requestId}/decline`)
      .then((r) => r.data),

  cancel: (requestId: string) =>
    walletApi
      .post<PaymentRequestResponse>(`/api/wallet/requests/${requestId}/cancel`)
      .then((r) => r.data),
}

export const paymentLinksApi = {
  create: (request: CreatePaymentLinkRequest) =>
    walletApi.post<PaymentLinkResponse>('/api/wallet/payment-links', request).then((r) => r.data),

  list: () => walletApi.get<PaymentLinkResponse[]>('/api/wallet/payment-links').then((r) => r.data),

  disable: (id: string) => walletApi.delete<void>(`/api/wallet/payment-links/${id}`).then((r) => r.data),

  preview: (code: string) =>
    walletApi.get<PaymentLinkPreviewResponse>(`/api/wallet/payment-links/${code}/preview`).then((r) => r.data),

  pay: (code: string, request: PayViaLinkRequest) =>
    walletApi.post<TransferResponse>(`/api/wallet/payment-links/${code}/pay`, request).then((r) => r.data),
}

export const supportApi = {
  create: (request: CreateTicketRequest) =>
    walletApi.post<TicketResponse>('/api/wallet/support/tickets', request).then((r) => r.data),

  list: () => walletApi.get<TicketResponse[]>('/api/wallet/support/tickets').then((r) => r.data),
}

export const scheduledTransfersApi = {
  create: (request: CreateScheduledTransferRequest) =>
    walletApi
      .post<ScheduledTransferResponse>('/api/wallet/scheduled-transfers', request)
      .then((r) => r.data),

  list: () =>
    walletApi.get<ScheduledTransferResponse[]>('/api/wallet/scheduled-transfers').then((r) => r.data),

  cancel: (id: string) =>
    walletApi.delete<void>(`/api/wallet/scheduled-transfers/${id}`).then((r) => r.data),
}
