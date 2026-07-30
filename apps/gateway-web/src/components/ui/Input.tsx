import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  /** Validation message; presence switches the field into its error state. */
  error?: string
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  /** Adds a show/hide toggle. Overrides `type`. */
  password?: boolean
  mono?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, leftIcon, rightSlot, password, mono, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  const [revealed, setRevealed] = useState(false)

  const type = password ? (revealed ? 'text' : 'password') : props.type

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-fg-muted"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle [&>svg]:h-4 [&>svg]:w-4">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
          type={type}
          className={cn(
            'h-11 w-full rounded-xl border bg-bg-elevated/70 px-3.5 text-sm text-fg',
            'placeholder:text-fg-subtle',
            'transition-[border-color,box-shadow,background-color] duration-200',
            'focus:outline-none focus:ring-4',
            error
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-line hover:border-line-strong focus:border-brand-500 focus:ring-brand-500/15',
            leftIcon && 'pl-9',
            (rightSlot || password) && 'pr-11',
            mono && 'font-mono text-[0.8125rem]',
            className,
          )}
        />

        {password ? (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Hide value' : 'Show value'}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : (
          rightSlot && (
            <span className="absolute top-1/2 right-2 -translate-y-1/2">{rightSlot}</span>
          )
        )}
      </div>

      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-fg-subtle">
          {hint}
        </p>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            id={`${inputId}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 flex items-center gap-1.5 overflow-hidden text-xs font-medium text-rose-500"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
})

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, id, children, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-fg-muted"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-11 w-full appearance-none rounded-xl border bg-bg-elevated/70 px-3.5 text-sm text-fg',
          'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")] bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat pr-10',
          'transition-colors duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none',
          error ? 'border-rose-500/60' : 'border-line hover:border-line-strong',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rose-500">
          {error}
        </p>
      )}
    </div>
  )
})
