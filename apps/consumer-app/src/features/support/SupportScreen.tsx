import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, LifeBuoy, Plus, X } from 'lucide-react'
import { Button } from '@/components/Button'
import { supportApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatDateTime } from '@/lib/format'

export function SupportScreen() {
  const navigate = useNavigate()
  const tickets = useAsyncResource(supportApi.list, [])

  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && !busy

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setBusy(true)
    try {
      await supportApi.create({ subject: subject.trim(), message: message.trim() })
      setSubject('')
      setMessage('')
      setShowForm(false)
      await tickets.refetch()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
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
            aria-label="New ticket"
            className="tap-target inline-flex items-center gap-1.5 rounded-full bg-brand-500 py-2 pr-3.5 pl-3 text-sm font-semibold text-white active:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        )}
      </div>

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Support</h1>
      <p className="mt-1 text-sm text-fg-muted">Something wrong with a payment or your account? Let us know.</p>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 rounded-3xl bg-surface-raised p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">New ticket</h2>
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
            <label htmlFor="subject" className="mb-1.5 block text-xs font-semibold text-fg-muted">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              maxLength={140}
              placeholder="e.g. Money sent but not received"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="tap-target w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="message" className="mb-1.5 block text-xs font-semibold text-fg-muted">
              Details
            </label>
            <textarea
              id="message"
              rows={4}
              maxLength={2000}
              placeholder="Tell us what happened — include amounts, VPAs, or dates if you can."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
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
              Submit
            </Button>
          </div>
        </motion.div>
      )}

      <div className="mt-6">
        {tickets.loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : tickets.error ? (
          <p className="text-sm font-medium text-rose-500">{tickets.error}</p>
        ) : tickets.data && tickets.data.length > 0 ? (
          <div className="space-y-3">
            {tickets.data.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl bg-surface-raised p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{ticket.subject}</p>
                  {ticket.status === 'RESOLVED' ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolved
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-amber-600">Open</span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-fg-subtle">{ticket.message}</p>
                {ticket.adminResponse && (
                  <div className="mt-3 rounded-xl bg-line/40 p-3">
                    <p className="text-xs font-semibold text-fg-muted">Support replied</p>
                    <p className="mt-1 text-xs text-fg">{ticket.adminResponse}</p>
                  </div>
                )}
                <p className="mt-2.5 text-xs text-fg-subtle">{formatDateTime(ticket.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-12 text-center shadow-sm">
            <LifeBuoy className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg">No tickets yet</p>
            <p className="text-xs text-fg-subtle">Raise one if something's not working right.</p>
          </div>
        )}
      </div>
    </div>
  )
}
