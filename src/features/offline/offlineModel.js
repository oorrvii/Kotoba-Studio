export const deckKey = (uid, chapterId) => `${uid}:${chapterId}`
export const imageKey = (uid, chapterId, wordId) => `${uid}:${chapterId}:${wordId}`
export const imagePrefix = (uid, chapterId) => `${uid}:${chapterId}:`

export function sourceStamp(words) {
  return {
    count: words.length,
    latest: words.reduce((max, w) => Math.max(max, w.updatedAt?.getTime() ?? 0), 0),
    order: words.map((w) => w.id).join(','),
  }
}

export function isDeckStale(meta, words) {
  const now = sourceStamp(words)
  return meta.stamp.count !== now.count || meta.stamp.latest !== now.latest || meta.stamp.order !== now.order
}
