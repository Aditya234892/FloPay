import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/lib/utils'
import { maskSecret } from '@/lib/format'
import { useToast } from './toast'

export interface CopyFieldProps {
  label?: string
  value: string
  /** Mask the value until revealed — for secrets shown once. */
  secret?: boolean
  className?: string
}

/**
 * Read-only credential display with copy + optional reveal. Reports a real
 * failure if the clipboard is unavailable rather than faking success.
 */
export function CopyField({ label, value, secret = false, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(!secret)
  const toast = useToast()

  const handleCopy = async () => {
    const ok = await copyToClipboard(value)
    if (!ok) {
      toast.error('Could not copy', 'Your browser blocked clipboard access — select and copy manually.')
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <p className="mb-1.5 text-xs font-semibold tracking-wide text-fg-muted">{label}</p>
      )}
      <div className="flex items-center gap-1.5 rounded-xl border border-line bg-bg-elevated/70 py-2 pr-1.5 pl-3">
        <code className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] text-fg">
          {revealed ? value : maskSecret(value)}
        </code>

        {secret && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide value' : 'Reveal value'}
            className="shrink-0 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}

        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label ?? 'value'}`}
          className="relative shrink-0 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="done"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="block text-accent-500"
              >
                <Check className="h-3.5 w-3.5" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="block"
              >
                <Copy className="h-3.5 w-3.5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  )
}
