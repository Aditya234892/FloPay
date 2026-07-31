import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/** Matches the key the pre-hydration script in index.html already reads. */
const STORAGE_KEY = 'flopay-wallet.theme'

interface ThemeContextValue {
  preference: ThemePreference
  theme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolve(readStoredPreference()))

  useEffect(() => {
    const next = resolve(preference)
    setTheme(next)

    const root = document.documentElement
    root.classList.toggle('dark', next === 'dark')
    root.style.colorScheme = next
    localStorage.setItem(STORAGE_KEY, preference)
  }, [preference])

  useEffect(() => {
    if (preference !== 'system' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = query.matches ? 'dark' : 'light'
      setTheme(next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      document.documentElement.style.colorScheme = next
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => setPreferenceState(next), [])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference }),
    [preference, theme, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}
