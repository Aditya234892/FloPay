import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, CreditCard, Landmark, Lock, ShieldCheck, X } from 'lucide-react'
import { Badge, Button, Input, Tabs } from '@/components/ui'
import { FloMark } from '@/components/brand/Logo'
import { formatMoney } from '@/lib/format'
import { dialogVariants } from '@/lib/motion'
import { createPaymentApiClient, extractErrorMessage } from '@/api/client'
import { paymentsApi } from '@/api/endpoints'
import type { OrderResponse, PaymentMethod, PaymentResponse } from '@/api/types'

/**
 * Test instruments mirror the backend's deterministic simulator, so the hints
 * shown here are always accurate rather than aspirational.
 */
const METHOD_CONFIG: Record<
  PaymentMethod,
  {
    label: string
    icon: typeof CreditCard
    field: string
    placeholder: string
    default: string
    hint: string
    inputMode?: 'numeric' | 'text'
  }
> = {
  CARD: {
    label: 'Card',
    icon: CreditCard,
    field: 'Card number',
    placeholder: '4111 1111 1111 1111',
    default: '4111 1111 1111 1111',
    hint: '4111 1111 1111 1111 succeeds · 4000 0000 0000 0002 is declined',
    inputMode: 'numeric',
  },
  UPI: {
    label: 'UPI',
    icon: Banknote,
    field: 'UPI ID',
    placeholder: 'success@flopay',
    default: 'success@flopay',
    hint: 'Any VPA succeeds except failure@flopay',
  },
  NETBANKING: {
    label: 'Netbanking',
    icon: Landmark,
    field: 'Bank code',
    placeholder: 'HDFC',
    default: 'HDFC',
    hint: 'Any bank succeeds except FAIL_BANK',
  },
}

const METHOD_ORDER: PaymentMethod[] = ['CARD', 'UPI', 'NETBANKING']

export interface CheckoutWidgetProps {
  keyId: string
  keySecret: string
  order: OrderResponse
  onSuccess: (payment: PaymentResponse) => void
  onFailure: (payment: PaymentResponse) => void
  onClose: () => void
}

/**
 * The hosted-checkout surface a merchant would embed. Self-contained: it owns the
 * payment attempt and reports the outcome upward, exactly like a real SDK modal.
 */
export function CheckoutWidget({
  keyId,
  keySecret,
  order,
  onSuccess,
  onFailure,
  onClose,
}: CheckoutWidgetProps) {
  const [method, setMethod] = useState<PaymentMethod>('CARD')
  const [instrument, setInstrument] = useState(METHOD_CONFIG.CARD.default)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = METHOD_CONFIG[method]
  const client = useMemo(() => createPaymentApiClient(keyId, keySecret), [keyId, keySecret])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const handleMethodChange = (next: PaymentMethod) => {
    setMethod(next)
    setInstrument(METHOD_CONFIG[next].default)
    setError(null)
  }

  const handlePay = async () => {
    if (!instrument.trim()) {
      setError(`Enter a ${config.field.toLowerCase()} to continue`)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const payment = await paymentsApi.createPayment(client, {
        orderId: order.id,
        method,
        instrument: instrument.trim(),
      })
      if (payment.status === 'CAPTURED') onSuccess(payment)
      else onFailure(payment)
    } catch (caught) {
      setError(extractErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={busy ? undefined : onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-hidden
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="FloPay checkout"
        variants={dialogVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="glass-strong sheen relative w-full max-w-[24rem] rounded-t-3xl shadow-float sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <span className="inline-flex items-center gap-2">
            <FloMark className="h-6 w-6" />
            <span className="font-display text-sm font-bold tracking-tight">FloPay Checkout</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Badge tone="warning">Test</Badge>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close checkout"
              className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="px-5 pt-5 pb-4 text-center">
          <p className="text-[0.6875rem] font-semibold tracking-wide text-fg-subtle uppercase">
            Amount payable
          </p>
          <p className="mt-1 font-display text-[2rem] leading-none font-extrabold tracking-tight tabular-nums">
            {formatMoney(order.amount, order.currency)}
          </p>
          <p className="mt-1.5 font-mono text-[0.6875rem] text-fg-subtle">{order.id}</p>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <Tabs
            fill
            value={method}
            onChange={handleMethodChange}
            items={METHOD_ORDER.map((value) => {
              const Icon = METHOD_CONFIG[value].icon
              return {
                value,
                label: METHOD_CONFIG[value].label,
                icon: <Icon className="h-3.5 w-3.5" />,
              }
            })}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={method}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
            >
              <Input
                label={config.field}
                value={instrument}
                onChange={(event) => setInstrument(event.target.value)}
                placeholder={config.placeholder}
                inputMode={config.inputMode}
                mono
                autoComplete="off"
                error={error ?? undefined}
              />
              <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-fg-subtle">{config.hint}</p>
            </motion.div>
          </AnimatePresence>

          <Button size="lg" fullWidth loading={busy} onClick={handlePay}>
            {busy ? 'Authorising…' : `Pay ${formatMoney(order.amount, order.currency)}`}
          </Button>

          <div className="flex items-center justify-center gap-3 text-[0.625rem] text-fg-subtle">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" aria-hidden />
              Simulated
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              HMAC signed
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
