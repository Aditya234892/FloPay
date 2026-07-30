import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/Button'
import { AmountInput } from '@/components/AmountInput'
import { transferApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { formatMoney } from '@/lib/format'
import { useAuth } from '@/auth/AuthContext'
import type { TransferResponse } from '@flopay/api-types'

export function SendMoneyScreen() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [toVpa, setToVpa] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<TransferResponse | null>(null)

  /**
   * Minted once per mounted screen, not per submit: if the first attempt times
   * out and the user taps Send again, the retry must carry the SAME key so the
   * backend treats it as a replay rather than a second transfer. Reset only
   * after a confirmed success.
   */
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const amountMinor = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
  }, [amount])

  const isSelf = toVpa.trim().toLowerCase() === session?.vpa.toLowerCase()
  const canSend = toVpa.trim().length > 0 && amountMinor > 0 && !isSelf

  const handleSend = async () => {
    if (!canSend) return
    setError(null)
    setBusy(true)
    try {
      const result = await transferApi.send({
        toVpa: toVpa.trim(),
        amountMinor,
        note: note.trim() || undefined,
        idempotencyKey,
      })
      setSent(result)
      setIdempotencyKey(crypto.randomUUID())
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="phone-shell items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <CheckCircle2 className="mx-auto h-16 w-16 text-accent-500" />
        </motion.div>
        <h1 className="mt-5 font-display text-2xl font-bold">Sent</h1>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatMoney(sent.amountMinor)}</p>
        <p className="mt-2 text-sm text-fg-muted">
          to <span className="font-mono text-fg">{sent.toVpa}</span>
        </p>
        {sent.note && <p className="mt-1 text-sm text-fg-subtle">"{sent.note}"</p>}

        <div className="mt-10 w-full space-y-2">
          <Button onClick={() => navigate('/home', { replace: true })}>Done</Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSent(null)
              setToVpa('')
              setAmount('')
              setNote('')
            }}
          >
            Send another
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

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Send money</h1>

      <div className="mt-8">
        <AmountInput value={amount} onChange={setAmount} autoFocus />
      </div>

      <div className="mt-8 space-y-4">
        <div>
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
          {isSelf && (
            <p className="mt-1.5 text-xs font-medium text-amber-500">That's your own VPA.</p>
          )}
        </div>

        <div>
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
      </div>

      {error && (
        <p role="alert" className="mt-4 flex items-start gap-1.5 text-sm font-medium text-rose-500">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-auto pt-8 pb-6">
        <Button onClick={handleSend} disabled={!canSend} loading={busy}>
          {!busy && <Send className="h-4 w-4" />}
          {amountMinor > 0 ? `Send ${formatMoney(amountMinor)}` : 'Send'}
        </Button>
      </div>
    </div>
  )
}
