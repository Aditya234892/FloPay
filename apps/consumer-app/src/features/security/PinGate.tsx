import { useEffect, useState, type ReactNode } from 'react'
import { pinApi } from '@/api/endpoints'
import { useAuth } from '@/auth/AuthContext'
import { PinLockScreen } from './PinLockScreen'

/** Per-tab, not persisted — closing the tab re-locks, same as most banking apps. */
const UNLOCKED_KEY = 'flopay-wallet.pin-unlocked'

type GateStatus = 'checking' | 'locked' | 'unlocked'

/** Wraps the whole authenticated app. A no-op until a user actually opts into a PIN. */
export function PinGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [status, setStatus] = useState<GateStatus>('checking')

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('unlocked')
      return
    }
    if (sessionStorage.getItem(UNLOCKED_KEY)) {
      setStatus('unlocked')
      return
    }
    pinApi
      .status()
      .then((res) => setStatus(res.hasPinSet ? 'locked' : 'unlocked'))
      .catch(() => setStatus('unlocked')) // a status-check failure shouldn't lock someone out of their own wallet
  }, [isAuthenticated])

  if (status === 'checking') return null
  if (status === 'locked') {
    return (
      <PinLockScreen
        onUnlocked={() => {
          sessionStorage.setItem(UNLOCKED_KEY, '1')
          setStatus('unlocked')
        }}
      />
    )
  }
  return <>{children}</>
}
