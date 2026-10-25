import { useCallback, useEffect, useState } from 'react'

/**
 * Tiny data-loading hook: { data, error, loading, reload, refresh }.
 * reload shows the loading state again; refresh re-fetches quietly (used for live updates).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback((quiet: boolean) => {
    if (!quiet) { setLoading(true); setError(null) }
    fn().then((d) => { setData(d); setError(null) }).catch((e) => setError(e.message)).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const run = useCallback(() => fetchData(false), [fetchData])
  const refresh = useCallback(() => fetchData(true), [fetchData])

  useEffect(run, [run])
  return { data, error, loading, reload: run, refresh }
}
