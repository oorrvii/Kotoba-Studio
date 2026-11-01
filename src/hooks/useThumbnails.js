import { useEffect, useMemo, useState } from 'react'
import { getThumbUrls } from '../services/imageService.js'

export default function useThumbnails(words) {
  const [urls, setUrls] = useState({})
  const items = useMemo(
    () => words.filter((w) => w.hasImage).map((w) => ({ id: w.id, version: w.updatedAt?.getTime() ?? 0 })),
    [words],
  )

  useEffect(() => {
    let cancelled = false
    if (items.length === 0) {
      setUrls({})
      return undefined
    }
    getThumbUrls(items)
      .then((map) => { if (!cancelled) setUrls(Object.fromEntries(map)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [items])

  return urls
}
