import { useState } from 'react'
import { LifeBuoy, RefreshCw } from 'lucide-react'
import { Badge, Button, DataTable, EmptyState, Modal, useToast, type Column } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/format'
import { extractErrorMessage } from '@/api/client'
import { adminApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import type { AdminTicketResponse } from '@/api/types'

export function AdminSupportTicketsPage() {
  const { data, loading, error, refetch, mutate } = useAsyncResource(adminApi.supportTickets, [])
  const toast = useToast()

  const [replying, setReplying] = useState<AdminTicketResponse | null>(null)
  const [response, setResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const rows = data ?? []

  const openReply = (ticket: AdminTicketResponse) => {
    setReplying(ticket)
    setResponse('')
  }

  const submitReply = async () => {
    if (!replying || !response.trim()) return
    setSubmitting(true)
    try {
      const updated = await adminApi.resolveTicket(replying.id, { response: response.trim() })
      mutate((current) => current?.map((t) => (t.id === updated.id ? updated : t)) ?? current)
      toast.success('Ticket resolved', replying.requesterLabel ?? undefined)
      setReplying(null)
    } catch (caught) {
      toast.error('Something went wrong', extractErrorMessage(caught))
    } finally {
      setSubmitting(false)
    }
  }

  const columns: Column<AdminTicketResponse>[] = [
    {
      id: 'requester',
      header: 'From',
      sortValue: (row) => row.requesterLabel ?? '',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-fg">{row.requesterLabel ?? `#${row.requesterId}`}</p>
          <p className="text-[0.6875rem] text-fg-subtle">{row.requesterType}</p>
        </div>
      ),
    },
    {
      id: 'subject',
      header: 'Subject',
      sortValue: (row) => row.subject,
      cell: (row) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate text-sm font-medium text-fg">{row.subject}</p>
          <p className="truncate text-xs text-fg-subtle">{row.message}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => <Badge tone={row.status === 'OPEN' ? 'warning' : 'success'}>{row.status}</Badge>,
    },
    {
      id: 'createdAt',
      header: 'Received',
      hideOnMobile: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => <span className="text-xs text-fg-muted">{formatDateTime(row.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) =>
        row.status === 'OPEN' ? (
          <Button variant="secondary" size="sm" onClick={() => openReply(row)}>
            Reply
          </Button>
        ) : (
          <span className="text-xs text-fg-subtle">Resolved</span>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Support tickets"
        description="Issues raised by wallet users, waiting for a response."
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
        defaultSort={{ id: 'status', direction: 'asc' }}
        empty={
          <EmptyState inline icon={<LifeBuoy />} title="No tickets" description="Support tickets will show up here." />
        }
      />

      <Modal
        open={replying !== null}
        onClose={() => setReplying(null)}
        title="Reply to ticket"
        description={replying?.subject}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReplying(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitReply()} loading={submitting} disabled={!response.trim()}>
              Send & resolve
            </Button>
          </>
        }
      >
        {replying && (
          <div className="space-y-3">
            <div className="rounded-xl bg-surface-hover/50 p-3 text-sm text-fg-muted">{replying.message}</div>
            <textarea
              rows={4}
              maxLength={2000}
              autoFocus
              placeholder="Write a response…"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full resize-none rounded-xl border border-line bg-bg-elevated/70 px-3.5 py-3 text-sm text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
        )}
      </Modal>
    </>
  )
}
