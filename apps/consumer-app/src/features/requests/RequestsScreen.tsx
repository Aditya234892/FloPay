import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, Check, Inbox, X } from 'lucide-react'
import { requestApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatMoney, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PaymentRequestResponse, PaymentRequestStatus } from '@flopay/api-types'

type Tab = 'incoming' | 'outgoing'

const STATUS_STYLES: Record<PaymentRequestStatus, string> = {
  PENDING: 'bg-amber-500/12 text-amber-600',
  PAID: 'bg-accent-500/12 text-accent-600',
  DECLINED: 'bg-rose-500/12 text-rose-500',
  CANCELLED: 'bg-line text-fg-subtle',
}

function StatusBadge({ status }: { status: PaymentRequestStatus }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide',
        STATUS_STYLES[status],
      )}
    >
      {status.toLowerCase()}
    </span>
  )
}

export function RequestsScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('incoming')
  const incoming = useAsyncResource(requestApi.listIncoming, [])
  const outgoing = useAsyncResource(requestApi.listOutgoing, [])
  const [actingOn, setActingOn] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const active = tab === 'incoming' ? incoming : outgoing

  const act = async (fn: (id: string) => Promise<PaymentRequestResponse>, id: string) => {
    setActingOn(id)
    setActionError(null)
    try {
      await fn(id)
      await Promise.all([incoming.refetch(), outgoing.refetch()])
    } catch (err) {
      setActionError(extractErrorMessage(err))
    } finally {
      setActingOn(null)
    }
  }

  return (
    <div className="phone-shell px-6 pt-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="tap-target -ml-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Requests</h1>

      <div className="mt-5 flex gap-1 rounded-2xl bg-surface-raised p-1">
        {(['incoming', 'outgoing'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'tap-target flex-1 rounded-xl text-sm font-semibold capitalize transition-colors',
              tab === t ? 'bg-brand-500 text-white' : 'text-fg-muted',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="mt-4 text-sm font-medium text-rose-500">
          {actionError}
        </p>
      )}

      <div className="mt-4 flex-1 pb-8">
        {active.loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : active.error ? (
          <p className="text-sm font-medium text-rose-500">{active.error}</p>
        ) : active.data && active.data.length > 0 ? (
          <div className="space-y-3">
            {active.data.map((req) => (
              <div key={req.id} className="rounded-2xl bg-surface-raised p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {req.counterpartyName ?? req.counterpartyVpa ?? 'Unknown'}
                    </p>
                    {req.note && <p className="truncate text-xs text-fg-subtle">{req.note}</p>}
                    <p className="mt-0.5 text-xs text-fg-subtle">{formatRelative(req.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold tabular-nums">{formatMoney(req.amountMinor)}</p>
                    <div className="mt-1">
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                </div>

                {tab === 'incoming' && req.status === 'PENDING' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => act(requestApi.approve, req.id)}
                      disabled={actingOn === req.id}
                      className="tap-target inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-500 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => act(requestApi.decline, req.id)}
                      disabled={actingOn === req.id}
                      className="tap-target inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-line/60 text-sm font-semibold text-fg disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> Decline
                    </button>
                  </div>
                )}

                {tab === 'outgoing' && req.status === 'PENDING' && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => act(requestApi.cancel, req.id)}
                      disabled={actingOn === req.id}
                      className="tap-target inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-line/60 text-sm font-semibold text-fg disabled:opacity-50"
                    >
                      <Ban className="h-3.5 w-3.5" /> Cancel request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-12 text-center shadow-sm">
            <Inbox className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg">No {tab} requests</p>
          </div>
        )}
      </div>
    </div>
  )
}
