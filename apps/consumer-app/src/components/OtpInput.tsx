import { useRef } from 'react'
import { cn } from '@/lib/utils'

const LENGTH = 6

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: boolean
  autoFocus?: boolean
}

/**
 * Six single-digit boxes that behave as one field to the caller — `value` and
 * `onChange` carry the combined digit string, same as a plain text input.
 */
export function OtpInput({ value, onChange, onComplete, error, autoFocus }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(LENGTH, ' ').split('').slice(0, LENGTH)

  const setDigit = (index: number, digit: string) => {
    const next = value.split('')
    next[index] = digit
    const joined = next.join('').slice(0, LENGTH)
    onChange(joined)
    if (joined.length === LENGTH && !joined.includes(' ')) onComplete?.(joined)
  }

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    setDigit(index, digit)
    if (digit && index < LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH)
    if (!pasted) return
    event.preventDefault()
    onChange(pasted.padEnd(LENGTH, '').trimEnd())
    if (pasted.length === LENGTH) onComplete?.(pasted)
    inputRefs.current[Math.min(pasted.length, LENGTH - 1)]?.focus()
  }

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          autoFocus={autoFocus && index === 0}
          value={digit.trim()}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
          className={cn(
            'h-14 w-11 rounded-xl border bg-surface text-center text-xl font-semibold text-fg',
            'focus:outline-none focus:ring-4',
            error
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-line focus:border-brand-500 focus:ring-brand-500/15',
          )}
        />
      ))}
    </div>
  )
}
