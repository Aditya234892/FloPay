import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Check, Copy, Link2, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { AmountInput } from '@/components/AmountInput'
import { paymentLinksApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatMoney, formatDateTime } from '@/lib/format'

/** flopay:// isn't a browser-openable scheme — a plain https link is what actually gets shared/pasted. */
const linkUrl = (code: string) => `${window.location.origin}/pay/${code}`

export function PaymentLinksScreen() {
  const navigate = useNavigate()
  const links = useAsyncResource(paymentLinksApi.list, [])

  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [openAmount, setOpenAmount] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [disablingId, setDisablingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const amountMinor = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
  }, [amount])

  const canSubmit = (openAmount || amountMinor > 0) && !busy

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setBusy(true)
    try {
      await paymentLinksApi.create({
        amountMinor: openAmount ? undefined : amountMinor,
        note: note.trim() || undefined,
      })
      setAmount('')
      setOpenAmount(false)
      setNote('')
      setShowForm(false)
      await links.refetch()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async (id: string) => {
    setDisablingId(id)
    try {
      await paymentLinksApi.disable(id)
      await links.refetch()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setDisablingId(null)
    }
  }

  const handleCopy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(linkUrl(code))
      setCopiedId(id)
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600)
    } catch {
      /* clipboard access denied — non-critical, the link is still visible on screen */
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
            aria-label="New payment link"
            className="tap-target inline-flex items-center gap-1.5 rounded-full bg-brand-500 py-2 pr-3.5 pl-3 text-sm font-semibold text-white active:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        )}
      </div>

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Payment links</h1>
      <p className="mt-1 text-sm text-fg-muted">Share a link and get paid by anyone on FloPay.</p>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 rounded-3xl bg-surface-raised p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">New payment link</h2>
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

          {!openAmount && (
            <div className="mt-4">
              <AmountInput value={amount} onChange={setAmount} autoFocus />
            </div>
          )}

          <label className="mt-4 flex items-center gap-2.5 text-sm font-medium text-fg">
            <input
              type="checkbox"
              checked={openAmount}
              onChange={(e) => setOpenAmount(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-brand-500"
            />
            Let the payer choose the amount
          </label>

          <div className="mt-5">
            <label htmlFor="linkNote" className="mb-1.5 block text-xs font-semibold text-fg-muted">
              Note <span className="font-normal text-fg-subtle">(optional)</span>
            </label>
            <input
              id="linkNote"
              type="text"
              maxLength={140}
              placeholder="Freelance work, donation, event ticket…"
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
              Create link
            </Button>
          </div>
        </motion.div>
      )}

      <div className="mt-6">
        {links.loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : links.error ? (
          <p className="text-sm font-medium text-rose-500">{links.error}</p>
        ) : links.data && links.data.length > 0 ? (
          <div className="space-y-3">
            {links.data.map((link) => (
              <div key={link.id} className="rounded-2xl bg-surface-raised p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold tabular-nums">
                      {link.amountMinor != null ? formatMoney(link.amountMinor) : 'Any amount'}
                    </p>
                    {link.note && <p className="mt-0.5 truncate text-xs text-fg-subtle">{link.note}</p>}
                  </div>
                  {link.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleDisable(link.id)}
                      disabled={disablingId === link.id}
                      aria-label="Disable link"
                      className="tap-target -mt-1 -mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-fg-subtle active:bg-line/60 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(link.id, link.code)}
                  disabled={link.status !== 'ACTIVE'}
                  className="tap-target mt-3 flex w-full items-center gap-2 rounded-xl bg-line/40 px-3 py-2.5 text-left disabled:opacity-40"
                >
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg-muted">
                    {linkUrl(link.code)}
                  </span>
                  {copiedId === link.id ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-accent-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                  )}
                </button>

                <div className="mt-2.5 flex items-center gap-2 text-xs text-fg-subtle">
                  <span
                    className={
                      link.status === 'ACTIVE'
                        ? 'font-medium text-accent-600'
                        : 'font-medium text-fg-subtle'
                    }
                  >
                    {link.status === 'ACTIVE' ? 'Active' : 'Disabled'}
                  </span>
                  <span>·</span>
                  <span>{formatDateTime(link.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-12 text-center shadow-sm">
            <Link2 className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg">No payment links yet</p>
            <p className="text-xs text-fg-subtle">Create one to get paid without sharing your VPA.</p>
          </div>
        )}
      </div>
    </div>
  )
}
