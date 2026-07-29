import { useId, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
  /** Small trailing count, e.g. number of rows behind the tab. */
  count?: number
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  /** Stretch tabs to fill the container — used inside the checkout widget. */
  fill?: boolean
}

/**
 * Segmented control with a shared layout indicator that slides between tabs
 * rather than cross-fading, which reads as one continuous object.
 */
export function Tabs<T extends string>({ items, value, onChange, className, fill }: TabsProps<T>) {
  const layoutId = useId()

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-line bg-surface-hover/40 p-1',
        fill && 'flex w-full',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5',
              'text-xs font-semibold whitespace-nowrap transition-colors duration-200',
              fill && 'flex-1',
              active ? 'text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 -z-10 rounded-lg bg-bg-elevated shadow-soft ring-1 ring-line ring-inset"
              />
            )}
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'ml-0.5 rounded-md px-1.5 py-0.5 text-[0.625rem] tabular-nums',
                  active ? 'bg-brand-500/15 text-brand-500' : 'bg-slate-500/12 text-fg-subtle',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
