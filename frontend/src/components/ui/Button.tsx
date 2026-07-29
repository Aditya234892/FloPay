import { forwardRef, useCallback, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<ButtonVariant, string> = {
  // Gradient is oversized and shifted on hover, which reads as a slow sheen.
  primary:
    'text-white gradient-brand bg-[length:200%_100%] bg-left hover:bg-right shadow-soft hover:shadow-lifted transition-[background-position,box-shadow] duration-500',
  secondary:
    'bg-surface-solid text-fg border border-line hover:border-line-strong hover:bg-surface-hover shadow-soft hover:shadow-lifted',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface-hover',
  outline: 'border border-brand-500/40 text-brand-500 hover:bg-brand-500/10 hover:border-brand-500',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-soft hover:shadow-lifted',
  success: 'bg-accent-500 text-white hover:bg-accent-600 shadow-soft hover:shadow-lifted',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[0.95rem] gap-2.5 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
}

interface Ripple {
  id: number
  x: number
  y: number
}

/**
 * Framer Motion redefines the drag and animation handlers with its own
 * signatures, so those keys are dropped from the native button attributes to
 * avoid a structural clash.
 */
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onDragEnter'
  | 'onDragExit'
  | 'onDragLeave'
  | 'onDragOver'
  | 'onDrop'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
>

export interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Rendered before the label; hidden while loading. */
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    children,
    disabled,
    onClick,
    ...props
  },
  ref,
) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const isDisabled = disabled || loading

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const ripple: Ripple = {
        id: Date.now() + Math.random(),
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      setRipples((current) => [...current, ripple])
      // Match the ripple's own animation duration so the node is cleaned up
      // instead of accumulating for the life of the button.
      window.setTimeout(
        () => setRipples((current) => current.filter((r) => r.id !== ripple.id)),
        600,
      )
      onClick?.(event)
    },
    [onClick],
  )

  return (
    <motion.button
      ref={ref}
      type={props.type ?? 'button'}
      disabled={isDisabled}
      onClick={handleClick}
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
      className={cn(
        'relative isolate inline-flex select-none items-center justify-center overflow-hidden font-medium',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          aria-hidden
          initial={{ opacity: 0.5, scale: 0 }}
          animate={{ opacity: 0, scale: 4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ left: ripple.x, top: ripple.y }}
          className="pointer-events-none absolute -z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35"
        />
      ))}

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="inline-flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {size !== 'icon' && children}
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-[inherit]"
          >
            {leftIcon}
            {children}
            {rightIcon}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
})
