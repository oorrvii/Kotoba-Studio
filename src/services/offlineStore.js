import { AppError } from '../lib/errors.js'
import { imageKey, imagePrefix, deckKey } from '../features/offline/offlineModel.js'

const DB_NAME = 'kotoba-offline'

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new AppError('Offline storage isn’t available in this browser (private browsing can block it).', 'no-idb'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('decks', { keyPath: 'key' })
      req.result.createObjectStore('images', { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(new AppError('Offline storage couldn’t be opened.', 'idb-open'))
  })
}
const wrap = (req) => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error) })
const finished = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve()
  tx.onerror = () => reject(tx.error)
  tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'))
})
const prefixRange = (prefix) => IDBKeyRange.bound(prefix, `${prefix}\uffff`)

export async function saveDeck(record, blobs) {
  const db = await open()
  try {
    const tx = db.transaction(['decks', 'images'], 'readwrite')
    const images = tx.objectStore('images')
    images.delete(prefixRange(imagePrefix(record.uid, record.chapterId)))
    blobs.forEach((blob, wordId) => images.put({ key: imageKey(record.uid, record.chapterId, wordId), blob }))
    tx.objectStore('decks').put({ ...record, key: deckKey(record.uid, record.chapterId), imageCount: blobs.size })
    await finished(tx)
  } finally {
    db.close()
  }
}

export async function listDecks(uid) {
  const db = await open()
  try {
    const all = await wrap(db.transaction('decks').objectStore('decks').getAll())
    return all.filter((d) => d.uid === uid).sort((a, b) => b.preparedAt - a.preparedAt)
  } finally {
    db.close()
  }
}

export async function getDeckMeta(uid, chapterId) {
  const db = await open()
  try {
    return (await wrap(db.transaction('decks').objectStore('decks').get(deckKey(uid, chapterId)))) ?? null
  } finally {
    db.close()
  }
}

export async function countDeck(uid, chapterId) {
  const db = await open()
  try {
    const tx = db.transaction(['decks', 'images'])
    const [deck, images] = await Promise.all([
      wrap(tx.objectStore('decks').get(deckKey(uid, chapterId))),
      wrap(tx.objectStore('images').count(prefixRange(imagePrefix(uid, chapterId)))),
    ])
    return deck ? { words: deck.words.length, images } : null
  } finally {
    db.close()
  }
}

export async function loadSavedDeck(uid, chapterId) {
  const db = await open()
  try {

    const tx = db.transaction(['decks', 'images'])
    const prefix = imagePrefix(uid, chapterId)
    const [deck, rows] = await Promise.all([
      wrap(tx.objectStore('decks').get(deckKey(uid, chapterId))),
      wrap(tx.objectStore('images').getAll(prefixRange(prefix))),
    ])
    if (!deck) return null
    const urls = {}
    rows.forEach((r) => { urls[r.key.slice(prefix.length)] = URL.createObjectURL(r.blob) })
    return { title: deck.title, words: deck.words, preparedAt: deck.preparedAt, urls }
  } finally {
    db.close()
  }
}

export async function loadAllSavedDecks(uid) {
  const decks = (await listDecks(uid)).filter((d) => d.chapterId !== 'all').sort((a, b) => a.preparedAt - b.preparedAt)
  const loaded = (await Promise.all(decks.map((d) => loadSavedDeck(uid, d.chapterId)))).filter(Boolean)
  if (loaded.length === 0) return null
  return {
    title: 'All prepared chapters',
    words: loaded.flatMap((d) => d.words),
    preparedAt: new Date(Math.min(...loaded.map((d) => d.preparedAt.getTime()))),
    urls: Object.assign({}, ...loaded.map((d) => d.urls)),
  }
}

export async function deleteDeck(uid, chapterId) {
  const db = await open()
  try {
    const tx = db.transaction(['decks', 'images'], 'readwrite')
    tx.objectStore('decks').delete(deckKey(uid, chapterId))
    tx.objectStore('images').delete(prefixRange(imagePrefix(uid, chapterId)))
    await finished(tx)
  } finally {
    db.close()
  }
}

export async function clearOfflineData() {
  if (typeof indexedDB === 'undefined') return
  const db = await open()
  try {
    const tx = db.transaction(['decks', 'images'], 'readwrite')
    tx.objectStore('decks').clear()
    tx.objectStore('images').clear()
    await finished(tx)
  } finally {
    db.close()
  }
}
