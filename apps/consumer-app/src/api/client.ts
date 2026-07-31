import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorBody, WalletAuthResponse } from '@flopay/api-types'

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

export const TOKEN_STORAGE_KEY = 'flopay-wallet.token'
export const REFRESH_TOKEN_STORAGE_KEY = 'flopay-wallet.refresh-token'
export const SESSION_STORAGE_KEY = 'flopay-wallet.session'

export const walletApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
})

walletApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

function forceLogout(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
  onUnauthorized?.()
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

/**
 * Deduplicates concurrent refresh attempts — several requests can 401 at
 * once (e.g. a screen firing a few parallel GETs right as the access token
 * expires), and they must all wait on the same refresh rather than each
 * rotating the refresh token and invalidating one another's.
 */
let refreshInFlight: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  if (!refreshToken) throw new Error('No refresh token available')

  if (!refreshInFlight) {
    refreshInFlight = axios
      .post<WalletAuthResponse>(`${API_BASE_URL}/api/wallet/auth/refresh`, { refreshToken })
      .then((response) => {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token)
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.data.refreshToken)
        return response.data.token
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

walletApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config as RetriableConfig | undefined
    const isRefreshCall = config?.url?.includes('/api/wallet/auth/refresh')

    if (error.response?.status === 401 && config && !config._retried && !isRefreshCall) {
      config._retried = true
      try {
        const newToken = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${newToken}`
        return walletApi.request(config)
      } catch {
        forceLogout()
        return Promise.reject(error)
      }
    }

    if (error.response?.status === 401) {
      forceLogout()
    }
    return Promise.reject(error)
  },
)

export function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorBody>

  if (axiosError.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
  if (axiosError.code === 'ERR_NETWORK') {
    return 'Cannot reach FloPay. Check your connection and try again.'
  }

  return (
    axiosError.response?.data?.error?.description ??
    axiosError.message ??
    'Something went wrong. Please try again.'
  )
}
