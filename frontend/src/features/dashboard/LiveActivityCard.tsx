import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowDownLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import { formatMoney, formatRelative } from '@/lib/format'
import type { PaymentWithRefunds, RefundResponse } from '@/api/types'

type ActivityKind = 'captured' | 'failed' | 'refunded'

interface ActivityEntry {
  id: string
  kind: ActivityKind
  amount: number
  reference: string
  createdAt: string
  detail?: string
}

const KIND_META: Record<ActivityKind, { icon: typeof CheckCircle2; className: string; label: string }> = {
  captured: {
    icon: CheckCircle2,
    className: 'bg-accent-500/12 text-accent-600 dark:text-accent-400',
    label: 'Captured',
  },
  failed: { icon: XCircle, className: 'bg-rose-500/12 text-rose-500', label: 'Failed' },
  refunded: { icon: ArrowDownLeft, className: 'bg-violet-500/12 text-violet-500', label: 'Refunded' },
}

/**
 * Merged, reverse-chronological feed of payment and refund events — the closest
 * thing to a live tail without a websocket on the backend.
 */
export function LiveActivityCard({
  payments,
  refunds,
  currency,
  limit = 7,
}: {
  payments: readonly PaymentWithRefunds[]
  refunds: readonly RefundResponse[]
  currency: string
  limit?: number
}) {
  const entries = useMemo<ActivityEntry[]>(() => {
    const paymentEntries: ActivityEntry[] = payments
      .filter((payment) => payment.status !== 'CREATED')
      .map((payment) => ({
        id: `pay-${payment.id}`,
        kind: payment.status === 'FAILED' ? 'failed' : 'captured',
        amount: payment.amount,
        reference: payment.id,
        createdAt: payment.createdAt,
        detail: payment.failureReason ?? payment.method,
      }))

    const refundEntries: ActivityEntry[] = refunds.map((refund) => ({
      id: `rfnd-${refund.id}`,
      kind: 'refunded',
      amount: refund.amount,
      reference: refund.paymentId,
      createdAt: refund.createdAt,
    }))

    return [...paymentEntries, ...refundEntries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }, [payments, refunds, limit])

  return (
    <Card staggered>
      <CardHeader>
        <div>
          <CardTitle>Live activity</CardTitle>
          <p className="mt-1 text-xs text-fg-subtle">Newest payment and refund events</p>
        </div>
        {entries.length > 0 && (
          <Badge tone="success" pulse>
            Live
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <EmptyState
            inline
            icon={<Activity />}
            title="No activity yet"
            description="Events stream in as payments are attempted."
          />
        ) : (
          <ul className="-mx-1 space-y-0.5">
            <AnimatePresence initial={false}>
              {entries.map((entry) => {
                const meta = KIND_META[entry.kind]
                const Icon = meta.icon
                return (
                  <motion.li
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-surface-hover/50"
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${meta.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-fg">
                        {meta.label}
                        <span className="ml-1.5 font-mono text-[0.6875rem] text-fg-subtle">
                          {entry.reference}
                        </span>
                      </p>
                      {entry.detail && (
                        <p className="truncate text-[0.6875rem] text-fg-subtle capitalize">
                          {entry.detail.toLowerCase()}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold tabular-nums">
                        {formatMoney(entry.amount, currency)}
                      </p>
                      <p className="text-[0.625rem] text-fg-subtle">
                        {formatRelative(entry.createdAt)}
                      </p>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
