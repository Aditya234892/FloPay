import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_OUT_EXPO } from '@/lib/motion'

/**
 * FloPay's mark: a single integration point (the upright bar) with funds flowing
 * out across three rails, tinted along the brand ramp — blue → violet → emerald.
 * The "one in, many out" reading is the product promise; the fan shape is what
 * makes it legible at 20px, where a more literal wave turns to mush.
 */
export function FloMark({ className, animate = false }: { className?: string; animate?: boolean }) {
  const gradientId = 'flopay-mark-gradient'

  // Rails are ordered top → bottom; each draws slightly after the last so the
  // mark reads as flow rather than three unrelated strokes.
  const rails = [
    { d: 'M13 20 C20 20 22 12 31 12', stroke: 'var(--brand-500)' },
    { d: 'M13 20 H33', stroke: 'var(--violet-500)' },
    { d: 'M13 20 C20 20 22 28 31 28', stroke: 'var(--accent-500)' },
  ]

  return (
    <svg viewBox="0 0 40 40" className={cn('h-8 w-8', className)} aria-hidden role="presentation">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-500)" />
          <stop offset="55%" stopColor="var(--violet-500)" />
          <stop offset="100%" stopColor="var(--accent-500)" />
        </linearGradient>
      </defs>

      {/* the single integration point */}
      <motion.path
        d="M8 11 V29"
        stroke={`url(#${gradientId})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      />

      {rails.map((rail, index) => (
        <motion.path
          key={rail.d}
          d={rail.d}
          fill="none"
          stroke={rail.stroke}
          strokeWidth="2.6"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.55, delay: 0.25 + index * 0.09, ease: EASE_OUT_EXPO }}
        />
      ))}
    </svg>
  )
}

export interface LogoProps {
  className?: string
  /** Hide the wordmark, e.g. in a collapsed sidebar or a compact header. */
  markOnly?: boolean
  animate?: boolean
}

export function Logo({ className, markOnly = false, animate = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-fg', className)}>
      <FloMark animate={animate} className="h-7 w-7 shrink-0" />
      {!markOnly && (
        <span className="font-display text-[1.0625rem] leading-none tracking-tight">
          <span className="font-extrabold">Flo</span>
          <span className="font-semibold text-fg-muted">Pay</span>
        </span>
      )}
    </span>
  )
}
