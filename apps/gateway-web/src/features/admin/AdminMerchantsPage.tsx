import { useState } from 'react'
import { KeyRound, RefreshCw, Search, Store } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Input, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/format'
import { adminApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import type { AdminMerchantResponse } from '@/api/types'

export function AdminMerchantsPage() {
  const [query, setQuery] = useState('')
  const { data, loading, error, refetch } = useAsyncResource(() => adminApi.merchants(query || undefined), [query])

  const rows = data ?? []

  const columns: Column<AdminMerchantResponse>[] = [
    {
      id: 'merchant',
      header: 'Merchant',
      sortValue: (row) => row.name,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{row.name}</p>
          <p className="truncate text-[0.6875rem] text-fg-subtle">{row.email}</p>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      sortValue: (row) => row.role,
      cell: (row) => <Badge tone={row.role === 'ADMIN' ? 'violet' : 'neutral'}>{row.role}</Badge>,
    },
    {
      id: 'apiKeys',
      header: 'Active keys',
      align: 'right',
      sortValue: (row) => row.activeApiKeyCount,
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
          <KeyRound className="h-3.5 w-3.5" />
          {row.activeApiKeyCount}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Joined',
      hideOnMobile: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => <span className="text-xs text-fg-muted">{formatDateTime(row.createdAt)}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Merchants"
        description="Every merchant dashboard account — search by name or email."
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

      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

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
        rowKey={(row) => String(row.id)}
        loading={loading}
        defaultSort={{ id: 'createdAt', direction: 'desc' }}
        empty={
          <EmptyState inline icon={<Store />} title="No merchants found" description="Try a different search term." />
        }
      />
    </>
  )
}
