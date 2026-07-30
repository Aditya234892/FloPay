import { Navigate, Route, Routes } from 'react-router-dom'
import { PhoneEntryScreen } from '@/features/onboarding/PhoneEntryScreen'
import { OtpScreen } from '@/features/onboarding/OtpScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
import { SendMoneyScreen } from '@/features/send/SendMoneyScreen'
import { RequireAuth } from '@/auth/RequireAuth'
import { useAuth } from '@/auth/AuthContext'

function Landing() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/home" replace /> : <PhoneEntryScreen />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/otp" element={<OtpScreen />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <HomeScreen />
          </RequireAuth>
        }
      />
      <Route
        path="/send"
        element={
          <RequireAuth>
            <SendMoneyScreen />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
