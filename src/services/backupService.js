import JSZip from 'jszip'
import { collection, documentId, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { toFriendlyError } from '../lib/errors.js'
import { APP_VERSION } from '../lib/constants.js'
import { buildMetadata, imagePath, serializeChapter, serializeWord, thumbPath } from '../features/backup/backupModel.js'
import { getAllWords } from './vocabularyService.js'

const toDate = (ts) => (ts?.toDate ? ts.toDate() : null)

async function fetchImageDocs(name, ids, chunkSize, onChunk) {
  const found = new Map()
  for (let i = 0; i < ids.length; i += chunkSize) {
    const snap = await getDocs(query(collection(db, name), where(documentId(), 'in', ids.slice(i, i + chunkSize))))
    snap.docs.forEach((d) => {
      const x = d.data()
      found.set(d.id, { bytes: x.data.toUint8Array(), contentType: x.contentType, width: x.width, height: x.height })
    })
    onChunk(Math.min(i + chunkSize, ids.length), ids.length)
  }
  return found
}

export async function createFullBackup(onProgress = () => {}) {
  try {
    onProgress({ stage: 'Reading chapters and vocabulary', done: 0, total: 0 })
    const [chapterSnap, words] = await Promise.all([getDocs(collection(db, 'chapters')), getAllWords()])
    const chapters = chapterSnap.docs.map((d) => ({
      id: d.id, title: d.data().title, description: d.data().description ?? '',
      createdAt: toDate(d.data().createdAt), updatedAt: toDate(d.data().updatedAt),
    }))

    const ids = words.filter((w) => w.hasImage).map((w) => w.id)
    const full = await fetchImageDocs('images', ids, 10, (done, total) => onProgress({ stage: 'Downloading images', done, total }))
    const thumbs = await fetchImageDocs('thumbs', ids, 30, () => {})

    const zip = new JSZip()
    const warnings = []
    let imageCount = 0
    const wordRecords = words.map((w) => {
      let image = null
      if (w.hasImage) {
        const f = full.get(w.id)
        if (!f) {
          warnings.push(`“${w.japanese}” is marked as having an image, but the image data is missing, so it is not in the backup.`)
        } else {
          const t = thumbs.get(w.id) ?? null
          zip.file(imagePath(w.id, f.contentType), f.bytes, { binary: true, compression: 'STORE' })
          if (t) zip.file(thumbPath(w.id, t.contentType), t.bytes, { binary: true, compression: 'STORE' })
          image = { full: f, thumb: t }
          imageCount += 1
        }
      }
      return serializeWord(w, image)
    })

    const metadata = buildMetadata({ chapters: chapters.length, words: wordRecords.length, images: imageCount, appVersion: APP_VERSION })
    const json = (v) => JSON.stringify(v, null, 2)
    zip.file('backup-metadata.json', json(metadata), { compression: 'DEFLATE' })
    zip.file('chapters.json', json(chapters.map(serializeChapter)), { compression: 'DEFLATE' })
    zip.file('vocabulary.json', json(wordRecords), { compression: 'DEFLATE' })

    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true }, (m) => onProgress({ stage: 'Creating ZIP file', done: Math.round(m.percent), total: 100 }))
    return {
      blob,
      filename: `kotoba-backup-${new Date().toISOString().slice(0, 10)}.zip`,
      counts: { chapters: chapters.length, words: wordRecords.length, images: imageCount },
      warnings,
    }
  } catch (e) {
    throw toFriendlyError(e)
  }
}
