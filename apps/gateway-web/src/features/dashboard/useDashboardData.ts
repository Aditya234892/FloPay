import { useMemo } from 'react'
import { dashboardDataApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import {
  isSuccessfulPayment,
  type OrderResponse,
  type PaymentMethod,
  type PaymentResponse,
  type PaymentWithRefunds,
  type RefundResponse,
} from '@/api/types'

interface RawDashboardData {
  orders: OrderResponse[]
  payments: PaymentResponse[]
  refunds: RefundResponse[]
}

const EMPTY_ORDERS: readonly OrderResponse[] = Object.freeze([])
const EMPTY_PAYMENTS: readonly PaymentResponse[] = Object.freeze([])
const EMPTY_REFUNDS: readonly RefundResponse[] = Object.freeze([])

export interface MethodBreakdown {
  method: PaymentMethod
  count: number
  volume: number
  successRate: number
}

export interface RevenuePoint {
  /** ISO date (yyyy-mm-dd), used as the axis key. */
  date: string
  label: string
  captured: number
  refunded: number
  count: number
}

export interface DashboardMetrics {
  totalPayments: number
  capturedCount: number
  failedCount: number
  capturedVolume: number
  refundedVolume: number
  netVolume: number
  todayVolume: number
  monthVolume: number
  successRate: number
  refundRate: number
  averageOrderValue: number
  settlementBalance: number
  currency: string
}

/** Join refunds onto their payments once, so no component recomputes it. */
function joinRefunds(
  payments: readonly PaymentResponse[],
  refunds: readonly RefundResponse[],
): PaymentWithRefunds[] {
  const byPayment = new Map<string, RefundResponse[]>()
  for (const refund of refunds) {
    const list = byPayment.get(refund.paymentId)
    if (list) list.push(refund)
    else byPayment.set(refund.paymentId, [refund])
  }

  return payments.map((payment) => {
    const paymentRefunds = byPayment.get(payment.id) ?? []
    const refundedAmount = paymentRefunds.reduce((sum, r) => sum + r.amount, 0)
    return {
      ...payment,
      refunds: paymentRefunds,
      refundedAmount,
      refundableAmount: Math.max(payment.amount - refundedAmount, 0),
    }
  })
}

function computeMetrics(
  payments: readonly PaymentWithRefunds[],
  orders: readonly OrderResponse[],
): DashboardMetrics {
  const successful = payments.filter((p) => isSuccessfulPayment(p.status))
  const failed = payments.filter((p) => p.status === 'FAILED')

  const capturedVolume = successful.reduce((sum, p) => sum + p.amount, 0)
  const refundedVolume = payments.reduce((sum, p) => sum + p.refundedAmount, 0)

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  const volumeSince = (since: number) =>
    successful
      .filter((p) => new Date(p.createdAt).getTime() >= since)
      .reduce((sum, p) => sum + p.amount, 0)

  // Settlement balance models the T+2 hold real gateways apply: captured funds
  // net of refunds, excluding anything captured in the last 48 hours.
  const settlementCutoff = now.getTime() - 48 * 60 * 60 * 1000
  const settled = successful
    .filter((p) => new Date(p.createdAt).getTime() < settlementCutoff)
    .reduce((sum, p) => sum + p.amount - p.refundedAmount, 0)

  return {
    totalPayments: payments.length,
    capturedCount: successful.length,
    failedCount: failed.length,
    capturedVolume,
    refundedVolume,
    netVolume: capturedVolume - refundedVolume,
    todayVolume: volumeSince(startOfToday),
    monthVolume: volumeSince(startOfMonth),
    successRate: payments.length ? (successful.length / payments.length) * 100 : 0,
    refundRate: capturedVolume ? (refundedVolume / capturedVolume) * 100 : 0,
    averageOrderValue: successful.length ? capturedVolume / successful.length : 0,
    settlementBalance: Math.max(settled, 0),
    currency: orders[0]?.currency ?? 'INR',
  }
}

function computeMethodBreakdown(payments: readonly PaymentWithRefunds[]): MethodBreakdown[] {
  const methods: PaymentMethod[] = ['CARD', 'UPI', 'NETBANKING']
  return methods
    .map((method) => {
      const forMethod = payments.filter((p) => p.method === method)
      const succeeded = forMethod.filter((p) => isSuccessfulPayment(p.status))
      return {
        method,
        count: forMethod.length,
        volume: succeeded.reduce((sum, p) => sum + p.amount, 0),
        successRate: forMethod.length ? (succeeded.length / forMethod.length) * 100 : 0,
      }
    })
    .filter((entry) => entry.count > 0)
}

/** Bucket payments into a contiguous daily series so the chart has no gaps. */
function computeRevenueSeries(payments: readonly PaymentWithRefunds[], days = 14): RevenuePoint[] {
  const buckets = new Map<string, RevenuePoint>()
  const today = new Date()

  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    const key = day.toISOString().slice(0, 10)
    buckets.set(key, {
      date: key,
      label: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(day),
      captured: 0,
      refunded: 0,
      count: 0,
    })
  }

  for (const payment of payments) {
    const key = new Date(payment.createdAt).toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    if (isSuccessfulPayment(payment.status)) {
      bucket.captured += payment.amount
      bucket.count += 1
    }
    bucket.refunded += payment.refundedAmount
  }

  return [...buckets.values()]
}

export interface DashboardData {
  orders: readonly OrderResponse[]
  payments: readonly PaymentWithRefunds[]
  refunds: readonly RefundResponse[]
  metrics: DashboardMetrics
  methodBreakdown: MethodBreakdown[]
  revenueSeries: RevenuePoint[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Single source of truth for every dashboard surface. Fetches the three read
 * models in parallel and derives everything else with memoised selectors.
 */
export function useDashboardData(): DashboardData {
  const resource = useAsyncResource<RawDashboardData>(async () => {
    const [orders, payments, refunds] = await Promise.all([
      dashboardDataApi.orders(),
      dashboardDataApi.payments(),
      dashboardDataApi.refunds(),
    ])
    return { orders, payments, refunds }
  }, [])

  // Frozen module-level fallbacks: `?? []` would allocate a new array on every
  // render, changing the identity the memos below depend on and recomputing
  // every derived value each time.
  const orders = resource.data?.orders ?? EMPTY_ORDERS
  const rawPayments = resource.data?.payments ?? EMPTY_PAYMENTS
  const refunds = resource.data?.refunds ?? EMPTY_REFUNDS

  const payments = useMemo(() => joinRefunds(rawPayments, refunds), [rawPayments, refunds])
  const metrics = useMemo(() => computeMetrics(payments, orders), [payments, orders])
  const methodBreakdown = useMemo(() => computeMethodBreakdown(payments), [payments])
  const revenueSeries = useMemo(() => computeRevenueSeries(payments), [payments])

  return {
    orders,
    payments,
    refunds,
    metrics,
    methodBreakdown,
    revenueSeries,
    loading: resource.loading,
    error: resource.error,
    refetch: resource.refetch,
  }
}
