import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Copy, LogOut, Plus, Receipt, Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FloMark } from '@/components/FloMark'
import { Button } from '@/components/Button'
import { useAuth } from '@/auth/AuthContext'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { walletDataApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { formatMoney, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { WalletTransaction } from '@flopay/api-types'

/** Demo top-up amount — one tap, no amount picker, since this is scaffolding for testing. */
const TOPUP_AMOUNT_MINOR = 100_000

function humanizeKind(kind: string): string {
  const lower = kind.toLowerCase().replace(/_/g, ' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/**
 * A transfer's most useful label is who it was with; a top-up has no personal
 * counterparty, so it falls back to the entry kind.
 */
function transactionLabel(tx: WalletTransaction): string {
  return tx.counterpartyName ?? tx.counterpartyVpa ?? humanizeKind(tx.kind)
}

function TransactionRow({ tx, currency }: { tx: WalletTransaction; currency: string }) {
  const isCredit = tx.direction === 'CREDIT'
  return (
    <div className="flex items-center gap-3 border-b border-line px-1 py-3.5 last:border-0">
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
        <p className="truncate text-xs text-fg-subtle">
          {tx.note ? tx.note : formatRelative(tx.createdAt)}
        </p>
      </div>
      <p className={cn('shrink-0 text-sm font-semibold tabular-nums', isCredit ? 'text-accent-600' : 'text-fg')}>
        {isCredit ? '+' : '−'}
        {formatMoney(tx.amountMinor, currency)}
      </p>
    </div>
  )
}

export function HomeScreen() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const wallet = useAsyncResource(walletDataApi.getWallet, [])
  const transactions = useAsyncResource(walletDataApi.getTransactions, [])
  const [copied, setCopied] = useState(false)
  const [toppingUp, setToppingUp] = useState(false)
  const [topUpError, setTopUpError] = useState<string | null>(null)

  const handleCopyVpa = async () => {
    if (!session) return
    try {
      await navigator.clipboard.writeText(session.vpa)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (permissions, insecure context) — the VPA is
      // still visible on screen, so this isn't a broken flow.
    }
  }

  const handleTopUp = async () => {
    setToppingUp(true)
    setTopUpError(null)
    try {
      await walletDataApi.topUp(TOPUP_AMOUNT_MINOR)
      await Promise.all([wallet.refetch(), transactions.refetch()])
    } catch (err) {
      setTopUpError(extractErrorMessage(err))
    } finally {
      setToppingUp(false)
    }
  }

  return (
    <div className="phone-shell">
      <header className="flex items-center justify-between px-5 pt-5">
        <span className="inline-flex items-center gap-2">
          <FloMark className="h-7 w-7" />
          <span className="font-display text-sm font-bold">FloPay</span>
        </span>
        <button
          type="button"
          onClick={logout}
          aria-label="Log out"
          className="tap-target grid w-11 place-items-center rounded-xl text-fg-muted active:bg-line"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-5 mt-4 rounded-3xl bg-surface-raised p-6 shadow-sm"
      >
        <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">Balance</p>
        {wallet.loading ? (
          <div className="mt-2 h-10 w-40 animate-pulse rounded-lg bg-line" />
        ) : wallet.error ? (
          <p className="mt-2 text-sm font-medium text-rose-500">{wallet.error}</p>
        ) : (
          <p className="mt-1 font-display text-4xl font-extrabold tracking-tight tabular-nums">
            {formatMoney(wallet.data?.balanceMinor ?? 0, wallet.data?.currency ?? 'INR')}
          </p>
        )}

        <button
          type="button"
          onClick={handleCopyVpa}
          className="tap-target mt-4 inline-flex items-center gap-1.5 rounded-xl bg-line/60 px-3 text-sm font-medium text-fg-muted"
        >
          <span className="font-mono">{session?.vpa}</span>
          <Copy className="h-3.5 w-3.5" />
          {copied && <span className="text-accent-600">Copied</span>}
        </button>
      </motion.div>

      <div className="mt-5 flex gap-3 px-5">
        <Button onClick={() => navigate('/send')}>
          <Send className="h-4 w-4" />
          Send
        </Button>
        <Button variant="ghost" onClick={handleTopUp} loading={toppingUp} className="border border-line">
          {!toppingUp && <Plus className="h-4 w-4" />}
          Add money
        </Button>
      </div>
      {topUpError && (
        <p role="alert" className="mt-2 px-5 text-sm font-medium text-rose-500">
          {topUpError}
        </p>
      )}
      <p className="mt-2 px-5 text-center text-[0.6875rem] text-fg-subtle">
        Demo mode — "Add money" mints sandbox funds. No real money exists here.
      </p>

      <div className="mt-6 flex-1 px-5 pb-8">
        <h2 className="mb-2 text-sm font-semibold text-fg">Activity</h2>

        {transactions.loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-line/60" />
            ))}
          </div>
        ) : transactions.error ? (
          <p className="text-sm font-medium text-rose-500">{transactions.error}</p>
        ) : transactions.data && transactions.data.length > 0 ? (
          <div className="rounded-2xl bg-surface-raised px-4 shadow-sm">
            {transactions.data.map((tx) => (
              <TransactionRow key={tx.entryId + tx.direction} tx={tx} currency={wallet.data?.currency ?? 'INR'} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-12 text-center shadow-sm">
            <Receipt className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg">No activity yet</p>
            <p className="text-xs text-fg-subtle">Add some demo money, then send it to another FloPay VPA.</p>
          </div>
        )}
      </div>
    </div>
  )
}
