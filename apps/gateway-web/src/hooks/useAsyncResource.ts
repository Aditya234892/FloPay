import { useCallback, useEffect, useRef, useState } from 'react'
import { extractErrorMessage } from '@/api/client'

export interface AsyncResource<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Re-run the fetcher. Keeps existing data visible while refreshing. */
  refetch: () => Promise<void>
  /** Optimistically replace the local value without a round trip. */
  mutate: (updater: (current: T | null) => T | null) => void
}

/**
 * Minimal data-fetching primitive: tracks loading/error, ignores results from
 * superseded requests, and never sets state after unmount.
 *
 * Deliberately not TanStack Query — this app has a handful of endpoints and no
 * cache-invalidation graph, so a 40-line hook beats a dependency.
 */
export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncResource<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mounted = useRef(true)
  // Monotonic request id — only the newest response is allowed to win.
  const requestId = useRef(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      if (!mounted.current || id !== requestId.current) return
      setData(result)
    } catch (caught) {
      if (!mounted.current || id !== requestId.current) return
      setError(extractErrorMessage(caught))
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const mutate = useCallback((updater: (current: T | null) => T | null) => {
    setData((current) => updater(current))
  }, [])

  return { data, loading, error, refetch: run, mutate }
}
