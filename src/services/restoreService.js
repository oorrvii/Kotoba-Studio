import JSZip from 'jszip'
import { Bytes, Timestamp, collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { toFriendlyError } from '../lib/errors.js'
import { withTimeout } from '../lib/network.js'
import { sniffImageType, validateBackup } from '../features/backup/backupModel.js'
import { createThumbnail } from '../utils/imageProcessing.js'
import { getAllWords } from './vocabularyService.js'

const MAX_ZIP_BYTES = 300 * 1024 * 1024
const MAX_ENTRIES = 10_000
const STOP_CODES = ['unavailable', 'permission-denied', 'resource-exhausted', 'deadline-exceeded', 'timeout']
const stamp = (date) => (date ? Timestamp.fromDate(date) : serverTimestamp())
const commit = (batch) => withTimeout(batch.commit(), 60000)

export async function readBackup(file, onProgress = () => {}) {
  if (file.size > MAX_ZIP_BYTES) throw new Error('This file is larger than 300 MB, so it can’t be a backup from this app.')
  let zip
  try {
    zip = await JSZip.loadAsync(file)
  } catch {
    throw new Error('This file isn’t a valid ZIP archive.')
  }
  const names = Object.keys(zip.files)
  if (names.length > MAX_ENTRIES) throw new Error('This ZIP contains too many files to be a backup from this app.')

  const readJson = async (name) => {
    const entry = zip.file(name)
    if (!entry) throw new Error(`The backup is missing ${name}, so it can’t be restored.`)
    try {
      return JSON.parse(await entry.async('string'))
    } catch {
      throw new Error(`${name} is damaged and can’t be read.`)
    }
  }
  const metadata = await readJson('backup-metadata.json')
  const chapters = await readJson('chapters.json')
  const vocabulary = await readJson('vocabulary.json')

  const bytes = new Map()
  const files = new Map()
  const media = names.filter((n) => /^(images|thumbs)\/[^/]+$/.test(n) && !zip.files[n].dir)
  let done = 0
  for (const name of media) {
    const data = await zip.file(name).async('uint8array')
    bytes.set(name, data)
    files.set(name, { size: data.length, type: sniffImageType(data) })
    done += 1
    if (done % 10 === 0 || done === media.length) onProgress({ stage: 'Checking images', done, total: media.length })
  }
  return { metadata, validation: validateBackup({ metadata, chapters, vocabulary, files }), bytes }
}

export async function getRestoreContext() {
  try {
    const [chapterSnap, words] = await Promise.all([getDocs(collection(db, 'chapters')), getAllWords()])
    return {
      chapterIds: chapterSnap.docs.map((d) => d.id),
      words: words.map((w) => ({ id: w.id, chapterId: w.chapterId, displayOrder: w.displayOrder })),
    }
  } catch (e) {
    throw toFriendlyError(e)
  }
}

async function buildWord(w, bytes, warnings) {
  const data = {
    chapterId: w.chapterId, japanese: w.japanese, hiragana: w.hiragana, katakana: w.katakana, romaji: w.romaji,
    english: w.english, exampleSentence: w.exampleSentence, sentenceTranslation: w.sentenceTranslation,
    hasImage: Boolean(w.image), displayOrder: w.displayOrder, createdAt: stamp(w.createdAt), updatedAt: stamp(w.updatedAt),
  }
  if (!w.image) return { data, images: null, weight: 2000 }

  const fullBytes = bytes.get(w.image.path)
  const full = { data: Bytes.fromUint8Array(fullBytes), contentType: w.image.contentType, width: w.image.width, height: w.image.height }
  let thumb = null
  let thumbSize = 0
  if (w.image.thumb) {
    const tb = bytes.get(w.image.thumb.path)
    thumb = { data: Bytes.fromUint8Array(tb), contentType: w.image.thumb.contentType, width: w.image.thumb.width, height: w.image.thumb.height }
    thumbSize = tb.length
  } else {
    try {
      const t = await createThumbnail(new Blob([fullBytes], { type: w.image.contentType }))
      const tb = new Uint8Array(await t.blob.arrayBuffer())
      thumb = { data: Bytes.fromUint8Array(tb), contentType: t.contentType, width: t.width, height: t.height }
      thumbSize = tb.length
    } catch {
      warnings.push(`“${w.japanese}”: the thumbnail couldn’t be rebuilt, so lists will show a placeholder until the image is re-saved.`)
    }
  }
  return { data, images: { full, thumb }, weight: 2000 + fullBytes.length + thumbSize }
}

function queueWord(batch, id, built) {
  batch.set(doc(db, 'vocabulary', id), built.data)
  if (built.images) {
    batch.set(doc(db, 'images', id), { ...built.images.full, updatedAt: serverTimestamp() })
    if (built.images.thumb) batch.set(doc(db, 'thumbs', id), { ...built.images.thumb, updatedAt: serverTimestamp() })
  }
}

export async function restoreBackup({ plan, bytes, onProgress = () => {} }) {
  const failures = []
  const warnings = []
  const result = { chaptersWritten: 0, wordsWritten: 0, imagesWritten: 0, deletedWords: 0, deletedChapters: 0, notAttempted: 0, aborted: null, failures, warnings }
  const replace = plan.strategy === 'replace'
  const total = plan.chaptersToWrite.length + plan.wordsToWrite.length + (replace ? plan.deleteWordIds.length + plan.deleteChapterIds.length + plan.clearImageIds.length : 0)
  let done = 0
  const tick = (n, stage) => { done += n; onProgress({ stage, done, total }) }
  onProgress({ stage: 'Starting', done: 0, total })

  for (let i = 0; i < plan.chaptersToWrite.length; i += 300) {
    const chunk = plan.chaptersToWrite.slice(i, i + 300)
    try {
      const batch = writeBatch(db)
      chunk.forEach((c) => batch.set(doc(db, 'chapters', c.id), { title: c.title, description: c.description, createdAt: stamp(c.createdAt), updatedAt: stamp(c.updatedAt) }))
      await commit(batch)
      result.chaptersWritten += chunk.length
      tick(chunk.length, 'Restoring chapters')
    } catch (e) {
      const message = toFriendlyError(e).message
      chunk.forEach((c) => failures.push({ kind: 'Chapter', label: c.title, message }))
      result.aborted = `Chapters could not be restored (${message}) so vocabulary was not attempted.`
      result.notAttempted = plan.wordsToWrite.length
      return result
    }
  }

  let chunk = []
  let weight = 0
  let stopped = false
  const flush = async () => {
    if (chunk.length === 0 || stopped) return
    const current = chunk
    chunk = []
    weight = 0
    try {
      const batch = writeBatch(db)
      current.forEach(({ w, built }) => queueWord(batch, w.id, built))
      await commit(batch)
      result.wordsWritten += current.length
      result.imagesWritten += current.filter((x) => x.built.images).length
    } catch (e) {
      if (STOP_CODES.includes(e?.code)) {
        const message = toFriendlyError(e).message
        current.forEach(({ w }) => failures.push({ kind: 'Word', label: w.japanese, message }))
        result.aborted = `Stopped: ${message}`
        stopped = true
        return
      }
      for (const { w, built } of current) {
        try {
          const batch = writeBatch(db)
          queueWord(batch, w.id, built)
          await commit(batch)
          result.wordsWritten += 1
          if (built.images) result.imagesWritten += 1
        } catch (err) {
          failures.push({ kind: 'Word', label: w.japanese, message: toFriendlyError(err).message })
        }
      }
    }
    tick(current.length, 'Restoring vocabulary and images')
  }

  for (let i = 0; i < plan.wordsToWrite.length && !stopped; i += 1) {
    const w = plan.wordsToWrite[i]
    const built = await buildWord(w, bytes, warnings)
    chunk.push({ w, built })
    weight += built.weight
    if (chunk.length >= 100 || weight > 4_000_000) await flush()
  }
  await flush()
  if (stopped) {
    result.notAttempted = plan.wordsToWrite.length - result.wordsWritten - failures.filter((f) => f.kind === 'Word').length
    return result
  }

  if (replace && failures.length === 0) {
    const removeWords = async (ids) => {
      const batch = writeBatch(db)
      ids.forEach((id) => { batch.delete(doc(db, 'vocabulary', id)); batch.delete(doc(db, 'images', id)); batch.delete(doc(db, 'thumbs', id)) })
      await commit(batch)
    }
    try {
      for (let i = 0; i < plan.deleteWordIds.length; i += 130) {
        const ids = plan.deleteWordIds.slice(i, i + 130)
        await removeWords(ids)
        result.deletedWords += ids.length
        tick(ids.length, 'Removing words not in the backup')
      }
      for (let i = 0; i < plan.deleteChapterIds.length; i += 300) {
        const ids = plan.deleteChapterIds.slice(i, i + 300)
        const batch = writeBatch(db)
        ids.forEach((id) => batch.delete(doc(db, 'chapters', id)))
        await commit(batch)
        result.deletedChapters += ids.length
        tick(ids.length, 'Removing chapters not in the backup')
      }
      for (let i = 0; i < plan.clearImageIds.length; i += 200) {
        const ids = plan.clearImageIds.slice(i, i + 200)
        const batch = writeBatch(db)
        ids.forEach((id) => { batch.delete(doc(db, 'images', id)); batch.delete(doc(db, 'thumbs', id)) })
        await commit(batch)
        tick(ids.length, 'Cleaning up images')
      }
    } catch (e) {
      failures.push({ kind: 'Cleanup', label: 'Removing records not in the backup', message: toFriendlyError(e).message })
    }
  } else if (replace) {
    result.warnings.push('Because some records failed to restore, nothing was deleted from your library.')
  }
  return result
}
