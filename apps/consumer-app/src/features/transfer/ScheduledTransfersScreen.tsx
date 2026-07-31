import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CalendarClock, Plus, Repeat, Trash2, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { AmountInput } from '@/components/AmountInput'
import { scheduledTransfersApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatMoney, formatDateTime } from '@/lib/format'
import type { ScheduleFrequency } from '@flopay/api-types'

const FREQUENCY_OPTIONS: { label: string; value: ScheduleFrequency | null }[] = [
  { label: 'One-time', value: null },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
]

function frequencyLabel(frequency: ScheduleFrequency | null): string {
  return FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? 'One-time'
}

/** Local <input type="datetime-local"> value, rounded a few minutes out so it's always still in the future. */
function defaultFirstRun(): string {
  const d = new Date(Date.now() + 5 * 60_000)
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ScheduledTransfersScreen() {
  const navigate = useNavigate()
  const scheduled = useAsyncResource(scheduledTransfersApi.list, [])

  const [showForm, setShowForm] = useState(false)
  const [toVpa, setToVpa] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [frequency, setFrequency] = useState<ScheduleFrequency | null>(null)
  const [firstRunAt, setFirstRunAt] = useState(defaultFirstRun)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const amountMinor = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
  }, [amount])

  const canSubmit = toVpa.trim().length > 0 && amountMinor > 0 && firstRunAt.length > 0 && !busy

  const resetForm = () => {
    setToVpa('')
    setAmount('')
    setNote('')
    setFrequency(null)
    setFirstRunAt(defaultFirstRun())
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setBusy(true)
    try {
      await scheduledTransfersApi.create({
        toVpa: toVpa.trim().toLowerCase(),
        amountMinor,
        note: note.trim() || undefined,
        frequency,
        firstRunAt: new Date(firstRunAt).toISOString(),
      })
      resetForm()
      setShowForm(false)
      await scheduled.refetch()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      await scheduledTransfersApi.cancel(id)
      await scheduled.refetch()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="phone-shell px-6 pt-6" style={{ paddingBottom: '7rem' }}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="tap-target -ml-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            aria-label="New scheduled transfer"
            className="tap-target inline-flex items-center gap-1.5 rounded-full bg-brand-500 py-2 pr-3.5 pl-3 text-sm font-semibold text-white active:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        )}
      </div>

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Scheduled transfers</h1>
      <p className="mt-1 text-sm text-fg-muted">Send money later, or on a repeating schedule.</p>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 rounded-3xl bg-surface-raised p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">New scheduled transfer</h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setError(null)
              }}
              aria-label="Close"
              className="tap-target -mr-2 text-fg-subtle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4">
            <AmountInput value={amount} onChange={setAmount} autoFocus />
          </div>

          <div className="mt-5">
            <label htmlFor="toVpa" className="mb-1.5 block text-xs font-semibold text-fg-muted">
              To (FloPay VPA)
            </label>
            <input
              id="toVpa"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="123456@flopay"
              value={toVpa}
              onChange={(e) => setToVpa(e.target.value)}
              className="tap-target w-full rounded-2xl border border-line bg-surface px-4 font-mono text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
          </div>

          <div className="mt-5">
            <label htmlFor="firstRunAt" className="mb-1.5 block text-xs font-semibold text-fg-muted">
              {frequency ? 'First run' : 'Send at'}
            </label>
            <input
              id="firstRunAt"
              type="datetime-local"
              value={firstRunAt}
              onChange={(e) => setFirstRunAt(e.target.value)}
              className="tap-target w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
          </div>

          <div className="mt-5">
            <span className="mb-1.5 block text-xs font-semibold text-fg-muted">Repeat</span>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setFrequency(option.value)}
                  className={`tap-target rounded-full px-4 text-sm font-medium ${
                    frequency === option.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-line/60 text-fg-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="note" className="mb-1.5 block text-xs font-semibold text-fg-muted">
              Note <span className="font-normal text-fg-subtle">(optional)</span>
            </label>
            <input
              id="note"
              type="text"
              maxLength={140}
              placeholder="Rent, allowance, subscription…"
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

          <div className="mt-5">
            <Button onClick={handleSubmit} disabled={!canSubmit} loading={busy}>
              Schedule
            </Button>
          </div>
        </motion.div>
      )}

      <div className="mt-6">
        {scheduled.loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : scheduled.error ? (
          <p className="text-sm font-medium text-rose-500">{scheduled.error}</p>
        ) : scheduled.data && scheduled.data.length > 0 ? (
          <div className="space-y-3">
            {scheduled.data.map((s) => (
              <div key={s.id} className="rounded-2xl bg-surface-raised p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium text-fg">{s.toVpa}</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums">{formatMoney(s.amountMinor)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancel(s.id)}
                    disabled={cancellingId === s.id}
                    aria-label="Cancel"
                    className="tap-target -mt-1 -mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-fg-subtle active:bg-line/60 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {s.note && <p className="mt-1 truncate text-xs text-fg-subtle">{s.note}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-fg-subtle">
                  <span className="inline-flex items-center gap-1">
                    {s.frequency ? <Repeat className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                    {frequencyLabel(s.frequency)}
                  </span>
                  <span>Next: {formatDateTime(s.nextRunAt)}</span>
                </div>
                {s.lastError && (
                  <p className="mt-2 text-xs font-medium text-rose-500">Last attempt failed: {s.lastError}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-12 text-center shadow-sm">
            <CalendarClock className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg">No scheduled transfers</p>
            <p className="text-xs text-fg-subtle">Set up a one-time or recurring transfer above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
