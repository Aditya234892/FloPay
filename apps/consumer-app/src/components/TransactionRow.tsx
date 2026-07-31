import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatMoney, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { WalletTransaction } from '@flopay/api-types'

function humanizeKind(kind: string): string {
  const lower = kind.toLowerCase().replace(/_/g, ' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** A transfer's most useful label is who it was with; a top-up has no personal counterparty. */
export function transactionLabel(tx: WalletTransaction): string {
  return tx.counterpartyName ?? tx.counterpartyVpa ?? humanizeKind(tx.kind)
}

export function TransactionRow({ tx, currency }: { tx: WalletTransaction; currency: string }) {
  const navigate = useNavigate()
  const isCredit = tx.direction === 'CREDIT'

  return (
    <button
      type="button"
      onClick={() => navigate(`/activity/${tx.entryId}`, { state: { tx } })}
      className="tap-target flex w-full items-center gap-3 border-b border-line px-1 py-3.5 text-left last:border-0 active:bg-line/40"
    >
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-full',
          isCredit ? 'bg-accent-500/12 text-accent-600' : 'bg-rose-500/12 text-rose-500',
        )}
      >
        {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{transactionLabel(tx)}</p>
        <p className="truncate text-xs text-fg-subtle">{tx.note ? tx.note : formatRelative(tx.createdAt)}</p>
      </div>
      <p className={cn('shrink-0 text-sm font-semibold tabular-nums', isCredit ? 'text-accent-600' : 'text-fg')}>
        {isCredit ? '+' : '−'}
        {formatMoney(tx.amountMinor, currency)}
      </p>
    </button>
  )
}
