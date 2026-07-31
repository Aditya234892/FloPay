import { useState } from 'react'
import { Lock, RefreshCw, ShieldAlert, Unlock } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, useToast, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMoney } from '@/lib/format'
import { extractErrorMessage } from '@/api/client'
import { adminApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import type { FraudSignalResponse } from '@/api/types'

export function AdminFraudSignalsPage() {
  const { data, loading, error, refetch, mutate } = useAsyncResource(adminApi.fraudSignals, [])
  const toast = useToast()
  const [actingOn, setActingOn] = useState<number | null>(null)

  const rows = data ?? []

  const toggleFrozen = async (row: FraudSignalResponse) => {
    setActingOn(row.userId)
    try {
      const updated = row.frozen ? await adminApi.unfreezeUser(row.userId) : await adminApi.freezeUser(row.userId)
      mutate((current) => current?.map((s) => (s.userId === updated.id ? { ...s, frozen: updated.frozen } : s)) ?? current)
      toast.success(updated.frozen ? 'Account frozen' : 'Account unfrozen', updated.vpa)
    } catch (caught) {
      toast.error('Something went wrong', extractErrorMessage(caught))
    } finally {
      setActingOn(null)
    }
  }

  const columns: Column<FraudSignalResponse>[] = [
    {
      id: 'user',
      header: 'User',
      sortValue: (row) => row.displayName ?? row.vpa ?? '',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{row.displayName ?? 'Unnamed'}</p>
          <p className="truncate font-mono text-[0.6875rem] text-fg-subtle">{row.vpa ?? `#${row.userId}`}</p>
        </div>
      ),
    },
    {
      id: 'count',
      header: 'Transfers (24h)',
      align: 'right',
      sortValue: (row) => row.transferCount,
      cell: (row) => <span className="text-sm font-medium tabular-nums">{row.transferCount}</span>,
    },
    {
      id: 'total',
      header: 'Total sent (24h)',
      align: 'right',
      sortValue: (row) => row.totalMinor,
      cell: (row) => <span className="text-sm font-semibold tabular-nums">{formatMoney(row.totalMinor)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => (row.frozen ? 1 : 0),
      cell: (row) => (row.frozen ? <Badge tone="danger">Frozen</Badge> : <Badge tone="warning">Flagged</Badge>),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <Button
          variant={row.frozen ? 'secondary' : 'danger'}
          size="sm"
          leftIcon={row.frozen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          loading={actingOn === row.userId}
          onClick={() => void toggleFrozen(row)}
        >
          {row.frozen ? 'Unfreeze' : 'Freeze'}
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Fraud signals"
        description="Accounts whose outbound transfers in the last 24 hours crossed a velocity threshold — a heuristic for a human to review, not an automatic block."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            loading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
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

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => String(row.userId)}
        loading={loading}
        defaultSort={{ id: 'total', direction: 'desc' }}
        empty={
          <EmptyState
            inline
            icon={<ShieldAlert />}
            title="Nothing flagged"
            description="No account has crossed the velocity threshold in the last 24 hours."
          />
        }
      />
    </>
  )
}
