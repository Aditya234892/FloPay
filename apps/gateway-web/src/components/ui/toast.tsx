import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toastVariants } from '@/lib/motion'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** Milliseconds before auto-dismiss; 0 keeps it until dismissed. */
  durationMs?: number
}

interface ToastRecord extends Required<Omit<ToastOptions, 'description'>> {
  id: string
  description?: string
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_STYLES: Record<ToastTone, { ring: string; icon: ReactNode }> = {
  success: {
    ring: 'ring-accent-500/25',
    icon: <CheckCircle2 className="h-4.5 w-4.5 text-accent-500" />,
  },
  error: { ring: 'ring-rose-500/25', icon: <XCircle className="h-4.5 w-4.5 text-rose-500" /> },
  warning: {
    ring: 'ring-amber-500/25',
    icon: <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />,
  },
  info: { ring: 'ring-brand-500/25', icon: <Info className="h-4.5 w-4.5 text-brand-500" /> },
}

const MAX_VISIBLE = 4

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    ({ title, description, tone = 'info', durationMs = 5000 }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setToasts((current) => [...current, { id, title, description, tone, durationMs }].slice(-MAX_VISIBLE))

      if (durationMs > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), durationMs),
        )
      }
      return id
    },
    [dismiss],
  )

  const success = useCallback(
    (title: string, description?: string) => toast({ title, description, tone: 'success' }),
    [toast],
  )
  const error = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, tone: 'error', durationMs: 7000 }),
    [toast],
  )

  const value = useMemo<ToastContextValue>(
    () => ({ toast, success, error, dismiss }),
    [toast, success, error, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="false"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-200 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  variants={toastVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={cn(
                    'glass-strong sheen pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3.5',
                    'shadow-float ring-1 ring-inset',
                    TONE_STYLES[item.tone].ring,
                  )}
                >
                  <span className="mt-0.5 shrink-0">{TONE_STYLES[item.tone].icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-fg">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 text-xs break-words text-fg-muted">{item.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(item.id)}
                    aria-label="Dismiss notification"
                    className="-mt-0.5 -mr-1 shrink-0 rounded-lg p-1 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
