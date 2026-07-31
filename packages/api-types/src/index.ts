/**
 * Wire types for the FloPay gateway API. Shared between every client —
 * gateway-web (merchant/admin) and consumer-app (wallet) both talk to this
 * backend and must never drift on request/response shapes.
 *
 * Ledger/wallet types (Account, JournalEntry, WalletBalance, ...) land here
 * once the ledger backend exists.
 */

export type OrderStatus = 'CREATED' | 'ATTEMPTED' | 'PAID'
export type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING'
export type PaymentStatus =
  | 'CREATED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
export type WebhookEventType = 'PAYMENT_CAPTURED' | 'PAYMENT_FAILED' | 'REFUND_PROCESSED'

export type MerchantRole = 'MERCHANT' | 'ADMIN'

export interface AuthResponse {
  token: string
  refreshToken: string
  merchantId: number
  name: string
  email: string
  role: MerchantRole
  merchantVpa: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken: string
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

/* ===========================================================================
   Consumer wallet app (apps/consumer-app) — phone+OTP auth is a separate
   principal type from the merchant AuthResponse above (see backend
   PrincipalType), hence WalletAuthResponse rather than a shared name.
   =========================================================================== */

export interface OtpRequestRequest {
  phone: string
}

/**
 * sandboxOtp exists only because no SMS provider is wired up. A real
 * deployment sends this by SMS and never returns it from the API — the field
 * name says so explicitly rather than reading as normal production shape.
 */
export interface OtpRequestResponse {
  phone: string
  sandboxOtp: string
  expiresInSeconds: number
}

export interface OtpVerifyRequest {
  phone: string
  otp: string
}

export interface WalletAuthResponse {
  token: string
  refreshToken: string
  userId: number
  phone: string
  vpa: string
  displayName: string | null
  profileComplete: boolean
}

export interface VpaSuggestion {
  vpa: string
  available: boolean
}

export interface VpaAvailabilityResponse {
  available: boolean
}

export interface CompleteProfileRequest {
  displayName: string
  vpa: string
  /** Optional — redeemed once, at this same step, if present. */
  referralCode?: string
}

export interface WalletResponse {
  vpa: string
  displayName: string | null
  balanceMinor: number
  currency: string
}

export type PostingDirection = 'DEBIT' | 'CREDIT'

export interface WalletTransaction {
  entryId: string
  kind: string
  direction: PostingDirection
  amountMinor: number
  referenceId: string | null
  note: string | null
  /** The other party's VPA — null for entries with no personal counterparty (e.g. a top-up). */
  counterpartyVpa: string | null
  counterpartyName: string | null
  createdAt: string
}

export type TopUpRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface CreateTopUpRequest {
  amountMinor: number
  note?: string
}

export interface TopUpRequestResponse {
  id: string
  amountMinor: number
  note: string | null
  status: TopUpRequestStatus
  createdAt: string
  decidedAt: string | null
}

/** The admin queue additionally needs to know whose wallet this credits. */
export interface AdminTopUpRequestResponse {
  id: string
  userId: number
  userVpa: string | null
  userDisplayName: string | null
  amountMinor: number
  note: string | null
  status: TopUpRequestStatus
  createdAt: string
  decidedAt: string | null
}

export interface TransferRequest {
  toVpa: string
  amountMinor: number
  note?: string
  /** Generated once client-side and reused on retry — see backend TransferDtos for why. */
  idempotencyKey: string
}

export interface TransferResponse {
  entryId: string
  toVpa: string
  toName: string | null
  amountMinor: number
  note: string | null
  createdAt: string
}

export type PaymentRequestStatus = 'PENDING' | 'PAID' | 'DECLINED' | 'CANCELLED'

export interface CreateRequestRequest {
  fromVpa: string
  amountMinor: number
  note?: string
}

export interface CreateSplitRequest {
  totalAmountMinor: number
  /** Everyone being asked to pay, excluding the creator — the creator collects, they don't pay themselves. */
  payerVpas: string[]
  note?: string
}

export interface PaymentRequestResponse {
  id: string
  /** From the viewer's point of view: are they being asked, or did they ask? */
  incoming: boolean
  counterpartyVpa: string | null
  counterpartyName: string | null
  amountMinor: number
  note: string | null
  status: PaymentRequestStatus
  splitGroupId: string | null
  createdAt: string
}

export interface SplitSummaryResponse {
  splitGroupId: string
  totalAmountMinor: number
  note: string | null
  shares: PaymentRequestResponse[]
}

export type NotificationType =
  | 'MONEY_RECEIVED'
  | 'REQUEST_RECEIVED'
  | 'REQUEST_DECLINED'
  | 'TOPUP_APPROVED'
  | 'TOPUP_REJECTED'

export interface NotificationResponse {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface AuditLogResponse {
  id: string
  actorType: string
  actorId: number | null
  action: string
  details: string | null
  ipAddress: string | null
  createdAt: string
}

export interface PinStatusResponse {
  hasPinSet: boolean
}

export interface SetPinRequest {
  pin: string
}

export interface VerifyPinRequest {
  pin: string
}

export interface VerifyPinResponse {
  valid: boolean
}

export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface CreateScheduledTransferRequest {
  toVpa: string
  amountMinor: number
  note?: string
  frequency: ScheduleFrequency | null
  firstRunAt: string
}

export interface ScheduledTransferResponse {
  id: string
  toVpa: string
  amountMinor: number
  note: string | null
  frequency: ScheduleFrequency | null
  nextRunAt: string
  lastRunAt: string | null
  active: boolean
  lastError: string | null
}

export type PaymentLinkStatus = 'ACTIVE' | 'DISABLED'

export interface CreatePaymentLinkRequest {
  /** Omit for an open-amount link — the payer decides how much to send. */
  amountMinor?: number
  note?: string
}

export interface PaymentLinkResponse {
  id: string
  code: string
  amountMinor: number | null
  note: string | null
  status: PaymentLinkStatus
  createdAt: string
}

export interface PaymentLinkPreviewResponse {
  code: string
  creatorVpa: string
  creatorDisplayName: string | null
  amountMinor: number | null
  note: string | null
  active: boolean
}

export interface PayViaLinkRequest {
  /** Required only when the link itself has no fixed amount. */
  amountMinor?: number
  idempotencyKey: string
}

export interface FavoriteContactResponse {
  vpa: string
  displayName: string | null
}

export interface RewardsResponse {
  balanceMinor: number
  currency: string
}

export interface RewardHistoryEntry {
  amountMinor: number
  note: string | null
  createdAt: string
}

export interface ReferralSummaryResponse {
  referralCode: string
  totalReferred: number
  rewardedCount: number
  bonusMinorPerReferral: number
}

export interface StreakStatusResponse {
  currentStreak: number
  longestStreak: number
  checkedInToday: boolean
  nextBonusMinor: number
}

export interface CheckInResponse {
  currentStreak: number
  longestStreak: number
  bonusMinor: number
}

export interface BadgeResponse {
  type: string
  title: string
  description: string
  earned: boolean
  earnedAt: string | null
}

/* ===========================================================================
   Admin panel (gateway-web, ADMIN role only)
   =========================================================================== */

export interface AdminUserResponse {
  id: number
  phone: string
  vpa: string
  displayName: string | null
  profileComplete: boolean
  frozen: boolean
  walletBalanceMinor: number
  createdAt: string
}

export interface AdminMerchantResponse {
  id: number
  name: string
  email: string
  role: MerchantRole
  activeApiKeyCount: number
  createdAt: string
}

export interface WalletHealthResponse {
  totalWalletMinor: number
  totalSettlementPendingMinor: number
  totalSettledMinor: number
  totalIssuanceMinor: number
  totalFeesMinor: number
  totalRewardsMinor: number
  netMinor: number
  reconciles: boolean
  userCount: number
  frozenUserCount: number
}

export interface FraudSignalResponse {
  userId: number
  vpa: string | null
  displayName: string | null
  frozen: boolean
  transferCount: number
  totalMinor: number
}

export type SupportTicketStatus = 'OPEN' | 'RESOLVED'

export interface CreateTicketRequest {
  subject: string
  message: string
}

export interface ResolveTicketRequest {
  response: string
}

export interface TicketResponse {
  id: string
  subject: string
  message: string
  status: SupportTicketStatus
  adminResponse: string | null
  createdAt: string
  resolvedAt: string | null
}

export interface AdminTicketResponse {
  id: string
  requesterType: 'MERCHANT' | 'USER'
  requesterId: number
  requesterLabel: string | null
  subject: string
  message: string
  status: SupportTicketStatus
  adminResponse: string | null
  createdAt: string
  resolvedAt: string | null
}

/* ===========================================================================
   Wallet-to-merchant payments (consumer app pays a merchant's FloPay VPA)
   =========================================================================== */

export interface PayMerchantRequest {
  merchantVpa: string
  amountMinor: number
  note?: string
  idempotencyKey: string
}

export interface MerchantPaymentResponse {
  entryId: string
  merchantName: string
  amountMinor: number
  note: string | null
  createdAt: string
}

export interface MerchantWalletPaymentResponse {
  id: string
  payerVpa: string
  payerDisplayName: string | null
  amountMinor: number
  note: string | null
  createdAt: string
}

export interface MerchantWalletSummaryResponse {
  pendingMinor: number
  settledMinor: number
  totalReceivedMinor: number
  paymentCount: number
}

export function isRefundable(payment: PaymentWithRefunds): boolean {
  return (
    (payment.status === 'CAPTURED' || payment.status === 'PARTIALLY_REFUNDED') &&
    payment.refundableAmount > 0
  )
}
