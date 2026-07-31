import { useState } from 'react'
import { Receipt } from 'lucide-react'
import { walletDataApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { TransactionRow } from '@/components/TransactionRow'
import { SpendingInsights } from './SpendingInsights'
import { cn } from '@/lib/utils'

type Tab = 'list' | 'insights'

export function ActivityScreen() {
  const wallet = useAsyncResource(walletDataApi.getWallet, [])
  const transactions = useAsyncResource(walletDataApi.getTransactions, [])
  const [tab, setTab] = useState<Tab>('list')

  return (
    <div className="phone-shell px-5 pt-6" style={{ paddingBottom: '7rem' }}>
      <h1 className="font-display text-xl font-bold tracking-tight">Activity</h1>
      <p className="mt-1 text-sm text-fg-muted">Every send, request and top-up on your wallet.</p>

      <div className="mt-4 flex gap-1 rounded-2xl bg-surface-raised p-1">
        {(['list', 'insights'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'tap-target flex-1 rounded-xl text-sm font-semibold capitalize transition-colors',
              tab === t ? 'bg-brand-500 text-white' : 'text-fg-muted',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {transactions.loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-line/60" />
            ))}
          </div>
        ) : transactions.error ? (
          <p className="text-sm font-medium text-rose-500">{transactions.error}</p>
        ) : tab === 'insights' ? (
          <SpendingInsights transactions={transactions.data ?? []} currency={wallet.data?.currency ?? 'INR'} />
        ) : transactions.data && transactions.data.length > 0 ? (
          <div className="rounded-2xl bg-surface-raised px-4 shadow-sm">
            {transactions.data.map((tx) => (
              <TransactionRow key={tx.entryId + tx.direction} tx={tx} currency={wallet.data?.currency ?? 'INR'} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-16 text-center shadow-sm">
            <Receipt className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg">No activity yet</p>
            <p className="text-xs text-fg-subtle">Every transaction you make will show up here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
