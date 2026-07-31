import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Check, Share2 } from 'lucide-react'
import { formatMoney, formatDateTime } from '@/lib/format'
import { transactionLabel } from '@/components/TransactionRow'
import { cn } from '@/lib/utils'
import type { WalletTransaction } from '@flopay/api-types'

const KIND_LABELS: Record<string, string> = {
  P2P_TRANSFER: 'Wallet transfer',
  SANDBOX_TOPUP: 'Add money',
}

export function TransactionDetailScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { entryId } = useParams()
  const [shared, setShared] = useState(false)

  const tx = (location.state as { tx?: WalletTransaction } | null)?.tx

  // Reached directly (refresh/deep link) with no transaction in navigation
  // state — there's no GET-by-id endpoint yet, so the honest move is to send
  // them back to the list rather than show a broken page.
  if (!tx || tx.entryId !== entryId) {
    return <Navigate to="/activity" replace />
  }

  const isCredit = tx.direction === 'CREDIT'
  const category = KIND_LABELS[tx.kind] ?? tx.kind

  const handleShare = async () => {
    const summary = `FloPay receipt\n${isCredit ? '+' : '-'}${formatMoney(tx.amountMinor)}\n${transactionLabel(tx)}\n${formatDateTime(tx.createdAt)}\nRef: ${tx.entryId}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'FloPay receipt', text: summary })
      } else {
        await navigator.clipboard.writeText(summary)
        setShared(true)
        setTimeout(() => setShared(false), 1500)
      }
    } catch {
      // User cancelled the share sheet — not an error.
    }
  }

  return (
    <div className="phone-shell px-6 pt-6">
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
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share receipt"
          className="tap-target -mr-2 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted"
        >
          {shared ? <Check className="h-4 w-4 text-accent-600" /> : <Share2 className="h-4 w-4" />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-4 flex flex-col items-center text-center"
      >
        <span
          className={cn(
            'grid h-16 w-16 place-items-center rounded-full',
            isCredit ? 'bg-accent-500/12 text-accent-600' : 'bg-rose-500/12 text-rose-500',
          )}
        >
          {isCredit ? <ArrowDownLeft className="h-7 w-7" /> : <ArrowUpRight className="h-7 w-7" />}
        </span>
        <p className="mt-4 font-display text-4xl font-extrabold tracking-tight tabular-nums">
          {isCredit ? '+' : '−'}
          {formatMoney(tx.amountMinor)}
        </p>
        <p className="mt-1.5 text-sm font-medium text-fg-muted">{transactionLabel(tx)}</p>
      </motion.div>

      <div className="mt-8 space-y-px overflow-hidden rounded-2xl bg-surface-raised shadow-sm">
        <DetailRow label="Status" value={isCredit ? 'Credited' : 'Debited'} />
        <DetailRow label="Category" value={category} />
        <DetailRow label="Method" value="FloPay Wallet" />
        {tx.counterpartyVpa && <DetailRow label="Counterparty" value={tx.counterpartyVpa} mono />}
        {tx.note && <DetailRow label="Note" value={tx.note} />}
        <DetailRow label="Date" value={formatDateTime(tx.createdAt)} />
        <DetailRow label="Reference" value={tx.entryId} mono small />
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-surface-raised px-4 py-3.5">
      <span className="text-xs font-medium text-fg-subtle">{label}</span>
      <span
        className={cn(
          'truncate text-right text-fg',
          mono && 'font-mono',
          small ? 'text-[0.6875rem]' : 'text-sm font-medium',
        )}
      >
        {value}
      </span>
    </div>
  )
}
