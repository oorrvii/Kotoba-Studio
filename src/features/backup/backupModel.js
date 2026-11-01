import { CHAPTER_TITLE_MAX, CHAPTER_DESCRIPTION_MAX, validateWord } from '../../lib/validators.js'

export const APP_ID = 'kotoba-studio'
export const FORMAT_VERSION = 1
export const MAX_FULL_IMAGE_BYTES = 900_000
export const MAX_THUMB_BYTES = 60_000

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/
const EXT_TO_TYPE = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' }
const TYPE_TO_EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }

export const extensionFor = (contentType) => TYPE_TO_EXT[contentType] ?? null
export const imagePath = (id, contentType) => `images/${id}.${extensionFor(contentType)}`
export const thumbPath = (id, contentType) => `thumbs/${id}.${extensionFor(contentType)}`

export function sniffImageType(b) {
  if (!b || b.length < 12) return null
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  return null
}

const iso = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : null)

export function serializeChapter(c) {
  return { id: c.id, title: c.title, description: c.description ?? '', createdAt: iso(c.createdAt), updatedAt: iso(c.updatedAt) }
}

export function serializeWord(w, image) {
  return {
    id: w.id, chapterId: w.chapterId, japanese: w.japanese, hiragana: w.hiragana, katakana: w.katakana,
    romaji: w.romaji, english: w.english, exampleSentence: w.exampleSentence, sentenceTranslation: w.sentenceTranslation,
    displayOrder: w.displayOrder, createdAt: iso(w.createdAt), updatedAt: iso(w.updatedAt),
    image: image ? {
      file: imagePath(w.id, image.full.contentType), width: image.full.width, height: image.full.height,
      thumbFile: image.thumb ? thumbPath(w.id, image.thumb.contentType) : null,
      thumbWidth: image.thumb?.width ?? null, thumbHeight: image.thumb?.height ?? null,
    } : null,
  }
}

export const buildMetadata = ({ chapters, words, images, appVersion }) => ({
  app: APP_ID, formatVersion: FORMAT_VERSION, appVersion, exportedAt: new Date().toISOString(),
  counts: { chapters, vocabulary: words, images },
})

const asDate = (v) => { const d = typeof v === 'string' ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null }
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const STRING_FIELDS = ['japanese', 'hiragana', 'katakana', 'romaji', 'english', 'exampleSentence', 'sentenceTranslation']

