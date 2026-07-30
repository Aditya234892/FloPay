import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, Tabs } from '@/components/ui'
import { formatMoney, formatMoneyCompact } from '@/lib/format'
import type { RevenuePoint } from './useDashboardData'

type Range = '7d' | '14d'

const RANGE_ITEMS = [
  { value: '7d' as const, label: '7 days' },
  { value: '14d' as const, label: '14 days' },
]

/**
 * Recharts injects `active`/`payload`/`label` into whatever element is passed to
 * `content`, so those are typed as optional here rather than borrowing
 * `TooltipProps` — its shape shifts between recharts majors.
 */
interface TooltipEntry {
  name?: string | number
  value?: number
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: string | number
  currency: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="glass-strong rounded-xl px-3 py-2.5 shadow-float">
      <p className="mb-1.5 text-[0.6875rem] font-semibold tracking-wide text-fg-subtle uppercase">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={String(entry.name)} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color }}
            aria-hidden
          />
          <span className="text-fg-muted capitalize">{entry.name}</span>
          <span className="ml-auto font-semibold text-fg tabular-nums">
            {formatMoney(entry.value ?? 0, currency)}
          </span>
        </div>
      ))}
    </div>
  )
}

export interface RevenueChartProps {
  series: readonly RevenuePoint[]
  currency: string
}

/**
 * Captured-vs-refunded volume over time. Uses a gradient area so the shape reads
 * at a glance, with the refund series stacked beneath as a muted counterweight.
 */
export function RevenueChart({ series, currency }: RevenueChartProps) {
  const [range, setRange] = useState<Range>('14d')

  const data = useMemo(
    () => (range === '7d' ? series.slice(-7) : series),
    [series, range],
  )

  const total = useMemo(() => data.reduce((sum, point) => sum + point.captured, 0), [data])
  const hasVolume = total > 0

  return (
    <Card staggered className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Revenue</CardTitle>
          <p className="mt-1 font-display text-xl font-bold tracking-tight tabular-nums">
            {formatMoney(total, currency)}
          </p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            Captured volume over the last {range === '7d' ? '7' : '14'} days
          </p>
        </div>
        <Tabs items={RANGE_ITEMS} value={range} onChange={setRange} />
      </CardHeader>

      <CardContent className="px-2 sm:px-3">
        <div className="h-[15rem] w-full">
          {hasVolume ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...data]} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="capturedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-500)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-500)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="refundedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--violet-500)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--violet-500)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--fg-subtle)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--fg-subtle)' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(value: number) => formatMoneyCompact(value, currency)}
                />
                <Tooltip
                  content={<ChartTooltip currency={currency} />}
                  cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
                />

                <Area
                  type="monotone"
                  dataKey="captured"
                  name="captured"
                  stroke="var(--brand-500)"
                  strokeWidth={2}
                  fill="url(#capturedFill)"
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="refunded"
                  name="refunded"
                  stroke="var(--violet-500)"
                  strokeWidth={1.75}
                  strokeDasharray="4 3"
                  fill="url(#refundedFill)"
                  animationDuration={900}
                  animationBegin={150}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
              <p className="text-sm font-semibold text-fg">No revenue yet</p>
              <p className="max-w-xs text-xs text-fg-muted">
                Complete a payment in the demo storefront and it will appear here within seconds.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
