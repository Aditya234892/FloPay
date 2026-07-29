import { motion } from 'framer-motion'
import { Banknote, CreditCard, Landmark } from 'lucide-react'
import type { ComponentType } from 'react'
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import { formatMoney, formatPercent } from '@/lib/format'
import { EASE_OUT_EXPO } from '@/lib/motion'
import type { PaymentMethod } from '@/api/types'
import type { MethodBreakdown } from './useDashboardData'

const METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: ComponentType<{ className?: string }>; color: string }
> = {
  CARD: { label: 'Cards', icon: CreditCard, color: 'var(--brand-500)' },
  UPI: { label: 'UPI', icon: Banknote, color: 'var(--violet-500)' },
  NETBANKING: { label: 'Netbanking', icon: Landmark, color: 'var(--accent-500)' },
}

export function MethodBreakdownCard({
  breakdown,
  currency,
}: {
  breakdown: readonly MethodBreakdown[]
  currency: string
}) {
  const totalVolume = breakdown.reduce((sum, entry) => sum + entry.volume, 0)

  return (
    <Card staggered>
      <CardHeader>
        <div>
          <CardTitle>Payment methods</CardTitle>
          <p className="mt-1 text-xs text-fg-subtle">Share of captured volume by instrument</p>
        </div>
      </CardHeader>

      <CardContent>
        {breakdown.length === 0 ? (
          <EmptyState
            inline
            icon={<CreditCard />}
            title="No payments yet"
            description="Method analytics appear after the first attempt."
          />
        ) : (
          <div className="space-y-4">
            {breakdown.map((entry, index) => {
              const meta = METHOD_META[entry.method]
              const Icon = meta.icon
              const share = totalVolume > 0 ? (entry.volume / totalVolume) * 100 : 0

              return (
                <div key={entry.method}>
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                      style={{ background: `${meta.color}1f`, color: meta.color }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-medium text-fg">{meta.label}</span>
                    <span className="ml-auto text-sm font-semibold tabular-nums">
                      {formatMoney(entry.volume, currency)}
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.9, delay: 0.1 + index * 0.1, ease: EASE_OUT_EXPO }}
                      className="h-full rounded-full"
                      style={{ background: meta.color }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[0.6875rem] text-fg-subtle">
                    <span>
                      {entry.count} {entry.count === 1 ? 'attempt' : 'attempts'} ·{' '}
                      {formatPercent(entry.successRate, 0)} success
                    </span>
                    <span className="tabular-nums">{formatPercent(share, 0)} of volume</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
