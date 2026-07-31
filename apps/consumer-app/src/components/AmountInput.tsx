import { cn } from '@/lib/utils'

export interface AmountInputProps {
  /** Raw text, not a number — an empty field and "0" are different states. */
  value: string
  onChange: (value: string) => void
  error?: boolean
  autoFocus?: boolean
}

/**
 * Rupee amount entry. Holds a string rather than a number so the field can be
 * genuinely empty, and so a trailing decimal point mid-typing ("12.") doesn't
 * get normalised away underneath the user.
 */
export function AmountInput({ value, onChange, error, autoFocus }: AmountInputProps) {
  const handleChange = (raw: string) => {
    // Digits and at most one decimal point, max two decimal places.
    if (raw === '') return onChange('')
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return
    onChange(raw)
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <span className={cn('text-3xl font-semibold', value ? 'text-fg' : 'text-fg-subtle')}>₹</span>
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Amount in rupees"
        className={cn(
          'w-full max-w-[12rem] bg-transparent text-center font-display text-5xl font-extrabold outline-none',
          'placeholder:text-fg-subtle',
          error ? 'text-rose-500' : 'text-fg',
        )}
      />
    </div>
  )
}
