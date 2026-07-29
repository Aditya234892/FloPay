import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowDownLeft,
  CircleDollarSign,
  KeyRound,
  Percent,
  RefreshCw,
  Store,
  TrendingUp,
  Wallet,
  Webhook,
  XCircle,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SkeletonChart,
  SkeletonStatCard,
  StatCard,
} from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMoney, formatNumber, formatPercent } from '@/lib/format'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { useDashboardData } from './useDashboardData'
import { RevenueChart } from './RevenueChart'
import { MethodBreakdownCard } from './MethodBreakdownCard'
import { LiveActivityCard } from './LiveActivityCard'

const QUICK_ACTIONS = [
  {
    to: '/store',
    label: 'Open demo storefront',
    description: 'Run a payment end to end',
    icon: Store,
  },
  { to: '/dashboard/keys', label: 'Manage API keys', description: 'Issue or revoke credentials', icon: KeyRound },
  {
    to: '/dashboard/webhooks',
    label: 'Configure webhooks',
    description: 'Endpoint and delivery log',
    icon: Webhook,
  },
] as const

function QuickActions() {
  return (
    <Card staggered>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-hover/60"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15 ring-inset transition-transform group-hover:scale-105">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{action.label}</span>
                <span className="block truncate text-xs text-fg-subtle">{action.description}</span>
              </span>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function OverviewPage() {
  const { payments, refunds, metrics, methodBreakdown, revenueSeries, loading, error, refetch } =
    useDashboardData()

  const { currency } = metrics
  // Trailing daily volume, used as the sparkline on the revenue tiles.
  const spark = revenueSeries.map((point) => point.captured)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live view of volume, authorization health and settlement across your sandbox account."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            loading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-2xl bg-rose-500/10 px-4 py-3.5 text-sm text-rose-600 ring-1 ring-rose-500/25 ring-inset dark:text-rose-400"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Could not load dashboard data</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonStatCard key={index} />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
      ) : (
        <motion.div variants={staggerContainer(0.07)} initial="initial" animate="animate" className="space-y-5">
          {/* Primary metrics */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Today's revenue"
              value={metrics.todayVolume}
              format={(v) => formatMoney(v, currency)}
              icon={<TrendingUp />}
              caption="Captured since midnight"
              spark={spark.slice(-7)}
            />
            <StatCard
              label="Monthly revenue"
              value={metrics.monthVolume}
              format={(v) => formatMoney(v, currency)}
              icon={<CircleDollarSign />}
              caption="Month to date"
              spark={spark}
            />
            <StatCard
              label="Net volume"
              value={metrics.netVolume}
              format={(v) => formatMoney(v, currency)}
              icon={<Wallet />}
              caption="Captured less refunds"
            />
            <StatCard
              label="Settlement balance"
              value={metrics.settlementBalance}
              format={(v) => formatMoney(v, currency)}
              icon={<Wallet />}
              caption="Cleared past the T+2 hold"
            />
          </div>

          {/* Authorization health */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Transactions"
              value={metrics.totalPayments}
              format={formatNumber}
              icon={<Percent />}
              caption={`${metrics.capturedCount} captured`}
            />
            <StatCard
              label="Success rate"
              value={metrics.successRate}
              format={(v) => formatPercent(v)}
              icon={<TrendingUp />}
              caption="Captured of all attempts"
            />
            <StatCard
              label="Refund rate"
              value={metrics.refundRate}
              format={(v) => formatPercent(v)}
              icon={<ArrowDownLeft />}
              higherIsBetter={false}
              caption="Refunded of captured volume"
            />
            <StatCard
              label="Failed payments"
              value={metrics.failedCount}
              format={formatNumber}
              icon={<XCircle />}
              higherIsBetter={false}
              caption="Declined or errored"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <RevenueChart series={revenueSeries} currency={currency} />
            <MethodBreakdownCard breakdown={methodBreakdown} currency={currency} />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <LiveActivityCard payments={payments} refunds={refunds} currency={currency} />
            <motion.div variants={staggerItem} className="space-y-5">
              <QuickActions />
              <Card staggered className="p-5">
                <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                  Average order value
                </p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight tabular-nums">
                  {formatMoney(metrics.averageOrderValue, currency)}
                </p>
                <p className="mt-1 text-xs text-fg-subtle">
                  Across {metrics.capturedCount} captured{' '}
                  {metrics.capturedCount === 1 ? 'payment' : 'payments'}
                </p>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  )
}
