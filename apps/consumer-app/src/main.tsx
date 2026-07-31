import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { ThemeProvider } from '@/theme/ThemeProvider'
import App from '@/App'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root was not found in the document')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

// Production only — an active service worker in dev fights Vite's HMR by
// serving stale cached modules.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support degrading gracefully to "no offline support" isn't
      // worth surfacing to the user — the app still works online.
    })
  })
}
