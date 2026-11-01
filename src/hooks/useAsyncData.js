import { useCallback, useEffect, useRef, useState } from 'react'

export default function useAsyncData(fetcher, key = '') {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const fetcherRef = useRef(fetcher)
  const latest = useRef(0)

  useEffect(() => { fetcherRef.current = fetcher })

  const load = useCallback(async ({ silent = false } = {}) => {
    const id = ++latest.current
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetcherRef.current()
      if (id === latest.current) setState({ data, error: null, loading: false })
    } catch (e) {
      if (!silent && id === latest.current) {
        setState({ data: null, error: e.message || 'Something went wrong.', loading: false })
      }
    }
  }, [])

  useEffect(() => { load() }, [load, key])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load({ silent: true }) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  return { ...state, reload: load }
}
