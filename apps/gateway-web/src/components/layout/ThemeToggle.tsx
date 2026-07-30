import { motion } from 'framer-motion'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider'
import { cn } from '@/lib/utils'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

/** Three-way theme control — explicit light/dark plus "follow the OS". */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-hover/40 p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              'relative grid h-7 w-7 place-items-center rounded-lg transition-colors duration-200',
              active ? 'text-fg' : 'text-fg-subtle hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-toggle-indicator"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 -z-10 rounded-lg bg-bg-elevated shadow-soft ring-1 ring-line ring-inset"
              />
            )}
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}
