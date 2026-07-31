import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toDataURL } from 'qrcode'
import { ArrowLeft, Check, Copy, Share2 } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { FloMark } from '@/components/FloMark'

/**
 * Our own scheme, not `upi://` — this app has no real UPI interop, and
 * borrowing that scheme would imply it does. Only FloPay's own Scan screen
 * needs to understand this format.
 */
function buildPayload(vpa: string, name: string | null): string {
  const params = new URLSearchParams({ vpa })
  if (name) params.set('name', name)
  return `flopay://pay?${params.toString()}`
}

export function ReceiveScreen() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!session) return
    toDataURL(buildPayload(session.vpa, session.displayName), {
      width: 260,
      margin: 1,
      color: { dark: '#0b1220', light: '#00000000' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [session])

  const handleCopy = async () => {
    if (!session) return
    try {
      await navigator.clipboard.writeText(session.vpa)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — VPA is still visible on screen.
    }
  }

  const handleShare = async () => {
    if (!session) return
    const text = `Pay me on FloPay: ${session.vpa}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My FloPay ID', text })
      } else {
        await handleCopy()
      }
    } catch {
      // Share sheet cancelled.
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

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Receive money</h1>
      <p className="mt-1 text-sm text-fg-muted">Scan this with any FloPay app to pay you.</p>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="mx-auto mt-8 w-full max-w-[19rem] rounded-3xl bg-surface-raised p-6 text-center shadow-lg"
      >
        <div className="mx-auto inline-flex items-center gap-1.5">
          <FloMark className="h-5 w-5" />
          <span className="font-display text-sm font-bold">FloPay</span>
        </div>

        <div className="relative mx-auto mt-5 grid h-[17rem] w-[17rem] place-items-center rounded-2xl bg-white p-4 shadow-inner">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for ${session?.vpa}`} className="h-full w-full" />
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-line/60" />
          )}
        </div>

        <p className="mt-5 font-display text-lg font-bold text-fg">{session?.displayName ?? 'FloPay user'}</p>
        <p className="mt-0.5 font-mono text-sm text-fg-muted">{session?.vpa}</p>
      </motion.div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="tap-target inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-line text-sm font-semibold text-fg active:bg-line"
        >
          {copied ? <Check className="h-4 w-4 text-accent-600" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy ID'}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="tap-target inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand-500 text-sm font-semibold text-white active:bg-brand-600"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  )
}
