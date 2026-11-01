import { Bytes, doc, collection, documentId, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { toFriendlyError } from '../lib/errors.js'

const blobUrl = (d) => URL.createObjectURL(new Blob([d.data.toUint8Array()], { type: d.contentType }))

export async function buildImageDocs(processed) {
  const make = async ({ blob, width, height, contentType }) => ({
    data: Bytes.fromUint8Array(new Uint8Array(await blob.arrayBuffer())),
    contentType, width, height,
  })
  return { full: await make(processed.full), thumb: await make(processed.thumb) }
}

export async function getFullImageUrl(wordId) {
  try {
    const snap = await getDoc(doc(db, 'images', wordId))
    return snap.exists() ? blobUrl(snap.data()) : null
  } catch (e) {
    throw toFriendlyError(e)
  }
}

const thumbCache = new Map()
const cacheKey = ({ id, version }) => `${id}:${version}`

export async function getThumbUrls(items) {
  const missing = items.filter((item) => !thumbCache.has(cacheKey(item)))
  const versions = new Map(items.map((item) => [item.id, item]))
  for (let i = 0; i < missing.length; i += 30) {
    const ids = missing.slice(i, i + 30).map((item) => item.id)
    const snap = await getDocs(query(collection(db, 'thumbs'), where(documentId(), 'in', ids)))
    snap.docs.forEach((d) => thumbCache.set(cacheKey(versions.get(d.id)), blobUrl(d.data())))
  }
  return new Map(items.filter((item) => thumbCache.has(cacheKey(item))).map((item) => [item.id, thumbCache.get(cacheKey(item))]))
}

const fullCache = new Map()

export async function getFullImageUrls(items) {
  const missing = items.filter((item) => !fullCache.has(cacheKey(item)))
  const byId = new Map(items.map((item) => [item.id, item]))
  for (let i = 0; i < missing.length; i += 10) {
    const ids = missing.slice(i, i + 10).map((item) => item.id)
    const snap = await getDocs(query(collection(db, 'images'), where(documentId(), 'in', ids)))
    snap.docs.forEach((d) => fullCache.set(cacheKey(byId.get(d.id)), blobUrl(d.data())))
  }
  return new Map(items.filter((item) => fullCache.has(cacheKey(item))).map((item) => [item.id, fullCache.get(cacheKey(item))]))
}

export async function fetchFullImageBlobs(ids, onProgress = () => {}) {
  const blobs = new Map()
  for (let i = 0; i < ids.length; i += 10) {
    const snap = await getDocs(query(collection(db, 'images'), where(documentId(), 'in', ids.slice(i, i + 10))))
    snap.docs.forEach((d) => blobs.set(d.id, new Blob([d.data().data.toUint8Array()], { type: d.data().contentType })))
    onProgress(Math.min(i + 10, ids.length), ids.length)
  }
  return blobs
}

export function clearImageCache() {
  thumbCache.forEach((url) => URL.revokeObjectURL(url))
  thumbCache.clear()
  fullCache.forEach((url) => URL.revokeObjectURL(url))
  fullCache.clear()
}
