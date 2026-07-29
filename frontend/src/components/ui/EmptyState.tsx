import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_OUT_EXPO } from '@/lib/motion'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  /** Compact variant for use inside a table body. */
  inline?: boolean
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  inline = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        inline ? 'gap-2 px-6 py-10' : 'gap-3 px-6 py-16',
        className,
      )}
    >
      {icon && (
        <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20 ring-inset [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      )}
      <p className="font-display text-sm font-semibold text-fg">{title}</p>
      {description && <p className="max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}
