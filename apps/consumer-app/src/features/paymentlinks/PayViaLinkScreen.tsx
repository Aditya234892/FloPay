import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Link2 } from 'lucide-react'
import { Button } from '@/components/Button'
import { AmountInput } from '@/components/AmountInput'
import { paymentLinksApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatMoney } from '@/lib/format'
import { randomId } from '@/lib/uuid'
import type { TransferResponse } from '@flopay/api-types'

export function PayViaLinkScreen() {
  const navigate = useNavigate()
  const { code } = useParams()
  const preview = useAsyncResource(() => paymentLinksApi.preview(code!), [code])

  const [amount, setAmount] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(() => randomId())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<TransferResponse | null>(null)

  const openAmountMinor = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
  }, [amount])

  const fixedAmountMinor = preview.data?.amountMinor ?? null
  const canSubmit = !!code && !busy && (fixedAmountMinor != null || openAmountMinor > 0)

  const handlePay = async () => {
    if (!code || !canSubmit) return
    setError(null)
    setBusy(true)
    try {
      const response = await paymentLinksApi.pay(code, {
        amountMinor: fixedAmountMinor == null ? openAmountMinor : undefined,
        idempotencyKey,
      })
      setResult(response)
    } catch (err) {
      setError(extractErrorMessage(err))
      setIdempotencyKey(randomId())
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
          className="flex flex-col items-center pt-10 text-center"
        >
          <CheckCircle2 className="h-16 w-16 text-accent-500" />
          <h1 className="mt-5 font-display text-2xl font-bold">Payment sent</h1>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatMoney(result.amountMinor)}</p>
          <p className="mt-2 text-sm text-fg-muted">to {result.toName ?? result.toVpa}</p>
        </motion.div>

        <div className="mt-10 space-y-2 pb-6">
          <Button onClick={() => navigate('/home', { replace: true })}>Back to home</Button>
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

      {preview.loading ? (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-line/60" />
          <div className="h-4 w-40 animate-pulse rounded bg-line/60" />
        </div>
      ) : preview.error || !preview.data ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <Link2 className="h-8 w-8 text-fg-subtle" />
          <p className="text-sm font-medium text-fg">Link not found</p>
          <p className="text-xs text-fg-subtle">{preview.error ?? 'This payment link may have been removed.'}</p>
        </div>
      ) : !preview.data.active ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <Link2 className="h-8 w-8 text-fg-subtle" />
          <p className="text-sm font-medium text-fg">This link is no longer active</p>
          <p className="text-xs text-fg-subtle">Ask {preview.data.creatorDisplayName ?? preview.data.creatorVpa} for a new one.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-500/10 text-brand-600">
              <Link2 className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm text-fg-muted">Pay</p>
            <p className="text-lg font-bold text-fg">
              {preview.data.creatorDisplayName ?? preview.data.creatorVpa}
            </p>
            <p className="font-mono text-xs text-fg-subtle">{preview.data.creatorVpa}</p>
            {preview.data.note && <p className="mt-2 text-sm text-fg-muted">{preview.data.note}</p>}
          </div>

          <div className="mt-8">
            {fixedAmountMinor != null ? (
              <p className="text-center font-display text-5xl font-extrabold tabular-nums">
                {formatMoney(fixedAmountMinor)}
              </p>
            ) : (
              <AmountInput value={amount} onChange={setAmount} autoFocus />
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-1.5 text-sm font-medium text-rose-500">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="mt-auto pt-10 pb-6">
            <Button onClick={handlePay} disabled={!canSubmit} loading={busy}>
              Pay {fixedAmountMinor != null ? formatMoney(fixedAmountMinor) : ''}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
