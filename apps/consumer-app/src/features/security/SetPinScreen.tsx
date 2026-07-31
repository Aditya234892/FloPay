import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, LockKeyhole } from 'lucide-react'
import { OtpInput } from '@/components/OtpInput'
import { pinApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'

type Step = 'enter' | 'confirm' | 'done'

export function SetPinScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('enter')
  const [firstPin, setFirstPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleFirstComplete = (code: string) => {
    setFirstPin(code)
    setError(null)
    setStep('confirm')
  }

  const handleConfirmComplete = async (code: string) => {
    if (code !== firstPin) {
      setError("PINs don't match — try again")
      setConfirmPin('')
      setFirstPin('')
      setStep('enter')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await pinApi.set(code)
      setStep('done')
    } catch (err) {
      setError(extractErrorMessage(err))
      setStep('enter')
      setFirstPin('')
      setConfirmPin('')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="phone-shell items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <CheckCircle2 className="mx-auto h-16 w-16 text-accent-500" />
        </motion.div>
        <h1 className="mt-5 font-display text-2xl font-bold">PIN set</h1>
        <p className="mt-1.5 text-sm text-fg-muted">You'll need it next time you open FloPay.</p>
        <button
          type="button"
          onClick={() => navigate('/profile', { replace: true })}
          className="tap-target mt-10 w-full rounded-2xl bg-brand-500 text-sm font-semibold text-white active:bg-brand-600"
        >
          Done
        </button>
      </div>
    )
  }

  return (
    <div className="phone-shell items-center px-6 pt-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="tap-target -ml-2 inline-flex w-fit items-center gap-1.5 self-start text-sm font-medium text-fg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/12 text-brand-500">
          <LockKeyhole className="h-6 w-6" />
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center"
          >
            <h1 className="mt-4 font-display text-xl font-bold tracking-tight">
              {step === 'enter' ? 'Set a PIN' : 'Confirm your PIN'}
            </h1>
            <p className="mt-1.5 text-sm text-fg-muted">
              {step === 'enter' ? 'Choose a 6-digit PIN to lock the app.' : 'Enter it once more to confirm.'}
            </p>

            <div className="mt-8 w-full max-w-[16rem]">
              {step === 'enter' ? (
                <OtpInput value={firstPin} onChange={setFirstPin} onComplete={handleFirstComplete} autoFocus />
              ) : (
                <OtpInput
                  value={confirmPin}
                  onChange={setConfirmPin}
                  onComplete={handleConfirmComplete}
                  error={!!error}
                  autoFocus
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {busy && <p className="mt-4 text-sm text-fg-muted">Saving…</p>}
        {error && (
          <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
