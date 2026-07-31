import { motion } from 'framer-motion'
import { ChevronRight, Copy, Fingerprint, LifeBuoy, LockKeyhole, LogOut, Moon, Sun, SunMoon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { pinApi, webauthnApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { createPasskey, isPasskeySupported } from '@/lib/webauthn'
import { cn } from '@/lib/utils'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: SunMoon },
]

export function ProfileScreen() {
  const { session, logout } = useAuth()
  const { preference, setPreference } = useTheme()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const pinStatus = useAsyncResource(pinApi.status, [])
  const passkeyStatus = useAsyncResource(webauthnApi.status, [])
  const [passkeyBusy, setPasskeyBusy] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)

  const togglePasskey = async () => {
    setPasskeyError(null)
    setPasskeyBusy(true)
    try {
      if (passkeyStatus.data?.enabled) {
        await webauthnApi.remove()
      } else {
        const options = await webauthnApi.registerStart()
        const credential = await createPasskey(options)
        await webauthnApi.registerFinish(credential)
      }
      await passkeyStatus.refetch()
    } catch (err) {
      setPasskeyError(err instanceof Error ? err.message : extractErrorMessage(err))
    } finally {
      setPasskeyBusy(false)
    }
  }

  const handleCopyVpa = async () => {
    if (!session) return
    try {
      await navigator.clipboard.writeText(session.vpa)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked — the VPA is still visible on screen.
    }
  }

  const initial = (session?.displayName ?? session?.vpa ?? '?').charAt(0).toUpperCase()

  return (
    <div className="phone-shell px-6 pt-8" style={{ paddingBottom: '7rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center"
      >
        <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-secondary-500 font-display text-3xl font-bold text-white shadow-lg shadow-brand-500/25">
          {initial}
        </span>
        <h1 className="mt-4 font-display text-xl font-bold tracking-tight">
          {session?.displayName ?? 'FloPay user'}
        </h1>
        <button
          type="button"
          onClick={handleCopyVpa}
          className="tap-target mt-2 inline-flex items-center gap-1.5 rounded-xl bg-surface-raised px-3 text-sm font-medium text-fg-muted shadow-sm"
        >
          <span className="font-mono">{session?.vpa}</span>
          <Copy className="h-3.5 w-3.5" />
          {copied && <span className="text-accent-600">Copied</span>}
        </button>
        <p className="mt-1 text-xs text-fg-subtle">+91 {session?.phone}</p>
      </motion.div>

      <div className="mt-8">
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">Appearance</h2>
        <div className="flex gap-2 rounded-2xl bg-surface-raised p-1.5 shadow-sm">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPreference(value)}
              className={cn(
                'tap-target flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors',
                preference === value ? 'bg-brand-500 text-white' : 'text-fg-muted active:bg-line',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">Security</h2>
        <button
          type="button"
          onClick={() => navigate('/set-pin')}
          className="tap-target flex w-full items-center gap-3 rounded-2xl bg-surface-raised p-4 text-left shadow-sm active:bg-line/40"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-500">
            <LockKeyhole className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg">App PIN</p>
            <p className="mt-0.5 text-xs text-fg-subtle">
              {pinStatus.data?.hasPinSet ? 'On — change your PIN' : 'Off — lock FloPay with a 6-digit PIN'}
            </p>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" />
        </button>

        {isPasskeySupported() && (
          <button
            type="button"
            onClick={() => void togglePasskey()}
            disabled={passkeyBusy}
            className="tap-target mt-2.5 flex w-full items-center gap-3 rounded-2xl bg-surface-raised p-4 text-left shadow-sm active:bg-line/40 disabled:opacity-60"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-500">
              <Fingerprint className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">Passkey login</p>
              <p className="mt-0.5 text-xs text-fg-subtle">
                {passkeyError
                  ? passkeyError
                  : passkeyStatus.data?.enabled
                    ? 'On — face, fingerprint, or device unlock'
                    : 'Off — skip OTP with your device biometrics'}
              </p>
            </span>
            <span className="shrink-0 text-xs font-semibold text-brand-500">
              {passkeyBusy ? '…' : passkeyStatus.data?.enabled ? 'Remove' : 'Set up'}
            </span>
          </button>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">Help</h2>
        <button
          type="button"
          onClick={() => navigate('/support')}
          className="tap-target flex w-full items-center gap-3 rounded-2xl bg-surface-raised p-4 text-left shadow-sm active:bg-line/40"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-500">
            <LifeBuoy className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg">Support</p>
            <p className="mt-0.5 text-xs text-fg-subtle">Raise a ticket about a payment or your account</p>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" />
        </button>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-fg-muted uppercase">Sandbox app</h2>
        <div className="rounded-2xl bg-surface-raised p-4 text-xs text-fg-subtle shadow-sm">
          FloPay Wallet is a demo product. No real money moves — "Add money" requests are reviewed
          by an admin, and everything else settles through a real internal ledger for testing
          purposes only.
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={logout}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500/10 text-sm font-semibold text-rose-500 active:bg-rose-500/15"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  )
}
