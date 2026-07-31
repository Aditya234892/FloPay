import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import type { WalletTransaction } from '@flopay/api-types'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function lastSixMonths(transactions: WalletTransaction[]) {
  const now = new Date()
  const buckets: { key: string; label: string; sent: number; received: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()] ?? '', sent: 0, received: 0 })
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]))

  for (const tx of transactions) {
    const d = new Date(tx.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = byKey.get(key)
    if (!bucket) continue
    if (tx.direction === 'DEBIT') bucket.sent += tx.amountMinor
    else bucket.received += tx.amountMinor
  }
  return buckets
}

export function SpendingInsights({ transactions, currency }: { transactions: WalletTransaction[]; currency: string }) {
  const monthly = useMemo(() => lastSixMonths(transactions), [transactions])

  const { totalSent, totalReceived } = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.direction === 'DEBIT') acc.totalSent += tx.amountMinor
        else acc.totalReceived += tx.amountMinor
        return acc
      },
      { totalSent: 0, totalReceived: 0 },
    )
  }, [transactions])

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-fg">Nothing to show yet</p>
        <p className="text-xs text-fg-subtle">Insights appear once you've made a few transactions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-raised p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" /> Sent
          </p>
          <p className="mt-1 text-lg font-bold text-fg tabular-nums">{formatMoney(totalSent, currency)}</p>
        </div>
        <div className="rounded-2xl bg-surface-raised p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs text-fg-subtle">
            <ArrowDownLeft className="h-3.5 w-3.5 text-accent-600" /> Received
          </p>
          <p className="mt-1 text-lg font-bold text-fg tabular-nums">{formatMoney(totalReceived, currency)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-raised p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-fg">Last 6 months</p>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--fg-subtle)', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--fg-subtle)', fontSize: 11 }}
                tickFormatter={(v) => (v === 0 ? '0' : `₹${Math.round(v / 100)}`)}
                width={44}
              />
              <Tooltip
                cursor={{ fill: 'var(--line)' }}
                contentStyle={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value) => formatMoney(Number(value ?? 0), currency)}
              />
              <Bar dataKey="sent" name="Sent" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="received" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
