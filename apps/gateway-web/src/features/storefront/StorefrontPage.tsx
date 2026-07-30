import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Info,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Card, CardContent, Input, useToast } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { formatMoney } from '@/lib/format'
import { EASE_OUT_EXPO, staggerContainer, staggerItem } from '@/lib/motion'
import { createPaymentApiClient, extractErrorMessage } from '@/api/client'
import { paymentsApi } from '@/api/endpoints'
import type { OrderResponse, PaymentResponse } from '@/api/types'
import { CheckoutWidget } from '../checkout/CheckoutWidget'

const PRODUCT = {
  name: 'Aperture 68 Mechanical Keyboard',
  tagline: 'Hot-swappable · Aluminium body · 68 keys',
  description:
    'A demo product for exercising the full FloPay payment flow. Nothing ships, and no real money moves at any point.',
  amount: 1_249_900,
  currency: 'INR',
  emoji: '⌨️',
} as const

const KEY_STORAGE = { id: 'flopay.demo.keyId', secret: 'flopay.demo.keySecret' } as const

type Result =
  | { kind: 'success'; payment: PaymentResponse; verified: boolean }
  | { kind: 'failure'; payment: PaymentResponse }
  | null

export function StorefrontPage() {
  const toast = useToast()
  const [keyId, setKeyId] = useState(() => localStorage.getItem(KEY_STORAGE.id) ?? '')
  const [keySecret, setKeySecret] = useState(() => localStorage.getItem(KEY_STORAGE.secret) ?? '')
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [result, setResult] = useState<Result>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hasKeys = keyId.trim().length > 0 && keySecret.trim().length > 0
  const client = useMemo(
    () => (hasKeys ? createPaymentApiClient(keyId.trim(), keySecret.trim()) : null),
    [hasKeys, keyId, keySecret],
  )

  const handleBuyNow = async () => {
    if (!client) {
      setError('Paste a key_id and key_secret from the dashboard first.')
      return
    }

    localStorage.setItem(KEY_STORAGE.id, keyId.trim())
    localStorage.setItem(KEY_STORAGE.secret, keySecret.trim())
    setError(null)
    setResult(null)
    setBusy(true)

    try {
      const created = await paymentsApi.createOrder(client, {
        amount: PRODUCT.amount,
        currency: PRODUCT.currency,
        receipt: `rcpt_${Date.now().toString(36)}`,
      })
      setOrder(created)
    } catch (caught) {
      setError(extractErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  /**
   * Mirrors what a merchant's own server does after checkout returns: recompute
   * the signature server-side before trusting the browser's claim of success.
   */
  const handleSuccess = async (payment: PaymentResponse) => {
    setOrder(null)
    if (!client) return

    try {
      const { valid } = await paymentsApi.verifyPayment(client, {
        orderId: payment.orderId,
        paymentId: payment.id,
        signature: payment.signature,
      })
      setResult({ kind: 'success', payment, verified: valid })
      if (valid) toast.success('Payment captured', 'Signature verified server-side.')
      else toast.error('Signature mismatch', 'The payment captured but could not be verified.')
    } catch {
      setResult({ kind: 'success', payment, verified: false })
      toast.error('Verification failed', 'Could not reach the verify endpoint.')
    }
  }

  const handleFailure = (payment: PaymentResponse) => {
    setOrder(null)
    setResult({ kind: 'failure', payment })
    toast.toast({
      title: 'Payment declined',
      description: payment.failureReason ?? 'The instrument was declined.',
      tone: 'warning',
    })
  }

  return (
    <div className="relative min-h-svh">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <Badge tone="neutral" className="hidden sm:inline-flex">
            Demo store
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/dashboard', '_self')}
              rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Dashboard
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-1 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="mb-8 max-w-2xl"
        >
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            A storefront wired to <span className="gradient-text">FloPay</span>
          </h1>
          <p className="mt-3 text-sm text-fg-muted sm:text-base">
            This page plays the role of a merchant's site: it creates an order with its API keys,
            opens FloPay Checkout, then verifies the returned signature server-side before showing
            success.
          </p>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {result && (
            <motion.div
              layout
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -12, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <Card
                solid
                className={
                  result.kind === 'success' && result.verified
                    ? 'border-accent-500/35'
                    : result.kind === 'success'
                      ? 'border-amber-500/35'
                      : 'border-rose-500/35'
                }
              >
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                        result.kind === 'success'
                          ? 'bg-accent-500/12 text-accent-500'
                          : 'bg-rose-500/12 text-rose-500'
                      }`}
                    >
                      {result.kind === 'success' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-semibold">
                        {result.kind === 'success' ? 'Payment captured' : 'Payment declined'}
                      </p>

                      {result.kind === 'success' ? (
                        <>
                          <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                            <div className="flex gap-2">
                              <dt className="text-fg-subtle">Payment</dt>
                              <dd className="truncate font-mono text-fg">{result.payment.id}</dd>
                            </div>
                            <div className="flex gap-2">
                              <dt className="text-fg-subtle">Order</dt>
                              <dd className="truncate font-mono text-fg">
                                {result.payment.orderId}
                              </dd>
                            </div>
                          </dl>
                          <div className="mt-3">
                            {result.verified ? (
                              <Badge tone="success" icon={<ShieldCheck className="h-3 w-3" />}>
                                Signature verified server-side
                              </Badge>
                            ) : (
                              <Badge tone="warning">Signature could not be verified</Badge>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="mt-1.5 text-sm text-fg-muted">
                          {result.payment.failureReason ?? 'The instrument was declined.'}
                        </p>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={staggerContainer(0.09)}
          initial="initial"
          animate="animate"
          className="grid gap-5 lg:grid-cols-[1fr_1.15fr]"
        >
          {/* Credentials */}
          <motion.div variants={staggerItem}>
            <Card className="h-full">
              <CardContent className="pt-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15 ring-inset">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-sm font-semibold">Connect test keys</h2>
                </div>

                <div className="space-y-3">
                  <Input
                    label="key_id"
                    value={keyId}
                    onChange={(event) => setKeyId(event.target.value)}
                    placeholder="flo_test_…"
                    mono
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Input
                    label="key_secret"
                    value={keySecret}
                    onChange={(event) => setKeySecret(event.target.value)}
                    placeholder="sk_test_…"
                    mono
                    password
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-500/8 px-3.5 py-3 text-xs text-fg-muted ring-1 ring-amber-500/20 ring-inset">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                  <span>
                    In production the secret lives only on your server. It sits in the browser here
                    purely so the whole flow is observable in one page.
                  </span>
                </div>

                <p className="mt-3 text-xs text-fg-subtle">
                  Need keys?{' '}
                  <Link to="/dashboard/keys" className="font-medium text-brand-500 hover:underline">
                    Generate a pair
                  </Link>{' '}
                  in the dashboard.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product */}
          <motion.div variants={staggerItem}>
            <Card interactive className="h-full">
              <CardContent className="pt-5">
                <div
                  className="grid place-items-center rounded-2xl bg-linear-to-br from-brand-500/12 via-violet-500/10 to-accent-500/12 py-10 text-6xl"
                  aria-hidden
                >
                  {PRODUCT.emoji}
                </div>

                <div className="mt-5">
                  <Badge tone="brand" icon={<BadgeCheck className="h-3 w-3" />}>
                    In stock
                  </Badge>
                  <h2 className="mt-2.5 font-display text-xl font-bold tracking-tight">
                    {PRODUCT.name}
                  </h2>
                  <p className="mt-1 text-xs text-fg-subtle">{PRODUCT.tagline}</p>
                  <p className="mt-3 text-sm text-fg-muted">{PRODUCT.description}</p>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">
                        Total
                      </p>
                      <p className="font-display text-2xl font-extrabold tracking-tight tabular-nums">
                        {formatMoney(PRODUCT.amount, PRODUCT.currency)}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      loading={busy}
                      onClick={handleBuyNow}
                      disabled={!hasKeys}
                      leftIcon={!busy && <ShoppingBag className="h-4 w-4" />}
                    >
                      {busy ? 'Creating order…' : 'Buy now'}
                    </Button>
                  </div>

                  {!hasKeys && (
                    <p className="mt-3 text-xs text-fg-subtle">
                      Add your test keys to enable checkout.
                    </p>
                  )}

                  {error && (
                    <p
                      role="alert"
                      className="mt-3 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-600 ring-1 ring-rose-500/25 ring-inset dark:text-rose-400"
                    >
                      {error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>

      <AnimatePresence>
        {order && client && (
          <CheckoutWidget
            keyId={keyId.trim()}
            keySecret={keySecret.trim()}
            order={order}
            onSuccess={handleSuccess}
            onFailure={handleFailure}
            onClose={() => setOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
