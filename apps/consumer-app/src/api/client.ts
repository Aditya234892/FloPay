import axios, { AxiosError, type AxiosInstance } from 'axios'
import type { ApiErrorBody } from '@flopay/api-types'

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

export const TOKEN_STORAGE_KEY = 'flopay-wallet.token'
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

walletApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(SESSION_STORAGE_KEY)
      onUnauthorized?.()
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
