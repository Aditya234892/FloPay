import { useState } from 'react'
import { Check, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, useToast, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMoney, formatRelative } from '@/lib/format'
import { extractErrorMessage } from '@/api/client'
import { adminApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import type { AdminTopUpRequestResponse } from '@/api/types'

export function AdminTopUpRequestsPage() {
  const { data, loading, error, refetch } = useAsyncResource(adminApi.pendingTopUpRequests, [])
  const toast = useToast()
  const [actingOn, setActingOn] = useState<string | null>(null)

  const rows = data ?? []

  const decide = async (row: AdminTopUpRequestResponse, action: 'approve' | 'reject') => {
    setActingOn(row.id)
    try {
      if (action === 'approve') {
        await adminApi.approveTopUpRequest(row.id)
        toast.success('Approved', `${formatMoney(row.amountMinor)} credited to ${row.userVpa ?? 'the user'}.`)
      } else {
        await adminApi.rejectTopUpRequest(row.id)
        toast.success('Rejected', `Request from ${row.userVpa ?? 'the user'} was rejected.`)
      }
      await refetch()
    } catch (caught) {
      toast.error('Something went wrong', extractErrorMessage(caught))
    } finally {
      setActingOn(null)
    }
  }

  const columns: Column<AdminTopUpRequestResponse>[] = [
    {
      id: 'user',
      header: 'User',
      sortValue: (row) => row.userDisplayName ?? row.userVpa ?? '',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{row.userDisplayName ?? 'Unnamed'}</p>
          <p className="truncate font-mono text-[0.6875rem] text-fg-subtle">{row.userVpa}</p>
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
      header: 'Requested',
      hideOnMobile: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => <span className="text-xs text-fg-muted">{formatRelative(row.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Check className="h-3.5 w-3.5" />}
            loading={actingOn === row.id}
            onClick={() => void decide(row, 'approve')}
          >
            Approve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<X className="h-3.5 w-3.5" />}
            disabled={actingOn === row.id}
            onClick={() => void decide(row, 'reject')}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Top-up requests"
        description="Sandbox demo-money requests from the wallet app, waiting for admin approval."
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

      <div className="mb-5">
        <Badge tone="warning">{rows.length} pending</Badge>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        loading={loading}
        defaultSort={{ id: 'createdAt', direction: 'asc' }}
        empty={
          <EmptyState
            inline
            icon={<ShieldCheck />}
            title="No pending requests"
            description="Every wallet top-up request has been reviewed."
          />
        }
      />
    </>
  )
}
