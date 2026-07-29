import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card } from './Card'
import { AnimatedCounter } from './AnimatedCounter'
import { cn } from '@/lib/utils'
import { formatPercent } from '@/lib/format'

export type TrendDirection = 'up' | 'down' | 'flat'

export interface StatCardProps {
  label: string
  value: number
  /** Formats the counted value — pass `formatMoney`, `formatPercent`, etc. */
  format?: (value: number) => string
  icon?: ReactNode
  /** Percentage change vs. the comparison window. */
  deltaPercent?: number
  /** Whether a rising number is good. Refund rate, for instance, inverts this. */
  higherIsBetter?: boolean
  caption?: string
  /** Sparkline values, rendered as a bare inline area. */
  spark?: readonly number[]
  className?: string
}

function direction(delta: number | undefined): TrendDirection {
  if (delta === undefined || Math.abs(delta) < 0.05) return 'flat'
  return delta > 0 ? 'up' : 'down'
}

function Sparkline({ values, positive }: { values: readonly number[]; positive: boolean }) {
  if (values.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100
    const y = 28 - ((value - min) / range) * 24
    return `${x},${y}`
  })
  const stroke = positive ? 'var(--accent-500)' : 'var(--brand-500)'

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="mt-3 h-8 w-full overflow-visible"
      aria-hidden
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function StatCard({
  label,
  value,
  format,
  icon,
  deltaPercent,
  higherIsBetter = true,
  caption,
  spark,
  className,
}: StatCardProps) {
  const trend = direction(deltaPercent)
  const isGood = trend === 'flat' ? null : (trend === 'up') === higherIsBetter
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus

  return (
    <Card staggered interactive className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">{label}</p>
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15 ring-inset [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3 font-display text-[1.75rem] leading-none font-bold tracking-tight">
        <AnimatedCounter value={value} format={format} />
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-xs">
        {deltaPercent !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold',
              isGood === null && 'bg-slate-500/10 text-fg-subtle',
              isGood === true && 'bg-accent-500/12 text-accent-600 dark:text-accent-400',
              isGood === false && 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
            )}
          >
            <TrendIcon className="h-3 w-3" aria-hidden />
            {formatPercent(Math.abs(deltaPercent))}
          </span>
        )}
        {caption && <span className="truncate text-fg-subtle">{caption}</span>}
      </div>

      {spark && <Sparkline values={spark} positive={isGood !== false} />}
    </Card>
  )
}
