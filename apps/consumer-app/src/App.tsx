import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SplashScreen } from '@/features/onboarding/SplashScreen'
import { OnboardingCarousel } from '@/features/onboarding/OnboardingCarousel'
import { PhoneEntryScreen } from '@/features/onboarding/PhoneEntryScreen'
import { OtpScreen } from '@/features/onboarding/OtpScreen'
import { ChooseVpaScreen } from '@/features/onboarding/ChooseVpaScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
import { PaymentsScreen } from '@/features/payments/PaymentsScreen'
import { ActivityScreen } from '@/features/activity/ActivityScreen'
import { TransactionDetailScreen } from '@/features/activity/TransactionDetailScreen'
import { ProfileScreen } from '@/features/profile/ProfileScreen'
import { NotificationsScreen } from '@/features/notifications/NotificationsScreen'
import { ScanScreen } from '@/features/qr/ScanScreen'
import { ReceiveScreen } from '@/features/qr/ReceiveScreen'
import { SendMoneyScreen } from '@/features/send/SendMoneyScreen'
import { RequestMoneyScreen } from '@/features/requests/RequestMoneyScreen'
import { RequestsScreen } from '@/features/requests/RequestsScreen'
import { SplitBillScreen } from '@/features/requests/SplitBillScreen'
import { TopUpScreen } from '@/features/topup/TopUpScreen'
import { RewardsScreen } from '@/features/rewards/RewardsScreen'
import { ScheduledTransfersScreen } from '@/features/transfer/ScheduledTransfersScreen'
import { PaymentLinksScreen } from '@/features/paymentlinks/PaymentLinksScreen'
import { PayViaLinkScreen } from '@/features/paymentlinks/PayViaLinkScreen'
import { SupportScreen } from '@/features/support/SupportScreen'
import { SetPinScreen } from '@/features/security/SetPinScreen'
import { PinGate } from '@/features/security/PinGate'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireCompleteProfile } from '@/auth/RequireCompleteProfile'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/auth/AuthContext'

const ONBOARDING_SEEN_KEY = 'flopay-wallet.onboarded'
/** Long enough to read as a deliberate brand moment, short enough not to feel like a delay. */
const SPLASH_MIN_MS = 1100

function Landing() {
  const { isAuthenticated } = useAuth()
  const [showCarousel, setShowCarousel] = useState(
    () => !isAuthenticated && !localStorage.getItem(ONBOARDING_SEEN_KEY),
  )

  if (isAuthenticated) return <Navigate to="/home" replace />

  if (showCarousel) {
    return (
      <OnboardingCarousel
        onDone={() => {
          localStorage.setItem(ONBOARDING_SEEN_KEY, '1')
          setShowCarousel(false)
        }}
      />
    )
  }

  return <PhoneEntryScreen />
}

export default function App() {
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), SPLASH_MIN_MS)
    return () => clearTimeout(timer)
  }, [])

  if (booting) return <SplashScreen />

  return (
    <PinGate>
      <Routes>
        <Route path="/" element={<Landing />} />
      <Route path="/otp" element={<OtpScreen />} />
      <Route
        path="/choose-vpa"
        element={
          <RequireAuth>
            <ChooseVpaScreen />
          </RequireAuth>
        }
      />

      {/* Tab destinations — share the bottom nav via AppShell's <Outlet />. */}
      <Route
        element={
          <RequireCompleteProfile>
            <AppShell />
          </RequireCompleteProfile>
        }
      >
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/payments" element={<PaymentsScreen />} />
        <Route path="/activity" element={<ActivityScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Route>

      {/* Pushed full-screen flows — no bottom nav. */}
      <Route
        path="/scan"
        element={
          <RequireCompleteProfile>
            <ScanScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/receive"
        element={
          <RequireCompleteProfile>
            <ReceiveScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/activity/:entryId"
        element={
          <RequireCompleteProfile>
            <TransactionDetailScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/send"
        element={
          <RequireCompleteProfile>
            <SendMoneyScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/request"
        element={
          <RequireCompleteProfile>
            <RequestMoneyScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/requests"
        element={
          <RequireCompleteProfile>
            <RequestsScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireCompleteProfile>
            <NotificationsScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/split"
        element={
          <RequireCompleteProfile>
            <SplitBillScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/topup"
        element={
          <RequireCompleteProfile>
            <TopUpScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/rewards"
        element={
          <RequireCompleteProfile>
            <RewardsScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/set-pin"
        element={
          <RequireCompleteProfile>
            <SetPinScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/scheduled-transfers"
        element={
          <RequireCompleteProfile>
            <ScheduledTransfersScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/payment-links"
        element={
          <RequireCompleteProfile>
            <PaymentLinksScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/pay/:code"
        element={
          <RequireCompleteProfile>
            <PayViaLinkScreen />
          </RequireCompleteProfile>
        }
      />
      <Route
        path="/support"
        element={
          <RequireCompleteProfile>
            <SupportScreen />
          </RequireCompleteProfile>
        }
      />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PinGate>
  )
}
