import { walletApi } from './client'
import type {
  OtpRequestResponse,
  WalletAuthResponse,
  WalletResponse,
  WalletTransaction,
} from '@flopay/api-types'

export const consumerAuthApi = {
  requestOtp: (phone: string) =>
    walletApi.post<OtpRequestResponse>('/api/wallet/auth/otp/request', { phone }).then((r) => r.data),

  verifyOtp: (phone: string, otp: string) =>
    walletApi.post<WalletAuthResponse>('/api/wallet/auth/otp/verify', { phone, otp }).then((r) => r.data),
}

export const walletDataApi = {
  getWallet: () => walletApi.get<WalletResponse>('/api/wallet').then((r) => r.data),

  getTransactions: () =>
    walletApi.get<WalletTransaction[]>('/api/wallet/transactions').then((r) => r.data),
}
