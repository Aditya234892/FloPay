import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Plus, Users, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { AmountInput } from '@/components/AmountInput'
import { requestApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { formatMoney } from '@/lib/format'
import { useAuth } from '@/auth/AuthContext'
import type { SplitSummaryResponse } from '@flopay/api-types'

export function SplitBillScreen() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [payerInput, setPayerInput] = useState('')
  const [payers, setPayers] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SplitSummaryResponse | null>(null)

  const amountMinor = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
  }, [amount])

  /**
   * Matches the backend exactly (SplitCalculator divides totalAmountMinor by
   * payers.length only — the creator collects the split, they don't owe a
   * share of it themselves). Getting this preview wrong would show a number
   * that doesn't match what people actually get asked to pay.
   */
  const perPersonPreview = payers.length > 0 ? Math.floor(amountMinor / payers.length) : 0

  const addPayer = () => {
    const vpa = payerInput.trim().toLowerCase()
    if (!vpa) return
    if (vpa === session?.vpa.toLowerCase()) {
      setError("You're already part of the split — no need to add yourself.")
      return
    }
    if (payers.includes(vpa)) {
      setError('Already added.')
      return
    }
    setError(null)
    setPayers((prev) => [...prev, vpa])
    setPayerInput('')
  }

  const removePayer = (vpa: string) => setPayers((prev) => prev.filter((p) => p !== vpa))

  const canSubmit = amountMinor > 0 && payers.length > 0 && !busy

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setBusy(true)
    try {
      const response = await requestApi.createSplit({
        totalAmountMinor: amountMinor,
        payerVpas: payers,
        note: note.trim() || undefined,
      })
      setResult(response)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <div className="phone-shell px-6 pt-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex flex-col items-center pt-6 text-center"
        >
          <CheckCircle2 className="h-16 w-16 text-accent-500" />
          <h1 className="mt-5 font-display text-2xl font-bold">Split requested</h1>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatMoney(result.totalAmountMinor)}</p>
          <p className="mt-2 text-sm text-fg-muted">
            requested from {result.shares.length} {result.shares.length === 1 ? 'person' : 'people'}
          </p>
        </motion.div>

        <div className="mt-8 space-y-3">
          {result.shares.map((share) => (
            <div
              key={share.id}
              className="flex items-center justify-between rounded-2xl bg-surface-raised px-4 py-3.5 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{share.counterpartyName ?? share.counterpartyVpa}</p>
                <p className="truncate font-mono text-xs text-fg-subtle">{share.counterpartyVpa}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(share.amountMinor)}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-2 pb-6">
          <Button onClick={() => navigate('/requests', { replace: true })}>View requests</Button>
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

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Split a bill</h1>
      <p className="mt-1 text-sm text-fg-muted">
        Enter the amount you're collecting — it's divided evenly among the people you add below.
      </p>

      <div className="mt-6">
        <AmountInput value={amount} onChange={setAmount} autoFocus />
      </div>

      <div className="mt-6">
        <label htmlFor="payerInput" className="mb-1.5 block text-xs font-semibold text-fg-muted">
          Split with (FloPay VPA)
        </label>
        <div className="flex gap-2">
          <input
            id="payerInput"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="123456@flopay"
            value={payerInput}
            onChange={(e) => setPayerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addPayer()
              }
            }}
            className="tap-target min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 font-mono text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          />
          <button
            type="button"
            onClick={addPayer}
            aria-label="Add"
            className="tap-target grid w-12 shrink-0 place-items-center rounded-2xl bg-brand-500 text-white active:bg-brand-600"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {payers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {payers.map((vpa) => (
              <span
                key={vpa}
                className="inline-flex items-center gap-1.5 rounded-full bg-line/60 py-1.5 pr-2 pl-3 font-mono text-xs text-fg"
              >
                {vpa}
                <button type="button" onClick={() => removePayer(vpa)} aria-label={`Remove ${vpa}`}>
                  <X className="h-3.5 w-3.5 text-fg-subtle" />
                </button>
              </span>
            ))}
          </div>
        )}

        {payers.length > 0 && amountMinor > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
            <Users className="h-3.5 w-3.5" />
            {formatMoney(perPersonPreview)} requested from each of {payers.length}{' '}
            {payers.length === 1 ? 'person' : 'people'} — you don't owe a share yourself
          </div>
        )}
      </div>

      <div className="mt-6">
        <label htmlFor="note" className="mb-1.5 block text-xs font-semibold text-fg-muted">
          Note <span className="font-normal text-fg-subtle">(optional)</span>
        </label>
        <input
          id="note"
          type="text"
          maxLength={140}
          placeholder="Dinner, trip, rent…"
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
          Request split
        </Button>
      </div>
    </div>
  )
}
