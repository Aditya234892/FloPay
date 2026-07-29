import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { SkeletonChart } from '@/components/ui'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'

/**
 * Dashboard surfaces are code-split: the storefront and auth pages are the entry
 * points for most visits and shouldn't pay for recharts or the tables.
 */
const OverviewPage = lazy(() =>
  import('@/features/dashboard/OverviewPage').then((m) => ({ default: m.OverviewPage })),
)
const TransactionsPage = lazy(() =>
  import('@/features/payments/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
)
const ApiKeysPage = lazy(() =>
  import('@/features/developers/ApiKeysPage').then((m) => ({ default: m.ApiKeysPage })),
)
const WebhooksPage = lazy(() =>
  import('@/features/developers/WebhooksPage').then((m) => ({ default: m.WebhooksPage })),
)
const StorefrontPage = lazy(() =>
  import('@/features/storefront/StorefrontPage').then((m) => ({ default: m.StorefrontPage })),
)

function RouteFallback() {
  return (
    <div className="space-y-5">
      <SkeletonChart />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/store" replace />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/store" element={<StorefrontPage />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="keys" element={<ApiKeysPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
