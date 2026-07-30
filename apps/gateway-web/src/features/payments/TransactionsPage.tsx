import { useMemo, useState } from 'react'
import { ArrowLeftRight, Download, RefreshCw, Search, Undo2 } from 'lucide-react'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Input,
  Select,
  StatusBadge,
  Tabs,
  useToast,
  type Column,
} from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { downloadCsv } from '@/lib/csv'
import { formatDateTime, formatMoney, formatRelative } from '@/lib/format'
import { isRefundable, type OrderResponse, type PaymentWithRefunds } from '@/api/types'
import { dashboardDataApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useDashboardData } from '../dashboard/useDashboardData'
import { RefundModal } from './RefundModal'

type TabKey = 'payments' | 'orders'
type StatusFilter = 'all' | 'captured' | 'failed' | 'refunded'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'captured', label: 'Captured' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

function matchesStatus(payment: PaymentWithRefunds, filter: StatusFilter): boolean {
  switch (filter) {
    case 'captured':
      return payment.status === 'CAPTURED'
    case 'failed':
      return payment.status === 'FAILED'
    case 'refunded':
      return payment.status === 'REFUNDED' || payment.status === 'PARTIALLY_REFUNDED'
    default:
      return true
  }
}

export function TransactionsPage() {
  const { orders, payments, metrics, loading, error, refetch } = useDashboardData()
  const toast = useToast()

  const [tab, setTab] = useState<TabKey>('payments')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [method, setMethod] = useState<'all' | 'CARD' | 'UPI' | 'NETBANKING'>('all')
  const [refundTarget, setRefundTarget] = useState<PaymentWithRefunds | null>(null)

  const { currency } = metrics

  const filteredPayments = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return payments.filter((payment) => {
      if (!matchesStatus(payment, status)) return false
      if (method !== 'all' && payment.method !== method) return false
      if (!needle) return true
      return (
        payment.id.toLowerCase().includes(needle) ||
        payment.orderId.toLowerCase().includes(needle)
      )
    })
  }, [payments, query, status, method])

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return orders
    return orders.filter(
      (order) =>
        order.id.toLowerCase().includes(needle) ||
        (order.receipt ?? '').toLowerCase().includes(needle),
    )
  }, [orders, query])

  const handleRefund = async (paymentId: string, amountMinor: number | null) => {
    try {
      await dashboardDataApi.refundPayment(paymentId, { amount: amountMinor })
    } catch (caught) {
      throw new Error(extractErrorMessage(caught))
    }
    toast.success(
      'Refund processed',
      amountMinor === null
        ? 'The full remaining balance was refunded.'
        : `${formatMoney(amountMinor, currency)} was refunded.`,
    )
    await refetch()
  }

  const exportPayments = () => {
    downloadCsv(`flopay-payments-${new Date().toISOString().slice(0, 10)}`, filteredPayments, [
      { header: 'Payment ID', value: (p) => p.id },
      { header: 'Order ID', value: (p) => p.orderId },
      { header: 'Method', value: (p) => p.method },
      { header: 'Status', value: (p) => p.status },
      { header: `Amount (${currency})`, value: (p) => (p.amount / 100).toFixed(2) },
      { header: `Refunded (${currency})`, value: (p) => (p.refundedAmount / 100).toFixed(2) },
      { header: 'Failure reason', value: (p) => p.failureReason ?? '' },
      { header: 'Created at', value: (p) => p.createdAt },
    ])
    toast.success('Export ready', `${filteredPayments.length} rows written to CSV.`)
  }

  const paymentColumns: Column<PaymentWithRefunds>[] = [
    {
      id: 'id',
      header: 'Payment',
      sortValue: (row) => row.id,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-medium text-fg">{row.id}</p>
          <p className="truncate font-mono text-[0.6875rem] text-fg-subtle">{row.orderId}</p>
        </div>
      ),
    },
    {
      id: 'method',
      header: 'Method',
      hideOnMobile: true,
      sortValue: (row) => row.method,
      cell: (row) => (
        <Badge tone="neutral">{row.method === 'NETBANKING' ? 'Netbanking' : row.method}</Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: (row) => row.amount,
      cell: (row) => (
        <div>
          <p className="text-sm font-semibold tabular-nums">{formatMoney(row.amount, currency)}</p>
          {row.refundedAmount > 0 && (
            <p className="text-[0.6875rem] text-violet-500 tabular-nums">
              −{formatMoney(row.refundedAmount, currency)} refunded
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.failureReason && (
            <p className="mt-1 max-w-[14rem] truncate text-[0.6875rem] text-fg-subtle">
              {row.failureReason}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      hideOnMobile: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => (
        <div>
          <p className="text-xs text-fg">{formatRelative(row.createdAt)}</p>
          <p className="text-[0.6875rem] text-fg-subtle">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) =>
        isRefundable(row) ? (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Undo2 className="h-3.5 w-3.5" />}
            onClick={() => setRefundTarget(row)}
          >
            Refund
          </Button>
        ) : null,
    },
  ]

  const orderColumns: Column<OrderResponse>[] = [
    {
      id: 'id',
      header: 'Order',
      sortValue: (row) => row.id,
      cell: (row) => <span className="font-mono text-xs font-medium">{row.id}</span>,
    },
    {
      id: 'receipt',
      header: 'Receipt',
      hideOnMobile: true,
      sortValue: (row) => row.receipt ?? '',
      cell: (row) => (
        <span className="font-mono text-[0.6875rem] text-fg-muted">{row.receipt ?? '—'}</span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: (row) => row.amount,
      cell: (row) => (
        <span className="text-sm font-semibold tabular-nums">
          {formatMoney(row.amount, row.currency)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'createdAt',
      header: 'Created',
      hideOnMobile: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => <span className="text-xs text-fg-muted">{formatDateTime(row.createdAt)}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every order and payment attempt on this account, with refunds issued in place."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refetch()}
              loading={loading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportPayments}
              disabled={filteredPayments.length === 0}
              leftIcon={<Download className="h-3.5 w-3.5" />}
            >
              Export CSV
            </Button>
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-500/25 ring-inset dark:text-rose-400"
        >
          {error}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'payments', label: 'Payments', count: filteredPayments.length },
            { value: 'orders', label: 'Orders', count: filteredOrders.length },
          ]}
        />

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by payment, order or receipt…"
            leftIcon={<Search />}
            aria-label="Search transactions"
            className="sm:max-w-xs"
          />
          {tab === 'payments' && (
            <>
              <Select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="sm:w-[10.5rem]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Select
                value={method}
                onChange={(event) => setMethod(event.target.value as typeof method)}
                aria-label="Filter by method"
                className="sm:w-[9.5rem]"
              >
                <option value="all">All methods</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="NETBANKING">Netbanking</option>
              </Select>
            </>
          )}
        </div>
      </div>

      {tab === 'payments' ? (
        <DataTable
          rows={filteredPayments}
          columns={paymentColumns}
          rowKey={(row) => row.id}
          loading={loading}
          defaultSort={{ id: 'createdAt', direction: 'desc' }}
          empty={
            <EmptyState
              inline
              icon={<ArrowLeftRight />}
              title={payments.length === 0 ? 'No payments yet' : 'No payments match those filters'}
              description={
                payments.length === 0
                  ? 'Run a checkout in the demo storefront to create your first payment.'
                  : 'Try clearing the search or widening the status filter.'
              }
            />
          }
        />
      ) : (
        <DataTable
          rows={filteredOrders}
          columns={orderColumns}
          rowKey={(row) => row.id}
          loading={loading}
          defaultSort={{ id: 'createdAt', direction: 'desc' }}
          empty={
            <EmptyState
              inline
              icon={<ArrowLeftRight />}
              title="No orders yet"
              description="Orders are created by your server before checkout opens."
            />
          }
        />
      )}

      <RefundModal
        payment={refundTarget}
        currency={currency}
        onClose={() => setRefundTarget(null)}
        onConfirm={handleRefund}
      />
    </>
  )
}
