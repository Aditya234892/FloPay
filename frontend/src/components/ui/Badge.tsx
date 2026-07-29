import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { humanizeToken } from '@/lib/format'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-500/12 text-fg-muted ring-slate-500/20',
  brand: 'bg-brand-500/12 text-brand-500 ring-brand-500/25',
  success: 'bg-accent-500/12 text-accent-600 dark:text-accent-400 ring-accent-500/25',
  warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/25',
  danger: 'bg-rose-500/12 text-rose-600 dark:text-rose-400 ring-rose-500/25',
  info: 'bg-sky-500/12 text-sky-600 dark:text-sky-400 ring-sky-500/25',
  violet: 'bg-violet-500/12 text-violet-500 ring-violet-500/25',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  /** Pulsing dot — for live/among-transit states. */
  pulse?: boolean
  icon?: ReactNode
}

export function Badge({ className, tone = 'neutral', pulse, icon, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold',
        'ring-1 ring-inset whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {icon}
      {children}
    </span>
  )
}

/**
 * Domain status → tone mapping, kept in one place so a payment status renders
 * identically everywhere it appears.
 */
const STATUS_TONES: Record<string, BadgeTone> = {
  CAPTURED: 'success',
  PAID: 'success',
  PROCESSED: 'success',
  ACTIVE: 'success',
  SUCCEEDED: 'success',
  CREATED: 'neutral',
  PENDING: 'warning',
  ATTEMPTED: 'warning',
  AUTHORIZED: 'info',
  PARTIALLY_REFUNDED: 'warning',
  REFUNDED: 'violet',
  FAILED: 'danger',
  DECLINED: 'danger',
  REVOKED: 'danger',
  DISPUTED: 'danger',
}

export function StatusBadge({
  status,
  className,
  pulse,
}: {
  status: string
  className?: string
  pulse?: boolean
}) {
  const tone = STATUS_TONES[status] ?? 'neutral'
  const isLive = pulse ?? (status === 'ATTEMPTED' || status === 'PENDING')
  return (
    <Badge tone={tone} pulse={isLive} className={className}>
      {humanizeToken(status)}
    </Badge>
  )
}
