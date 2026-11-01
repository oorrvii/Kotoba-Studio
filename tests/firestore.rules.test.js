import { test, before, after, beforeEach } from 'node:test'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { Bytes, doc, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'

let env
const now = new Date()
const chapter = { title: 'Chapter 1', description: '', createdAt: now, updatedAt: now }
const word = (over = {}) => ({
  chapterId: 'c1', japanese: '図書館', english: 'library', displayOrder: 0, createdAt: now, updatedAt: now, ...over,
})

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-kotoba', firestore: { rules: readFileSync('firestore.rules', 'utf8') } })
})
after(() => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'owner/config'), { uids: ['owner', 'owner2'] })
    await setDoc(doc(ctx.firestore(), 'chapters/c1'), chapter)
  })
})

const owner = () => env.authenticatedContext('owner').firestore()
const owner2 = () => env.authenticatedContext('owner2').firestore()
const other = () => env.authenticatedContext('intruder').firestore()
const anon = () => env.unauthenticatedContext().firestore()

test('anonymous users cannot read or write anything', async () => {
  await assertFails(getDoc(doc(anon(), 'chapters/c1')))
  await assertFails(setDoc(doc(anon(), 'chapters/x'), chapter))
})

test('a second Google account is denied everywhere', async () => {
  await assertFails(getDoc(doc(other(), 'chapters/c1')))
  await assertFails(setDoc(doc(other(), 'chapters/x'), chapter))
  await assertFails(setDoc(doc(other(), 'vocabulary/w1'), word()))
  await assertFails(getDoc(doc(other(), 'images/w1')))
  await assertFails(getDoc(doc(other(), 'owner/config')))
})

test('nobody can edit the owner config, even the owner', async () => {
  await assertFails(setDoc(doc(owner(), 'owner/config'), { uids: ['intruder'] }))
  await assertFails(setDoc(doc(other(), 'owner/config'), { uids: ['intruder'] }))
})

test('both authorised accounts share the same data', async () => {
  await assertSucceeds(setDoc(doc(owner(), 'chapters/shared'), chapter))
  await assertSucceeds(getDoc(doc(owner2(), 'chapters/shared')))
  await assertSucceeds(setDoc(doc(owner2(), 'vocabulary/w9'), word()))
})

test('owner can read their own owner config', async () => {
  await assertSucceeds(getDoc(doc(owner(), 'owner/config')))
})

test('owner can create, read and delete chapters', async () => {
  await assertSucceeds(setDoc(doc(owner(), 'chapters/c2'), chapter))
  await assertSucceeds(getDoc(doc(owner(), 'chapters/c2')))
  await assertSucceeds(deleteDoc(doc(owner(), 'chapters/c2')))
})

test('chapter validation rejects empty titles and unknown fields', async () => {
  await assertFails(setDoc(doc(owner(), 'chapters/c3'), { ...chapter, title: '' }))
  await assertFails(setDoc(doc(owner(), 'chapters/c3'), { ...chapter, admin: true }))
})

test('vocabulary must reference an existing chapter and keep Japanese text', async () => {
  await assertSucceeds(setDoc(doc(owner(), 'vocabulary/w1'), word()))
  await assertFails(setDoc(doc(owner(), 'vocabulary/w2'), word({ chapterId: 'missing' })))
  await assertFails(setDoc(doc(owner(), 'vocabulary/w3'), word({ english: '' })))
})

test('images must be small image bytes', async () => {
  const img = (size, contentType = 'image/webp') => ({
    data: Bytes.fromUint8Array(new Uint8Array(size)), contentType, width: 100, height: 100, updatedAt: now,
  })
  await assertSucceeds(setDoc(doc(owner(), 'images/w1'), img(5000)))
  await assertFails(setDoc(doc(owner(), 'images/w2'), img(950000)))
  await assertFails(setDoc(doc(owner(), 'images/w3'), img(5000, 'text/html')))
})

test('thumbnails are small, owner-only image bytes', async () => {
  const thumb = (size) => ({ data: Bytes.fromUint8Array(new Uint8Array(size)), contentType: 'image/webp', width: 240, height: 180, updatedAt: now })
  await assertSucceeds(setDoc(doc(owner(), 'thumbs/w1'), thumb(20000)))
  await assertFails(setDoc(doc(owner(), 'thumbs/w2'), thumb(70000)))
  await assertFails(setDoc(doc(other(), 'thumbs/w3'), thumb(2000)))
  await assertFails(getDoc(doc(other(), 'thumbs/w1')))
})

test('a word can be saved with an image in one atomic batch', async () => {
  const db = owner()
  const batch = writeBatch(db)
  batch.set(doc(db, 'vocabulary/w5'), word({ hasImage: true }))
  batch.set(doc(db, 'images/w5'), { data: Bytes.fromUint8Array(new Uint8Array(4000)), contentType: 'image/webp', width: 800, height: 600, updatedAt: now })
  await assertSucceeds(batch.commit())
})
