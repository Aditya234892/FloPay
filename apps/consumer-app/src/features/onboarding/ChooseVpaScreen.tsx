import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Check, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/Button'
import { FloMark } from '@/components/FloMark'
import { consumerAuthApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'
import type { VpaSuggestion } from '@flopay/api-types'

/** How long to let someone stop typing before we hit the network. */
const DEBOUNCE_MS = 400

export function ChooseVpaScreen() {
  const { session, completeProfile } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [suggestions, setSuggestions] = useState<VpaSuggestion[]>([])
  const [selectedVpa, setSelectedVpa] = useState('')
  const [customHandle, setCustomHandle] = useState('')
  const [customAvailable, setCustomAvailable] = useState<boolean | null>(null)
  const [checkingCustom, setCheckingCustom] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Refetch suggestions as the name settles, so name-based candidates appear
  // without the user having to ask for them.
  useEffect(() => {
    const handle = setTimeout(() => {
      consumerAuthApi
        .vpaSuggestions(displayName.trim())
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [displayName])

  // Live availability for a hand-typed handle, separate from the tap-to-pick
  // suggestions — picking a suggestion already carries a known answer.
  useEffect(() => {
    const handle = customHandle.trim().toLowerCase()
    if (handle.length < 3) {
      setCustomAvailable(null)
      return
    }
    setCheckingCustom(true)
    const timer = setTimeout(() => {
      consumerAuthApi
        .vpaAvailability(`${handle}@flopay`)
        .then((available) => {
          setCustomAvailable(available)
          if (available) setSelectedVpa(`${handle}@flopay`)
        })
        .catch(() => setCustomAvailable(null))
        .finally(() => setCheckingCustom(false))
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [customHandle])

  if (session?.profileComplete) {
    return <Navigate to="/home" replace />
  }

  const canSubmit = displayName.trim().length > 0 && selectedVpa.length > 0 && !busy

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError(null)
    setBusy(true)
    try {
      await completeProfile({
        displayName: displayName.trim(),
        vpa: selectedVpa,
        referralCode: referralCode.trim() || undefined,
      })
      navigate('/home', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="phone-shell px-6 pt-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <FloMark className="h-9 w-9" />
        <h1 className="mt-5 font-display text-xl font-bold tracking-tight">Set up your FloPay ID</h1>
        <p className="mt-1.5 text-sm text-fg-muted">This is how people send you money.</p>

        <div className="mt-7">
          <label htmlFor="displayName" className="mb-1.5 block text-xs font-semibold text-fg-muted">
            Your name
          </label>
          <input
            id="displayName"
            type="text"
            maxLength={60}
            placeholder="What should we call you?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="tap-target w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          />
        </div>

        {suggestions.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
              <Sparkles className="h-3.5 w-3.5" /> Suggested for you
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.vpa}
                  type="button"
                  disabled={!s.available}
                  onClick={() => {
                    setSelectedVpa(s.vpa)
                    setCustomHandle('')
                  }}
                  className={cn(
                    'tap-target rounded-full border px-4 text-sm font-mono font-medium transition-colors',
                    !s.available && 'border-line text-fg-subtle line-through opacity-50',
                    s.available && selectedVpa === s.vpa && 'border-brand-500 bg-brand-500/10 text-brand-600',
                    s.available && selectedVpa !== s.vpa && 'border-line text-fg active:bg-line',
                  )}
                >
                  {s.vpa}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <label htmlFor="customHandle" className="mb-1.5 block text-xs font-semibold text-fg-muted">
            Or pick your own
          </label>
          <div className="relative">
            <input
              id="customHandle"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="yourname"
              value={customHandle}
              onChange={(e) => {
                setCustomHandle(e.target.value)
                setCustomAvailable(null)
              }}
              className="tap-target w-full rounded-2xl border border-line bg-surface py-3 pr-28 pl-4 font-mono text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-mono text-fg-subtle">
              @flopay
            </span>
          </div>
          {checkingCustom && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking availability…
            </p>
          )}
          {!checkingCustom && customHandle.trim().length >= 3 && customAvailable === true && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-accent-600">
              <Check className="h-3 w-3" /> Available
            </p>
          )}
          {!checkingCustom && customHandle.trim().length >= 3 && customAvailable === false && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-500">
              <AlertCircle className="h-3 w-3" /> Already taken
            </p>
          )}
          {customHandle.trim().length > 0 && customHandle.trim().length < 3 && (
            <p className="mt-1.5 text-xs font-medium text-fg-subtle">At least 3 characters</p>
          )}
        </div>

        <div className="mt-5">
          <label htmlFor="referralCode" className="mb-1.5 block text-xs font-semibold text-fg-muted">
            Referral code <span className="font-normal text-fg-subtle">(optional)</span>
          </label>
          <input
            id="referralCode"
            type="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={16}
            placeholder="Got a code from a friend?"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            className="tap-target w-full rounded-2xl border border-line bg-surface px-4 font-mono text-base text-fg outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
          />
          <p className="mt-1.5 text-xs text-fg-subtle">You'll both get a bonus after your first payment.</p>
        </div>

        {error && (
          <p role="alert" className="mt-4 flex items-start gap-1.5 text-sm font-medium text-rose-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-8">
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={busy}>
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
