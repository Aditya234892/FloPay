import { useState } from 'react'
import { Lock, RefreshCw, Search, Unlock, Users } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Input, useToast, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMoney, formatDateTime } from '@/lib/format'
import { extractErrorMessage } from '@/api/client'
import { adminApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import type { AdminUserResponse } from '@/api/types'

export function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const { data, loading, error, refetch, mutate } = useAsyncResource(() => adminApi.users(query || undefined), [query])
  const toast = useToast()
  const [actingOn, setActingOn] = useState<number | null>(null)

  const rows = data ?? []

  const toggleFrozen = async (row: AdminUserResponse) => {
    setActingOn(row.id)
    try {
      const updated = row.frozen ? await adminApi.unfreezeUser(row.id) : await adminApi.freezeUser(row.id)
      mutate((current) => current?.map((u) => (u.id === updated.id ? updated : u)) ?? current)
      toast.success(updated.frozen ? 'Account frozen' : 'Account unfrozen', updated.vpa)
    } catch (caught) {
      toast.error('Something went wrong', extractErrorMessage(caught))
    } finally {
      setActingOn(null)
    }
  }

  const columns: Column<AdminUserResponse>[] = [
    {
      id: 'user',
      header: 'User',
      sortValue: (row) => row.displayName ?? row.vpa,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{row.displayName ?? 'Unnamed'}</p>
          <p className="truncate font-mono text-[0.6875rem] text-fg-subtle">{row.vpa}</p>
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      hideOnMobile: true,
      sortValue: (row) => row.phone,
      cell: (row) => <span className="font-mono text-xs text-fg-muted">{row.phone}</span>,
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'right',
      sortValue: (row) => row.walletBalanceMinor,
      cell: (row) => <span className="text-sm font-semibold tabular-nums">{formatMoney(row.walletBalanceMinor)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => (row.frozen ? 1 : 0),
      cell: (row) =>
        row.frozen ? (
          <Badge tone="danger">Frozen</Badge>
        ) : row.profileComplete ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="neutral">Onboarding</Badge>
        ),
    },
    {
      id: 'createdAt',
      header: 'Joined',
      hideOnMobile: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => <span className="text-xs text-fg-muted">{formatDateTime(row.createdAt)}</span>,
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
          loading={actingOn === row.id}
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
        title="Users"
        description="Every consumer wallet account — search by phone, VPA, or name."
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
          placeholder="Search phone, VPA, or name…"
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
          <EmptyState inline icon={<Users />} title="No users found" description="Try a different search term." />
        }
      />
    </>
  )
}
