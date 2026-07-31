import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { consumerAuthApi, webauthnApi } from '@/api/endpoints'
import {
  REFRESH_TOKEN_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  extractErrorMessage,
  setUnauthorizedHandler,
} from '@/api/client'
import { getPasskeyAssertion } from '@/lib/webauthn'
import type { CompleteProfileRequest, OtpRequestResponse, WalletAuthResponse } from '@flopay/api-types'

export interface WalletSession {
  userId: number
  phone: string
  vpa: string
  displayName: string | null
  profileComplete: boolean
}

interface AuthContextValue {
  session: WalletSession | null
  isAuthenticated: boolean
  requestOtp: (phone: string) => Promise<OtpRequestResponse>
  verifyOtp: (phone: string, otp: string) => Promise<WalletSession>
  loginWithPasskey: (phone: string) => Promise<WalletSession>
  completeProfile: (request: CompleteProfileRequest) => Promise<void>
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
      profileComplete: parsed.profileComplete ?? true,
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
    profileComplete: auth.profileComplete,
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, auth.token)
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, auth.refreshToken)
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  return session
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WalletSession | null>(loadStoredSession)

  const logout = useCallback(() => {
    // Best-effort — revokes the refresh token server-side so a stolen copy
    // of it stops working immediately, but a logout must never get stuck
    // waiting on the network, so failures here are silently ignored.
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
    if (refreshToken) {
      void consumerAuthApi.logout(refreshToken).catch(() => {})
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    // Otherwise a different user logging in on this same tab would inherit
    // the previous session's unlocked PIN state.
    sessionStorage.removeItem('flopay-wallet.pin-unlocked')
    setSession(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const requestOtp = useCallback(async (phone: string) => {
    try {
      return await consumerAuthApi.requestOtp(phone)
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }, [])

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    try {
      const next = persist(await consumerAuthApi.verifyOtp(phone, otp))
      setSession(next)
      return next
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }, [])

  const loginWithPasskey = useCallback(async (phone: string) => {
    try {
      const options = await webauthnApi.loginStart(phone)
      const credential = await getPasskeyAssertion(options)
      const next = persist(await webauthnApi.loginFinish(phone, credential))
      setSession(next)
      return next
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }, [])

  const completeProfile = useCallback(async (request: CompleteProfileRequest) => {
    try {
      setSession(persist(await consumerAuthApi.completeProfile(request)))
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      requestOtp,
      verifyOtp,
      loginWithPasskey,
      completeProfile,
      logout,
    }),
    [session, requestOtp, verifyOtp, loginWithPasskey, completeProfile, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
