import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Like RequireAuth, but also forces the one-time "choose your FloPay ID" step first. */
export function RequireCompleteProfile({ children }: { children: ReactNode }) {
  const { session, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!session?.profileComplete) return <Navigate to="/choose-vpa" replace />
  return <>{children}</>
}
