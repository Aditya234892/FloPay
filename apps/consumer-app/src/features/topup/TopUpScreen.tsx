import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/Button'
import { AmountInput } from '@/components/AmountInput'
import { topUpRequestApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatMoney, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TopUpRequestResponse, TopUpRequestStatus } from '@flopay/api-types'

type Tab = 'new' | 'history'

const STATUS_STYLES: Record<TopUpRequestStatus, string> = {
  PENDING: 'bg-amber-500/12 text-amber-600',
  APPROVED: 'bg-accent-500/12 text-accent-600',
  REJECTED: 'bg-rose-500/12 text-rose-500',
}

function StatusBadge({ status }: { status: TopUpRequestStatus }) {
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

export function TopUpScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('new')

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [requested, setRequested] = useState<TopUpRequestResponse | null>(null)

  const history = useAsyncResource(topUpRequestApi.history, [])

  const amountMinor = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
  }, [amount])

  const canSubmit = amountMinor > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setBusy(true)
    try {
      const result = await topUpRequestApi.create({ amountMinor, note: note.trim() || undefined })
      setRequested(result)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (requested) {
    return (
      <div className="phone-shell items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Clock className="mx-auto h-16 w-16 text-amber-500" />
        </motion.div>
        <h1 className="mt-5 font-display text-2xl font-bold">Request sent to admin</h1>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatMoney(requested.amountMinor)}</p>
        <p className="mt-2 text-sm text-fg-muted">
          Your wallet will be credited once an admin approves this request.
        </p>
        <div className="mt-10 w-full space-y-2">
          <Button
            onClick={() => {
              setRequested(null)
              setAmount('')
              setNote('')
              setTab('history')
              history.refetch()
            }}
          >
            View status
          </Button>
          <Button variant="ghost" onClick={() => navigate('/home', { replace: true })}>
            Back to home
          </Button>
        </div>
      </div>
    )
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

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Add money</h1>

      <div className="mt-5 flex gap-1 rounded-2xl bg-surface-raised p-1">
        {(['new', 'history'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'tap-target flex-1 rounded-xl text-sm font-semibold capitalize transition-colors',
              tab === t ? 'bg-brand-500 text-white' : 'text-fg-muted',
            )}
          >
            {t === 'new' ? 'Request' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'new' ? (
        <>
          <p className="mt-6 text-center text-xs text-fg-subtle">
            Demo mode — requests are reviewed by an admin before your wallet is credited. No real
            money moves.
          </p>

          <div className="mt-6">
            <AmountInput value={amount} onChange={setAmount} autoFocus />
          </div>

          <div className="mt-8">
            <label htmlFor="note" className="mb-1.5 block text-xs font-semibold text-fg-muted">
              Note <span className="font-normal text-fg-subtle">(optional)</span>
            </label>
            <input
              id="note"
              type="text"
              maxLength={140}
              placeholder="What's it for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="tap-target w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-1.5 text-sm font-medium text-rose-500">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="mt-auto pt-8 pb-6">
            <Button onClick={handleSubmit} disabled={!canSubmit} loading={busy}>
              {!busy && <Plus className="h-4 w-4" />}
              {amountMinor > 0 ? `Request ${formatMoney(amountMinor)}` : 'Request'}
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-4 flex-1 pb-8">
          {history.loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-line/60" />
              ))}
            </div>
          ) : history.error ? (
            <p className="text-sm font-medium text-rose-500">{history.error}</p>
          ) : history.data && history.data.length > 0 ? (
            <div className="space-y-3">
              {history.data.map((r) => (
                <div key={r.id} className="rounded-2xl bg-surface-raised p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {r.note && <p className="truncate text-sm font-medium text-fg">{r.note}</p>}
                      <p className="mt-0.5 text-xs text-fg-subtle">{formatRelative(r.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold tabular-nums">{formatMoney(r.amountMinor)}</p>
                      <div className="mt-1">
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-12 text-center shadow-sm">
              <CheckCircle2 className="h-8 w-8 text-fg-subtle" />
              <p className="text-sm font-medium text-fg">No requests yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
