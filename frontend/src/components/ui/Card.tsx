import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { staggerItem } from '@/lib/motion'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Lift and brighten on pointer hover. Off for dense/table cards. */
  interactive?: boolean
  /** Opaque instead of translucent — use when stacking cards over a chart. */
  solid?: boolean
  /** Participate in a parent's stagger sequence. */
  staggered?: boolean
  children?: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, solid = false, staggered = false, children, ...props },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      variants={staggered ? staggerItem : undefined}
      whileHover={interactive ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={cn(
        'sheen relative rounded-2xl shadow-soft',
        solid ? 'glass-strong' : 'glass',
        interactive && 'cursor-pointer transition-shadow duration-300 hover:shadow-float',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
})

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-3 sm:px-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  as: Tag = 'h3',
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }) {
  return (
    <Tag className={cn('font-display text-base font-semibold tracking-tight', className)} {...props}>
      {children}
    </Tag>
  )
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('mt-1 text-sm text-fg-muted', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 pb-5 sm:px-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:px-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
