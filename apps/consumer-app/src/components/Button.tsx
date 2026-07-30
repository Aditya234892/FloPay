import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Framer Motion redefines drag/animation handlers with its own signatures, so
 * those keys are dropped from the native attributes to avoid a structural
 * clash — same fix as gateway-web's Button.
 */
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragEnter' | 'onDragExit' | 'onDragLeave' | 'onDragOver' | 'onDrop'
  | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

export interface ButtonProps extends NativeButtonProps {
  variant?: 'primary' | 'ghost' | 'danger'
  loading?: boolean
}

/** Full-width, large tap target by default — this is a phone app, not a desktop dashboard. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', loading = false, disabled, children, ...props },
  ref,
) {
  const variants = {
    primary: 'bg-brand-500 text-white active:bg-brand-600',
    ghost: 'bg-transparent text-fg-muted active:bg-line',
    danger: 'bg-rose-500 text-white active:bg-rose-600',
  }

  return (
    <motion.button
      ref={ref}
      type={props.type ?? 'button'}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      className={cn(
        'tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold',
        'transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  )
})
