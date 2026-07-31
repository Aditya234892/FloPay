import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '@/api/endpoints'
import {
  MERCHANT_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  extractErrorMessage,
  setUnauthorizedHandler,
} from '@/api/client'
import type { AuthResponse } from '@/api/types'

/**
 * Roles the UI can gate on. The backend issues `MERCHANT` or `ADMIN` in the
 * JWT (see MerchantService — ADMIN is granted only via the
 * flopay.admin.emails allowlist, never self-service). `developer` has no
 * backend counterpart yet and never resolves from a real token.
 */
export type Role = 'admin' | 'merchant' | 'developer'

export interface Merchant {
  merchantId: number
  name: string
  email: string
  role: Role
  merchantVpa: string
}

interface AuthContextValue {
  merchant: Merchant | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredMerchant(): Merchant | null {
  try {
    const raw = localStorage.getItem(MERCHANT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Merchant>
    if (typeof parsed.merchantId !== 'number' || typeof parsed.email !== 'string') return null
    return {
      merchantId: parsed.merchantId,
      name: parsed.name ?? parsed.email,
      email: parsed.email,
      role: parsed.role ?? 'merchant',
      merchantVpa: parsed.merchantVpa ?? '',
    }
  } catch {
    // Corrupt storage shouldn't wedge the app on boot.
    localStorage.removeItem(MERCHANT_STORAGE_KEY)
    return null
  }
}

function persist(auth: AuthResponse): Merchant {
  const merchant: Merchant = {
    merchantId: auth.merchantId,
    name: auth.name,
    email: auth.email,
    role: auth.role === 'ADMIN' ? 'admin' : 'merchant',
    merchantVpa: auth.merchantVpa,
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, auth.token)
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, auth.refreshToken)
  localStorage.setItem(MERCHANT_STORAGE_KEY, JSON.stringify(merchant))
  return merchant
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(loadStoredMerchant)

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
    if (refreshToken) {
      void authApi.logout(refreshToken).catch(() => {})
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(MERCHANT_STORAGE_KEY)
    setMerchant(null)
  }, [])

  // A 401 from any request drops the session here, so an expired token can't
  // leave the UI in a half-authenticated state.
  useEffect(() => {
    setUnauthorizedHandler(() => setMerchant(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  // Keep tabs in sync — logging out in one tab logs out the others.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_STORAGE_KEY && event.newValue === null) setMerchant(null)
      if (event.key === MERCHANT_STORAGE_KEY) setMerchant(loadStoredMerchant())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setMerchant(persist(await authApi.login({ email, password })))
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      setMerchant(persist(await authApi.signup({ name, email, password })))
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }, [])

  const hasRole = useCallback(
    (...roles: Role[]) => (merchant ? roles.includes(merchant.role) : false),
    [merchant],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      merchant,
      isAuthenticated: merchant !== null,
      login,
      signup,
      logout,
      hasRole,
    }),
    [merchant, login, signup, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
