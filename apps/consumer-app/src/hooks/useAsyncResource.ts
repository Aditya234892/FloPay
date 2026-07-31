import { useCallback, useEffect, useRef, useState } from 'react'
import { extractErrorMessage } from '@/api/client'

export interface AsyncResource<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/** Same shape as gateway-web's hook of the same name — ignores superseded requests, no state-after-unmount. */
export function useAsyncResource<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []): AsyncResource<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mounted = useRef(true)
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

  return { data, loading, error, refetch: run }
}
