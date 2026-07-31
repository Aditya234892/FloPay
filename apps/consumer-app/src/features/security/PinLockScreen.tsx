import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, LockKeyhole, LogOut } from 'lucide-react'
import { OtpInput } from '@/components/OtpInput'
import { FloMark } from '@/components/FloMark'
import { pinApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'

export function PinLockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const { logout } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleComplete = async (code: string) => {
    setError(null)
    setBusy(true)
    try {
      const valid = await pinApi.verify(code)
      if (valid) {
        onUnlocked()
      } else {
        setError('Incorrect PIN')
        setPin('')
      }
    } catch (err) {
      setError(extractErrorMessage(err))
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="phone-shell items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex w-full flex-col items-center"
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/12 text-brand-500">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <div className="mt-3 inline-flex items-center gap-1.5">
          <FloMark className="h-4 w-4" />
          <span className="font-display text-xs font-bold text-fg-muted">FloPay</span>
        </div>
        <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Enter your PIN</h1>

        <div className="mt-8 w-full max-w-[16rem]">
          <OtpInput value={pin} onChange={setPin} onComplete={handleComplete} error={!!error} autoFocus />
        </div>

        {busy && <p className="mt-4 text-sm text-fg-muted">Checking…</p>}
        {error && (
          <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={logout}
          className="tap-target mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted"
        >
          <LogOut className="h-4 w-4" />
          Log out instead
        </button>
      </motion.div>
    </div>
  )
}
