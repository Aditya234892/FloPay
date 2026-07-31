import { RefreshCw, ScrollText } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, type BadgeTone, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/format'
import { adminApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import type { AuditLogResponse } from '@/api/types'

const ACTION_TONES: Record<string, BadgeTone> = {
  MERCHANT_LOGIN_SUCCESS: 'success',
  MERCHANT_LOGIN_FAILED: 'danger',
  ADMIN_TOPUP_APPROVED: 'success',
  ADMIN_TOPUP_REJECTED: 'warning',
  PIN_VERIFY_FAILED: 'danger',
}

export function AdminAuditLogsPage() {
  const { data, loading, error, refetch } = useAsyncResource(adminApi.auditLogs, [])
  const rows = data ?? []

  const columns: Column<AuditLogResponse>[] = [
    {
      id: 'action',
      header: 'Action',
      sortValue: (row) => row.action,
      cell: (row) => <Badge tone={ACTION_TONES[row.action] ?? 'neutral'}>{row.action}</Badge>,
    },
    {
      id: 'actor',
      header: 'Actor',
      sortValue: (row) => row.actorType,
      cell: (row) => (
        <span className="text-sm text-fg">
          {row.actorType}
          {row.actorId != null && <span className="text-fg-subtle"> #{row.actorId}</span>}
        </span>
      ),
    },
    {
      id: 'details',
      header: 'Details',
      hideOnMobile: true,
      sortValue: (row) => row.details ?? '',
      cell: (row) => <span className="truncate text-xs text-fg-muted">{row.details ?? '—'}</span>,
    },
    {
      id: 'ip',
      header: 'IP',
      hideOnMobile: true,
      sortValue: (row) => row.ipAddress ?? '',
      cell: (row) => <span className="font-mono text-xs text-fg-subtle">{row.ipAddress ?? '—'}</span>,
    },
    {
      id: 'createdAt',
      header: 'When',
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => <span className="text-xs text-fg-muted">{formatDateTime(row.createdAt)}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="System logs"
        description="An audit trail of sensitive actions — merchant logins, admin approvals, failed PIN attempts."
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
        rowKey={(row) => row.id}
        loading={loading}
        defaultSort={{ id: 'createdAt', direction: 'desc' }}
        empty={
          <EmptyState inline icon={<ScrollText />} title="No log entries yet" description="Sensitive actions will appear here as they happen." />
        }
      />
    </>
  )
}
