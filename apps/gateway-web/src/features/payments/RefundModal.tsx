import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import { Button, Input, Modal, Tabs } from '@/components/ui'
import { formatMoney, fromMinorUnits, toMinorUnits } from '@/lib/format'
import type { PaymentWithRefunds } from '@/api/types'

type RefundMode = 'full' | 'partial'

/**
 * Refund amount is validated against the payment's actual refundable balance,
 * so the server's 400 becomes an unreachable path rather than the primary
 * feedback mechanism. Replaces the previous `window.prompt` flow.
 */
function buildSchema(refundableMinor: number, currency: string) {
  return z.object({
    mode: z.enum(['full', 'partial']),
    amount: z
      .string()
      .optional()
      .transform((value) => value?.trim() ?? ''),
  }).superRefine((data, ctx) => {
    if (data.mode === 'full') return

    if (data.amount === '') {
      ctx.addIssue({ path: ['amount'], code: 'custom', message: 'Enter an amount to refund' })
      return
    }

    const parsed = Number(data.amount)
    if (!Number.isFinite(parsed)) {
      ctx.addIssue({ path: ['amount'], code: 'custom', message: 'Enter a valid number' })
      return
    }
    if (parsed <= 0) {
      ctx.addIssue({ path: ['amount'], code: 'custom', message: 'Amount must be greater than zero' })
      return
    }
    if (toMinorUnits(parsed, currency) > refundableMinor) {
      ctx.addIssue({
        path: ['amount'],
        code: 'custom',
        message: `Cannot exceed the refundable balance of ${formatMoney(refundableMinor, currency)}`,
      })
    }
  })
}

type RefundFormValues = { mode: RefundMode; amount?: string }

const MODE_ITEMS = [
  { value: 'full' as const, label: 'Full refund' },
  { value: 'partial' as const, label: 'Partial' },
]

export interface RefundModalProps {
  payment: PaymentWithRefunds | null
  currency: string
  onClose: () => void
  /** Resolve to signal success; reject to keep the modal open with an error. */
  onConfirm: (paymentId: string, amountMinor: number | null) => Promise<void>
}

export function RefundModal({ payment, currency, onClose, onConfirm }: RefundModalProps) {
  const refundable = payment?.refundableAmount ?? 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RefundFormValues>({
    resolver: zodResolver(buildSchema(refundable, currency)),
    defaultValues: { mode: 'full', amount: '' },
  })

  // Reset whenever a different payment is opened, so stale input never carries over.
  useEffect(() => {
    if (payment) reset({ mode: 'full', amount: '' })
  }, [payment, reset])

  const mode = watch('mode')

  const onSubmit = async (values: RefundFormValues) => {
    if (!payment) return
    const amountMinor =
      values.mode === 'full' ? null : toMinorUnits(Number(values.amount), currency)

    try {
      await onConfirm(payment.id, amountMinor)
      onClose()
    } catch (error) {
      setError('amount', {
        message: error instanceof Error ? error.message : 'The refund could not be processed',
      })
    }
  }

  return (
    <Modal
      open={payment !== null}
      onClose={onClose}
      title="Issue a refund"
      description={
        payment
          ? `Refunding payment ${payment.id} — ${formatMoney(refundable, currency)} available.`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            {isSubmitting ? 'Processing…' : 'Confirm refund'}
          </Button>
        </>
      }
    >
      {payment && (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-surface-hover/50 p-3.5 text-center">
            <div>
              <p className="text-[0.625rem] font-semibold tracking-wide text-fg-subtle uppercase">
                Captured
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {formatMoney(payment.amount, currency)}
              </p>
            </div>
            <div>
              <p className="text-[0.625rem] font-semibold tracking-wide text-fg-subtle uppercase">
                Refunded
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {formatMoney(payment.refundedAmount, currency)}
              </p>
            </div>
            <div>
              <p className="text-[0.625rem] font-semibold tracking-wide text-fg-subtle uppercase">
                Available
              </p>
              <p className="mt-1 text-sm font-semibold text-accent-600 tabular-nums dark:text-accent-400">
                {formatMoney(refundable, currency)}
              </p>
            </div>
          </div>

          <input type="hidden" {...register('mode')} />
          <Tabs
            fill
            items={MODE_ITEMS}
            value={mode}
            onChange={(next) => setValue('mode', next, { shouldValidate: false })}
          />

          {mode === 'partial' ? (
            <Input
              {...register('amount')}
              label={`Amount to refund (${currency})`}
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder={fromMinorUnits(refundable, currency).toFixed(2)}
              hint={`Maximum ${formatMoney(refundable, currency)}`}
              error={errors.amount?.message}
              autoFocus
            />
          ) : (
            <>
              <p className="text-sm text-fg-muted">
                The full remaining balance of{' '}
                <strong className="text-fg">{formatMoney(refundable, currency)}</strong> will be
                refunded.
              </p>
              {errors.amount?.message && (
                <p role="alert" className="text-xs font-medium text-rose-500">
                  {errors.amount.message}
                </p>
              )}
            </>
          )}

          <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/8 px-3.5 py-3 text-xs text-fg-muted ring-1 ring-amber-500/20 ring-inset">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            <span>
              Refunds cannot be reversed. A <code className="font-mono">refund_processed</code>{' '}
              webhook fires on success.
            </span>
          </div>
        </form>
      )}
    </Modal>
  )
}
