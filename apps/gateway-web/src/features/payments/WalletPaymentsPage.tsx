import { Banknote, Landmark, QrCode, RefreshCw, Wallet } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, CopyField, DataTable, EmptyState, StatCard, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMoney, formatDateTime } from '@/lib/format'
import { walletPaymentsApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { useAuth } from '@/features/auth/AuthContext'
import type { MerchantWalletPaymentResponse } from '@/api/types'

export function WalletPaymentsPage() {
  const { merchant } = useAuth()
  const summary = useAsyncResource(walletPaymentsApi.summary, [])
  const payments = useAsyncResource(walletPaymentsApi.list, [])

  const rows = payments.data ?? []
  const loading = summary.loading || payments.loading

  const refetchAll = () => {
    void summary.refetch()
    void payments.refetch()
  }

  const columns: Column<MerchantWalletPaymentResponse>[] = [
    {
      id: 'payer',
      header: 'From',
      sortValue: (row) => row.payerDisplayName ?? row.payerVpa,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{row.payerDisplayName ?? 'Unnamed'}</p>
          <p className="truncate font-mono text-[0.6875rem] text-fg-subtle">{row.payerVpa}</p>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: (row) => row.amountMinor,
      cell: (row) => <span className="text-sm font-semibold tabular-nums">{formatMoney(row.amountMinor)}</span>,
    },
    {
      id: 'note',
      header: 'Note',
      hideOnMobile: true,
      sortValue: (row) => row.note ?? '',
      cell: (row) => <span className="text-sm text-fg-muted">{row.note ?? '—'}</span>,
    },
    {
      id: 'createdAt',
      header: 'When',
      hideOnMobile: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => <span className="text-xs text-fg-muted">{formatDateTime(row.createdAt)}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Wallet payments"
        description="Payments accepted directly from FloPay wallet users, settled through the internal ledger."
        actions={
          <Button variant="secondary" size="sm" onClick={refetchAll} loading={loading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        }
      />

      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <QrCode className="h-4 w-4" />
            Accept payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-fg-muted">
            Share your FloPay business VPA — any wallet user can pay it directly from the consumer app's Send Money screen.
          </p>
          <CopyField label="Your FloPay business VPA" value={merchant?.merchantVpa ?? ''} />
        </CardContent>
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending settlement"
          value={summary.data?.pendingMinor ?? 0}
          format={(v) => formatMoney(v)}
          icon={<Wallet />}
          caption="Held before the next settlement run"
        />
        <StatCard
          label="Settled"
          value={summary.data?.settledMinor ?? 0}
          format={(v) => formatMoney(v)}
          icon={<Landmark />}
          caption="Available balance"
        />
        <StatCard
          label="Total received"
          value={summary.data?.totalReceivedMinor ?? 0}
          format={(v) => formatMoney(v)}
          icon={<Banknote />}
          caption={`${summary.data?.paymentCount ?? 0} payments all-time`}
        />
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        loading={payments.loading}
        defaultSort={{ id: 'createdAt', direction: 'desc' }}
        empty={
          <EmptyState
            inline
            icon={<Wallet />}
            title="No wallet payments yet"
            description="Share your business VPA above to start accepting payments."
          />
        }
      />
    </>
  )
}
