import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Send, Star } from 'lucide-react'
import { Button } from '@/components/Button'
import { AmountInput } from '@/components/AmountInput'
import { favoritesApi, merchantPaymentApi, transferApi, walletDataApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { formatMoney } from '@/lib/format'
import { recentPeopleFrom } from '@/lib/recentPeople'
import { randomId } from '@/lib/uuid'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

/** Merchant VPAs use a distinct domain so the client can route to the right endpoint without a lookup. */
const MERCHANT_VPA_SUFFIX = '@flopaybiz'

interface SentResult {
  amountMinor: number
  note: string | null
  recipientLabel: string
  recipientVpa: string
}

interface ScanState {
  toVpa?: string
  toName?: string
}

type Step = 'contact' | 'amount' | 'note' | 'review' | 'success'

const STEP_ORDER: Step[] = ['contact', 'amount', 'note', 'review']

function StepHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="tap-target -ml-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h1 className="font-display text-lg font-bold tracking-tight">{title}</h1>
    </div>
  )
}

const slideVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
}

export function SendMoneyScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const scanned = location.state as ScanState | null
  const transactions = useAsyncResource(walletDataApi.getTransactions, [])
  const favorites = useAsyncResource(favoritesApi.list, [])

  const [toVpa, setToVpa] = useState(scanned?.toVpa ?? '')
  const [toName, setToName] = useState(scanned?.toName ?? null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<SentResult | null>(null)
  const [step, setStep] = useState<Step>(scanned?.toVpa ? 'amount' : 'contact')

  const [idempotencyKey, setIdempotencyKey] = useState(() => randomId())

  const recentPeople = useMemo(() => recentPeopleFrom(transactions.data ?? []), [transactions.data])

  const amountMinor = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
  }, [amount])

  const isMerchant = toVpa.trim().toLowerCase().endsWith(MERCHANT_VPA_SUFFIX)
  const isSelf = !isMerchant && toVpa.trim().toLowerCase() === session?.vpa.toLowerCase()
  const contactValid = toVpa.trim().length > 0 && !isSelf
  const isFavorite = favorites.data?.some((f) => f.vpa === toVpa.trim().toLowerCase()) ?? false

  const toggleFavorite = async () => {
    const vpa = toVpa.trim().toLowerCase()
    if (!vpa) return
    try {
      if (isFavorite) {
        await favoritesApi.remove(vpa)
      } else {
        await favoritesApi.add(vpa)
      }
      await favorites.refetch()
    } catch {
      // Non-critical — the send flow itself isn't blocked by a favorite toggle failing.
    }
  }

  const goTo = (next: Step) => {
    setError(null)
    setStep(next)
  }

  const backFromStep = () => {
    const idx = STEP_ORDER.indexOf(step)
    if (idx <= 0) {
      navigate(-1)
      return
    }
    const prevStep = STEP_ORDER[idx - 1]
    if (!prevStep) return
    // Skip the contact step going back too, if we arrived pre-filled.
    if (prevStep === 'contact' && scanned?.toVpa) {
      navigate(-1)
      return
    }
    goTo(prevStep)
  }

  const handleConfirm = async () => {
    setError(null)
    setBusy(true)
    try {
      const trimmedVpa = toVpa.trim()
      let result: SentResult
      if (isMerchant) {
        const response = await merchantPaymentApi.pay({
          merchantVpa: trimmedVpa,
          amountMinor,
          note: note.trim() || undefined,
          idempotencyKey,
        })
        result = {
          amountMinor: response.amountMinor,
          note: response.note,
          recipientLabel: response.merchantName,
          recipientVpa: trimmedVpa,
        }
      } else {
        const response = await transferApi.send({
          toVpa: trimmedVpa,
          amountMinor,
          note: note.trim() || undefined,
          idempotencyKey,
        })
        result = {
          amountMinor: response.amountMinor,
          note: response.note,
          recipientLabel: response.toName ?? response.toVpa,
          recipientVpa: response.toVpa,
        }
      }
      setSent(result)
      setIdempotencyKey(randomId())
      setStep('success')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (step === 'success' && sent) {
    return (
      <div className="phone-shell items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <CheckCircle2 className="mx-auto h-20 w-20 text-accent-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h1 className="mt-5 font-display text-2xl font-bold">Sent</h1>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatMoney(sent.amountMinor)}</p>
          <p className="mt-2 text-sm text-fg-muted">
            to <span className="font-mono text-fg">{sent.recipientLabel}</span>
          </p>
          {sent.note && <p className="mt-1 text-sm text-fg-subtle">"{sent.note}"</p>}
        </motion.div>

        <div className="mt-10 w-full space-y-2">
          <Button onClick={() => navigate('/home', { replace: true })}>Done</Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSent(null)
              setToVpa('')
              setToName(null)
              setAmount('')
              setNote('')
              setStep('contact')
            }}
          >
            Send another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="phone-shell px-6 pt-6">
      <StepHeader
        title={
          step === 'contact' ? 'Send money' : step === 'amount' ? 'Amount' : step === 'note' ? 'Add a note' : 'Review'
        }
        onBack={backFromStep}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 flex-col"
        >
          {step === 'contact' && (
            <div className="mt-6 flex flex-1 flex-col">
              <label htmlFor="toVpa" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                To (FloPay VPA)
              </label>
              <div className="relative">
                <input
                  id="toVpa"
                  type="text"
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="123456@flopay"
                  value={toVpa}
                  onChange={(e) => {
                    setToVpa(e.target.value)
                    setToName(null)
                  }}
                  className="tap-target w-full rounded-2xl border border-line bg-surface py-3 pr-12 pl-4 font-mono text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                />
                {contactValid && (
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
                    className="tap-target absolute top-1/2 right-1 grid h-10 w-10 -translate-y-1/2 place-items-center"
                  >
                    <Star className={cn('h-4.5 w-4.5', isFavorite ? 'fill-amber-500 text-amber-500' : 'text-fg-subtle')} />
                  </button>
                )}
              </div>
              {isSelf && <p className="mt-1.5 text-xs font-medium text-amber-500">That's your own VPA.</p>}

              {favorites.data && favorites.data.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-2.5 text-xs font-semibold tracking-wide text-fg-muted uppercase">Favorites</h2>
                  <div className="space-y-1">
                    {favorites.data.map((fav) => (
                      <button
                        key={fav.vpa}
                        type="button"
                        onClick={() => {
                          setToVpa(fav.vpa)
                          setToName(fav.displayName)
                        }}
                        className="tap-target flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left active:bg-line/40"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500/12 text-amber-600">
                          <Star className="h-4 w-4 fill-amber-500" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-fg">{fav.displayName ?? fav.vpa}</p>
                          <p className="truncate font-mono text-xs text-fg-subtle">{fav.vpa}</p>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recentPeople.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-2.5 text-xs font-semibold tracking-wide text-fg-muted uppercase">
                    Recent people
                  </h2>
                  <div className="space-y-1">
                    {recentPeople.map((person) => (
                      <button
                        key={person.vpa}
                        type="button"
                        onClick={() => {
                          setToVpa(person.vpa)
                          setToName(person.name)
                        }}
                        className="tap-target flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left active:bg-line/40"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-line/70 font-display text-sm font-bold text-fg">
                          {person.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-fg">{person.name}</p>
                          <p className="truncate font-mono text-xs text-fg-subtle">{person.vpa}</p>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-8 pb-6">
                <Button onClick={() => goTo('amount')} disabled={!contactValid}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'amount' && (
            <div className="flex flex-1 flex-col">
              <p className="mt-4 text-center text-sm text-fg-muted">
                Sending to <span className="font-mono font-semibold text-fg">{toName ?? toVpa}</span>
              </p>
              <div className="mt-6 flex-1">
                <AmountInput value={amount} onChange={setAmount} autoFocus />
              </div>
              <div className="pt-8 pb-6">
                <Button onClick={() => goTo('note')} disabled={amountMinor <= 0}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'note' && (
            <div className="flex flex-1 flex-col">
              <div className="mt-8">
                <label htmlFor="note" className="mb-1.5 block text-xs font-semibold text-fg-muted">
                  Note <span className="font-normal text-fg-subtle">(optional)</span>
                </label>
                <input
                  id="note"
                  type="text"
                  autoFocus
                  maxLength={140}
                  placeholder="What's it for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="tap-target w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                />
              </div>
              <div className="mt-auto pt-8 pb-6">
                <Button onClick={() => goTo('review')}>{note.trim() ? 'Continue' : 'Skip'}</Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-1 flex-col">
              <div className="mt-6 overflow-hidden rounded-3xl bg-surface-raised shadow-sm">
                <div className="flex flex-col items-center px-6 py-8 text-center">
                  <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">You're sending</p>
                  <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{formatMoney(amountMinor)}</p>
                </div>
                <div className="space-y-px">
                  <ReviewRow label="To" value={toName ?? toVpa} />
                  {toName && <ReviewRow label="VPA" value={toVpa} mono />}
                  <ReviewRow label="Note" value={note.trim() || '—'} />
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-4 flex items-start gap-1.5 text-sm font-medium text-rose-500">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <div className="mt-auto pt-8 pb-6">
                <Button onClick={handleConfirm} loading={busy}>
                  {!busy && <Send className="h-4 w-4" />}
                  Confirm & send
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-surface-raised px-5 py-3.5">
      <span className="text-xs font-medium text-fg-subtle">{label}</span>
      <span className={`truncate text-right text-sm font-medium text-fg ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
