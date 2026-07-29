import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { ToastProvider } from '@/components/ui'
import { AuthProvider } from '@/features/auth/AuthContext'
import { purgeLegacyStorage } from '@/lib/storage'
import App from '@/App'
import './index.css'

// Drop storage from the pre-rename namespace before any provider reads it.
purgeLegacyStorage()

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root was not found in the document')

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
