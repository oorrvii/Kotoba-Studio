import { useEffect, useState } from 'react'
import { getFullImageUrls } from '../services/imageService.js'

export default function usePresentationImages(words, preloaded = null) {
  const [state, setState] = useState({ urls: {}, finished: false })

  useEffect(() => {
    if (preloaded) return undefined
    let cancelled = false
    const items = words.filter((w) => w.hasImage).map((w) => ({ id: w.id, version: w.updatedAt?.getTime() ?? 0 }))
    ;(async () => {
      for (let i = 0; i < items.length; i += 10) {
        try {
          const map = await getFullImageUrls(items.slice(i, i + 10))
          if (cancelled) return
          setState((s) => ({ ...s, urls: { ...s.urls, ...Object.fromEntries(map) } }))
        } catch {}
      }
      if (!cancelled) setState((s) => ({ ...s, finished: true }))
    })()
    return () => { cancelled = true }
  }, [words, preloaded])

  if (preloaded) return { urls: preloaded, status: (word) => (!word.hasImage ? 'none' : preloaded[word.id] ? 'ready' : 'missing') }
  const status = (word) => (!word.hasImage ? 'none' : state.urls[word.id] ? 'ready' : state.finished ? 'missing' : 'loading')
  return { urls: state.urls, status }
}
