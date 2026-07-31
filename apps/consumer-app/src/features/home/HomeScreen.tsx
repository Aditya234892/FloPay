import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, ChevronRight, Gift, HandCoins, Plus, QrCode, ScanLine, Search, Send } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { notificationApi, rewardsApi, walletDataApi } from '@/api/endpoints'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { TransactionRow } from '@/components/TransactionRow'
import { formatMoney } from '@/lib/format'
import { recentPeopleFrom } from '@/lib/recentPeople'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const ACTIONS = [
  { to: '/send', label: 'Send', icon: Send },
  { to: '/scan', label: 'Scan', icon: ScanLine },
  { to: '/receive', label: 'Receive', icon: QrCode },
  { to: '/request', label: 'Request', icon: HandCoins },
]

export function HomeScreen() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const wallet = useAsyncResource(walletDataApi.getWallet, [])
  const transactions = useAsyncResource(walletDataApi.getTransactions, [])
  const unreadNotifications = useAsyncResource(notificationApi.unreadCount, [])
  const rewards = useAsyncResource(rewardsApi.balance, [])
  const [query, setQuery] = useState('')

  const recentPeople = useMemo(() => recentPeopleFrom(transactions.data ?? []), [transactions.data])

  const filteredTransactions = useMemo(() => {
    const all = transactions.data ?? []
    if (!query.trim()) return all.slice(0, 5)
    const needle = query.trim().toLowerCase()
    return all.filter(
      (tx) =>
        (tx.counterpartyName ?? '').toLowerCase().includes(needle) ||
        (tx.counterpartyVpa ?? '').toLowerCase().includes(needle) ||
        (tx.note ?? '').toLowerCase().includes(needle),
    )
  }, [transactions.data, query])

  const monthSpend = useMemo(() => {
    const now = new Date()
    return (transactions.data ?? [])
      .filter(
        (tx) =>
          tx.direction === 'DEBIT' &&
          new Date(tx.createdAt).getMonth() === now.getMonth() &&
          new Date(tx.createdAt).getFullYear() === now.getFullYear(),
      )
      .reduce((sum, tx) => sum + tx.amountMinor, 0)
  }, [transactions.data])

  return (
    <div className="phone-shell px-5 pt-5" style={{ paddingBottom: '7rem' }}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex min-w-0 items-center gap-3"
        >
          <span className="tap-target grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-secondary-500 font-display text-base font-bold text-white">
            {(session?.displayName ?? session?.vpa ?? '?').charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 text-left">
            <p className="text-xs text-fg-subtle">{greeting()}</p>
            <p className="truncate text-sm font-semibold text-fg">{session?.displayName ?? 'FloPay user'}</p>
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
          className="tap-target relative grid h-11 w-11 place-items-center rounded-full text-fg-muted active:bg-line"
        >
          <Bell className="h-5 w-5" />
          {!!unreadNotifications.data && unreadNotifications.data > 0 && (
            <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[0.625rem] font-bold text-white">
              {unreadNotifications.data}
            </span>
          )}
        </button>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, notes…"
          className="tap-target w-full rounded-2xl bg-surface-raised pr-4 pl-10 text-sm text-fg shadow-sm outline-none placeholder:text-fg-subtle focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-secondary-500 p-6 text-white shadow-xl shadow-brand-500/25"
      >
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 -left-6 h-32 w-32 rounded-full bg-white/10" />

        <p className="text-xs font-semibold tracking-wide text-white/75 uppercase">Wallet balance</p>
        {wallet.loading ? (
          <div className="mt-2 h-10 w-40 animate-pulse rounded-lg bg-white/20" />
        ) : wallet.error ? (
          <p className="mt-2 text-sm font-medium text-white">{wallet.error}</p>
        ) : (
          <p className="mt-1 font-display text-4xl font-extrabold tracking-tight tabular-nums">
            <AnimatedCounter
              value={wallet.data?.balanceMinor ?? 0}
              format={(v) => formatMoney(v, wallet.data?.currency ?? 'INR')}
            />
          </p>
        )}

        <span className="tap-target mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 text-xs font-medium text-white backdrop-blur-sm">
          <span className="font-mono">{session?.vpa}</span>
        </span>

        <button
          type="button"
          onClick={() => navigate('/topup')}
          className="tap-target mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-bold text-brand-600 active:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          Add money
        </button>
      </motion.div>

      {(monthSpend > 0 || !!rewards.data?.balanceMinor) && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {monthSpend > 0 && (
            <div className="rounded-2xl bg-surface-raised px-4 py-3 shadow-sm">
              <p className="text-xs text-fg-subtle">Spent this month</p>
              <p className="mt-0.5 text-sm font-semibold text-fg tabular-nums">{formatMoney(monthSpend)}</p>
            </div>
          )}
          {!!rewards.data?.balanceMinor && (
            <button
              type="button"
              onClick={() => navigate('/rewards')}
              className="rounded-2xl bg-surface-raised px-4 py-3 text-left shadow-sm active:bg-line/40"
            >
              <p className="flex items-center gap-1 text-xs text-fg-subtle">
                <Gift className="h-3 w-3" /> Cashback
              </p>
              <p className="mt-0.5 text-sm font-semibold text-amber-600 tabular-nums">
                {formatMoney(rewards.data.balanceMinor)}
              </p>
            </button>
          )}
        </div>
      )}

      <div className="mt-5 grid grid-cols-4 gap-2.5">
        {ACTIONS.map(({ to, label, icon: Icon }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className="tap-target flex flex-col items-center gap-1.5 rounded-2xl bg-surface-raised py-3.5 shadow-sm active:bg-line/40"
          >
            <Icon className="h-5 w-5 text-brand-500" />
            <span className="text-[0.6875rem] font-medium text-fg-muted">{label}</span>
          </button>
        ))}
      </div>

      {recentPeople.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2.5 text-sm font-semibold text-fg">Recent people</h2>
          <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-1">
            {recentPeople.map((person) => (
              <button
                key={person.vpa}
                type="button"
                onClick={() => navigate('/send', { state: { toVpa: person.vpa, toName: person.name } })}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-line/70 font-display text-sm font-bold text-fg">
                  {person.name.charAt(0).toUpperCase()}
                </span>
                <span className="w-full truncate text-center text-[0.6875rem] text-fg-muted">
                  {person.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">{query.trim() ? 'Search results' : 'Recent activity'}</h2>
          {!query.trim() && (transactions.data?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => navigate('/activity')}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-500"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {transactions.loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-line/60" />
            ))}
          </div>
        ) : transactions.error ? (
          <p className="text-sm font-medium text-rose-500">{transactions.error}</p>
        ) : filteredTransactions.length > 0 ? (
          <div className="rounded-2xl bg-surface-raised px-4 shadow-sm">
            {filteredTransactions.map((tx) => (
              <TransactionRow key={tx.entryId + tx.direction} tx={tx} currency={wallet.data?.currency ?? 'INR'} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-12 text-center shadow-sm">
            <p className="text-sm font-medium text-fg">{query.trim() ? 'No matches' : 'No activity yet'}</p>
            {!query.trim() && (
              <p className="text-xs text-fg-subtle">Add some demo money, then send it to another FloPay VPA.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
