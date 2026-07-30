import axios, { AxiosError, type AxiosInstance } from 'axios'
import type { ApiErrorBody } from './types'

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

export const TOKEN_STORAGE_KEY = 'flopay.token'
export const MERCHANT_STORAGE_KEY = 'flopay.merchant'

/** Dashboard client — JWT bearer auth, attached per request from storage. */
export const dashboardApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
})

dashboardApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * A 401 means the session is gone (expired or revoked). Clear it and let the
 * router's guard bounce to /login rather than leaving pages to retry forever.
 */
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

dashboardApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(MERCHANT_STORAGE_KEY)
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

/**
 * Payment-API client, authenticated with a merchant's key_id/key_secret.
 *
 * In production these credentials live only on a merchant's server — the demo
 * storefront holds them in the browser purely to make the flow observable, and
 * says so in its own UI.
 */
export function createPaymentApiClient(keyId: string, keySecret: string): AxiosInstance {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 15_000,
    auth: { username: keyId, password: keySecret },
  })
}

/** Pull the API's error envelope into a human string, with sensible fallbacks. */
export function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorBody>

  if (axiosError.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
  if (axiosError.code === 'ERR_NETWORK') {
    return 'Cannot reach the API. Is the backend running on port 8080?'
  }

  return (
    axiosError.response?.data?.error?.description ??
    axiosError.message ??
    'Something went wrong. Please try again.'
  )
}

/** Machine-readable error code, for callers that branch on the failure kind. */
export function extractErrorCode(error: unknown): string | undefined {
  return (error as AxiosError<ApiErrorBody>).response?.data?.error?.code
}
