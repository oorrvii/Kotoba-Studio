import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildMetadata, planRestore, serializeChapter, serializeWord, sniffImageType, validateBackup, imagePath, thumbPath } from '../src/features/backup/backupModel.js'

const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1, 2])
const d = new Date('2026-01-02T03:04:05Z')
const chapter = { id: 'c1', title: '第1課：場所', description: '', createdAt: d, updatedAt: d }
const word = (id, over = {}) => ({ id, chapterId: 'c1', japanese: '図書館', hiragana: 'としょかん', katakana: '', romaji: '', english: 'library', exampleSentence: '', sentenceTranslation: '', displayOrder: 0, createdAt: d, updatedAt: d, ...over })
const img = { full: { contentType: 'image/webp', width: 800, height: 600 }, thumb: { contentType: 'image/webp', width: 240, height: 180 } }
const files = new Map([[imagePath('w1', 'image/webp'), { size: 5000, type: 'image/webp' }], [thumbPath('w1', 'image/webp'), { size: 900, type: 'image/webp' }]])

function backup(wordsIn = [serializeWord(word('w1'), img)], over = {}) {
  return { metadata: buildMetadata({ chapters: 1, words: wordsIn.length, images: 1, appVersion: '0.1.0' }), chapters: [serializeChapter(chapter)], vocabulary: wordsIn, files, ...over }
}

test('a backup round-trips Japanese text, dates and image links', () => {
  const b = backup()
  const v = validateBackup({ ...JSON.parse(JSON.stringify({ metadata: b.metadata, chapters: b.chapters, vocabulary: b.vocabulary })), files })
  assert.equal(v.issues.length, 0)
  assert.equal(v.words[0].japanese, '図書館')
  assert.equal(v.words[0].createdAt.toISOString(), d.toISOString())
  assert.equal(v.words[0].image.path, 'images/w1.webp')
  assert.equal(v.words[0].image.thumb.path, 'thumbs/w1.webp')
})

test('foreign, damaged and too-new backups are rejected with clear messages', () => {
  assert.throws(() => validateBackup({ ...backup(), metadata: { app: 'other', formatVersion: 1 } }), /isn’t a backup/)
  assert.throws(() => validateBackup({ ...backup(), metadata: { ...backup().metadata, formatVersion: 99 } }), /newer version/)
  assert.throws(() => validateBackup({ ...backup(), vocabulary: null }), /damaged/)
})

test('bad records are excluded and reported, never silently dropped', () => {
  const v = validateBackup(backup([
    serializeWord(word('w1'), img),
    serializeWord(word('w2', { chapterId: 'nope' }), null),
    serializeWord(word('../evil'), null),
    serializeWord(word('w3', { english: '' }), null),
    serializeWord(word('w1'), null),
  ]))
  assert.equal(v.words.length, 1)
  assert.equal(v.issues.filter((i) => i.level === 'error').length, 4)
})

test('a bad image keeps the word but warns; a missing thumbnail is flagged for rebuild', () => {
  const small = new Map([[imagePath('w1', 'image/webp'), { size: 5000, type: 'image/png' }]])
  const v1 = validateBackup(backup(undefined, { files: small }))
  assert.equal(v1.words[0].image, null)
  assert.equal(v1.issues[0].level, 'warning')
  const noThumb = new Map([[imagePath('w1', 'image/webp'), { size: 5000, type: 'image/webp' }]])
  assert.equal(validateBackup(backup(undefined, { files: noThumb })).words[0].image.thumb, null)
  const huge = new Map([[imagePath('w1', 'image/webp'), { size: 2_000_000, type: 'image/webp' }]])
  assert.equal(validateBackup(backup(undefined, { files: huge })).words[0].image, null)
})

test('image type is detected from file bytes, not the name', () => {
  assert.equal(sniffImageType(WEBP), 'image/webp')
  assert.equal(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg')
  assert.equal(sniffImageType(new Uint8Array(20)), null)
})

test('merge adds only missing records and appends after existing words in shared chapters', () => {
  const valid = validateBackup(backup([serializeWord(word('w1'), null), serializeWord(word('w2', { displayOrder: 1 }), null)]))
  const existing = { chapterIds: ['c1'], words: [{ id: 'w1', chapterId: 'c1', displayOrder: 4 }] }
  const plan = planRestore(valid, existing, 'merge')
  assert.deepEqual(plan.chaptersToWrite, [])
  assert.equal(plan.chaptersSkipped.length, 1)
  assert.deepEqual(plan.wordsToWrite.map((w) => [w.id, w.displayOrder]), [['w2', 5]])
  assert.equal(plan.wordsSkipped.length, 1)
  assert.equal(plan.deleteWordIds.length, 0)
})

test('replace overwrites the backup records and deletes only records absent from the file', () => {
  const raw = backup([serializeWord(word('w1'), null), serializeWord(word('w2', { chapterId: 'nope' }), null)])
  const valid = validateBackup(raw)
  const existing = { chapterIds: ['c1', 'c9'], words: [{ id: 'w1', chapterId: 'c1', displayOrder: 0 }, { id: 'w2', chapterId: 'c1', displayOrder: 1 }, { id: 'w7', chapterId: 'c9', displayOrder: 0 }] }
  const plan = planRestore(valid, existing, 'replace')
  assert.deepEqual(plan.deleteWordIds, ['w7'])
  assert.deepEqual(plan.deleteChapterIds, ['c9'])
  assert.deepEqual(plan.clearImageIds, ['w1'])
})
