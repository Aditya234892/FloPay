import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { consumerAuthApi } from '@/api/endpoints'
import { SESSION_STORAGE_KEY, TOKEN_STORAGE_KEY, extractErrorMessage, setUnauthorizedHandler } from '@/api/client'
import type { OtpRequestResponse, WalletAuthResponse } from '@flopay/api-types'

export interface WalletSession {
  userId: number
  phone: string
  vpa: string
  displayName: string | null
}

interface AuthContextValue {
  session: WalletSession | null
  isAuthenticated: boolean
  requestOtp: (phone: string) => Promise<OtpRequestResponse>
  verifyOtp: (phone: string, otp: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredSession(): WalletSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<WalletSession>
    if (typeof parsed.userId !== 'number' || typeof parsed.vpa !== 'string') return null
    return {
      userId: parsed.userId,
      phone: parsed.phone ?? '',
      vpa: parsed.vpa,
      displayName: parsed.displayName ?? null,
    }
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

function persist(auth: WalletAuthResponse): WalletSession {
  const session: WalletSession = {
    userId: auth.userId,
    phone: auth.phone,
    vpa: auth.vpa,
    displayName: auth.displayName,
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, auth.token)
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WalletSession | null>(loadStoredSession)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setSession(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setSession(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const requestOtp = useCallback(async (phone: string) => {
    try {
      return await consumerAuthApi.requestOtp(phone)
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }, [])

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    try {
      setSession(persist(await consumerAuthApi.verifyOtp(phone, otp)))
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: session !== null, requestOtp, verifyOtp, logout }),
    [session, requestOtp, verifyOtp, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