export function validateBackup({ metadata, chapters, vocabulary, files }) {
  if (!isObject(metadata) || metadata.app !== APP_ID) throw new Error('This file isn’t a backup made by this app.')
  if (!Number.isInteger(metadata.formatVersion) || metadata.formatVersion < 1) throw new Error('This backup has an invalid format version.')
  if (metadata.formatVersion > FORMAT_VERSION) throw new Error(`This backup was made by a newer version of the app (format ${metadata.formatVersion}). Update the app, then try again.`)
  if (!Array.isArray(chapters) || !Array.isArray(vocabulary)) throw new Error('This backup is damaged: the chapter or vocabulary list is missing.')

  const issues = []
  const issue = (level, where, message) => issues.push({ level, where, message })
  const seenChapterIds = new Set()
  const seenWordIds = new Set()
  const validChapters = []
  const validWords = []

  chapters.forEach((c, i) => {
    const where = `Chapter ${i + 1}`
    if (!isObject(c) || typeof c.id !== 'string' || !ID_PATTERN.test(c.id)) return issue('error', where, 'Missing or invalid id. Skipped.')
    if (seenChapterIds.has(c.id)) return issue('error', where, `Duplicate id ${c.id}. Skipped.`)
    seenChapterIds.add(c.id)
    const title = typeof c.title === 'string' ? c.title.trim() : ''
    if (!title || title.length > CHAPTER_TITLE_MAX) return issue('error', `Chapter “${String(c.title ?? '').slice(0, 40)}”`, `Title must be 1–${CHAPTER_TITLE_MAX} characters. Skipped.`)
    const description = typeof c.description === 'string' ? c.description.trim() : ''
    if (description.length > CHAPTER_DESCRIPTION_MAX) return issue('error', `Chapter “${title}”`, 'Description is too long. Skipped.')
    validChapters.push({ id: c.id, title, description, createdAt: asDate(c.createdAt), updatedAt: asDate(c.updatedAt) })
  })
  const chapterIds = new Set(validChapters.map((c) => c.id))

  vocabulary.forEach((w, i) => {
    const where = `Word ${i + 1}${isObject(w) && typeof w.japanese === 'string' ? ` “${w.japanese.slice(0, 30)}”` : ''}`
    if (!isObject(w) || typeof w.id !== 'string' || !ID_PATTERN.test(w.id)) return issue('error', where, 'Missing or invalid id. Skipped.')
    if (seenWordIds.has(w.id)) return issue('error', where, `Duplicate id ${w.id}. Skipped.`)
    seenWordIds.add(w.id)
    if (typeof w.chapterId !== 'string' || !chapterIds.has(w.chapterId)) return issue('error', where, 'Its chapter is missing or invalid in this backup. Skipped.')
    if (STRING_FIELDS.some((f) => w[f] != null && typeof w[f] !== 'string')) return issue('error', where, 'A text field has the wrong type. Skipped.')
    const values = Object.fromEntries(STRING_FIELDS.map((f) => [f, typeof w[f] === 'string' ? w[f].trim() : '']))
    const problems = Object.values(validateWord({ chapterId: w.chapterId, ...values }))
    if (problems.length > 0) return issue('error', where, `${problems.join(' ')} Skipped.`)

    let image = null
    if (w.image != null) {
      const fail = (why) => { issue('warning', where, `Image not restored: ${why} The word itself is restored.`); return null }
      const img = w.image
      const fileMatch = isObject(img) && typeof img.file === 'string' ? img.file.match(new RegExp(`^images/${w.id}\\.(webp|jpg|png)$`)) : null
      const full = fileMatch ? files.get(img.file) : null
      if (!fileMatch) image = fail('the image path is invalid.')
      else if (!full) image = fail('the image file is missing from the ZIP.')
      else if (full.size < 1 || full.size > MAX_FULL_IMAGE_BYTES) image = fail('the image file is empty or too large.')
      else if (full.type !== EXT_TO_TYPE[fileMatch[1]]) image = fail('the image file isn’t a valid picture.')
      else {
        let thumb = null
        const tMatch = typeof img.thumbFile === 'string' ? img.thumbFile.match(new RegExp(`^thumbs/${w.id}\\.(webp|jpg|png)$`)) : null
        const t = tMatch ? files.get(img.thumbFile) : null
        if (t && t.size >= 1 && t.size <= MAX_THUMB_BYTES && t.type === EXT_TO_TYPE[tMatch[1]]) {
          thumb = { path: img.thumbFile, contentType: t.type, width: Number.isInteger(img.thumbWidth) ? img.thumbWidth : 0, height: Number.isInteger(img.thumbHeight) ? img.thumbHeight : 0 }
        }
        image = {
          path: img.file, contentType: full.type,
          width: Number.isInteger(img.width) ? img.width : 0, height: Number.isInteger(img.height) ? img.height : 0,
          thumb,
        }
      }
    }
    validWords.push({
      id: w.id, chapterId: w.chapterId, ...values,
      displayOrder: Number.isInteger(w.displayOrder) ? w.displayOrder : 0,
      createdAt: asDate(w.createdAt), updatedAt: asDate(w.updatedAt), image,
    })
  })

  const expected = metadata.counts
  if (isObject(expected)) {
    if (expected.chapters !== chapters.length) issue('warning', 'Counts', `The backup says ${expected.chapters} chapters but contains ${chapters.length}.`)
    if (expected.vocabulary !== vocabulary.length) issue('warning', 'Counts', `The backup says ${expected.vocabulary} words but contains ${vocabulary.length}.`)
  }
  return { chapters: validChapters, words: validWords, issues, seenChapterIds, seenWordIds }
}

export function planRestore(valid, existing, strategy) {
  const existingChapters = new Set(existing.chapterIds)
  const existingWordIds = new Set(existing.words.map((w) => w.id))

  if (strategy === 'replace') {
    return {
      strategy,
      chaptersToWrite: valid.chapters,
      wordsToWrite: valid.words,
      chaptersSkipped: [],
      wordsSkipped: [],
      deleteWordIds: existing.words.filter((w) => !valid.seenWordIds.has(w.id)).map((w) => w.id),
      deleteChapterIds: existing.chapterIds.filter((id) => !valid.seenChapterIds.has(id)),
      clearImageIds: valid.words.filter((w) => !w.image && existingWordIds.has(w.id)).map((w) => w.id),
    }
  }

  const nextOrder = new Map()
  existing.words.forEach((w) => nextOrder.set(w.chapterId, Math.max(nextOrder.get(w.chapterId) ?? 0, (w.displayOrder ?? 0) + 1)))
  const newWords = valid.words.filter((w) => !existingWordIds.has(w.id)).sort((a, b) => a.displayOrder - b.displayOrder)
  const wordsToWrite = newWords.map((w) => {
    if (!existingChapters.has(w.chapterId)) return w
    const order = nextOrder.get(w.chapterId) ?? 0
    nextOrder.set(w.chapterId, order + 1)
    return { ...w, displayOrder: order }
  })
  return {
    strategy: 'merge',
    chaptersToWrite: valid.chapters.filter((c) => !existingChapters.has(c.id)),
    wordsToWrite,
    chaptersSkipped: valid.chapters.filter((c) => existingChapters.has(c.id)),
    wordsSkipped: valid.words.filter((w) => existingWordIds.has(w.id)),
    deleteWordIds: [],
    deleteChapterIds: [],
    clearImageIds: [],
  }
}
