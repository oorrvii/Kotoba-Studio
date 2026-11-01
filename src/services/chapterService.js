import {
  addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs,
  orderBy, query, serverTimestamp, updateDoc, where, writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { AppError, toFriendlyError } from '../lib/errors.js'
import { withTimeout } from '../lib/network.js'

const chaptersCol = () => collection(db, 'chapters')
const vocabCol = () => collection(db, 'vocabulary')
const BATCH_SIZE = 150

const toDate = (ts) => (ts?.toDate ? ts.toDate() : null)

function toChapter(snap, wordCount = 0) {
  const d = snap.data()
  return {
    id: snap.id,
    title: d.title,
    description: d.description ?? '',
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    wordCount,
  }
}

async function countWords(chapterId) {
  const snap = await getCountFromServer(query(vocabCol(), where('chapterId', '==', chapterId)))
  return snap.data().count
}

export async function getChapters() {
  try {
    const snap = await getDocs(query(chaptersCol(), orderBy('createdAt', 'asc')))
    return await Promise.all(snap.docs.map(async (d) => toChapter(d, await countWords(d.id))))
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function listChapterTitles() {
  try {
    const snap = await getDocs(query(chaptersCol(), orderBy('createdAt', 'asc')))
    return snap.docs.map((d) => ({ id: d.id, title: d.data().title }))
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function getChapter(chapterId) {
  try {
    const snap = await getDoc(doc(db, 'chapters', chapterId))
    if (!snap.exists()) throw new AppError('This chapter doesn’t exist or was deleted.', 'not-found')
    return toChapter(snap, await countWords(chapterId))
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function createChapter({ title, description }) {
  try {
    const ref = await withTimeout(addDoc(chaptersCol(), {
      title: title.trim(),
      description: description.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
    return ref.id
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function updateChapter(chapterId, { title, description }) {
  try {
    await withTimeout(updateDoc(doc(db, 'chapters', chapterId), {
      title: title.trim(),
      description: description.trim(),
      updatedAt: serverTimestamp(),
    }))
    return chapterId
  } catch (e) {
    throw toFriendlyError(e)
  }
}

async function inChunks(items, size, run) {
  for (let i = 0; i < items.length; i += size) {
    const batch = writeBatch(db)
    items.slice(i, i + size).forEach((item, offset) => run(batch, item, i + offset))
    await withTimeout(batch.commit())
  }
}

async function moveWords(wordDocs, targetChapterId, sourceChapterId) {
  if (!targetChapterId || targetChapterId === sourceChapterId) {
    throw new AppError('Choose a different chapter to move the vocabulary to.', 'bad-target')
  }
  const target = await getDoc(doc(db, 'chapters', targetChapterId))
  if (!target.exists()) throw new AppError('The chapter you chose no longer exists.', 'not-found')

  const existing = await getDocs(query(vocabCol(), where('chapterId', '==', targetChapterId)))
  const start = existing.docs.reduce((max, d) => Math.max(max, d.data().displayOrder ?? 0), -1) + 1
  const ordered = [...wordDocs].sort((a, b) => (a.data().displayOrder ?? 0) - (b.data().displayOrder ?? 0))

  await inChunks(ordered, BATCH_SIZE, (batch, word, index) => {
    batch.update(word.ref, { chapterId: targetChapterId, displayOrder: start + index, updatedAt: serverTimestamp() })
  })
}

async function deleteWords(wordDocs) {
  await inChunks(wordDocs, BATCH_SIZE, (batch, word) => {
    batch.delete(word.ref)
    batch.delete(doc(db, 'images', word.id))
    batch.delete(doc(db, 'thumbs', word.id))
  })
}

export async function deleteChapter(chapterId, strategy) {
  try {
    const words = await getDocs(query(vocabCol(), where('chapterId', '==', chapterId)))
    if (words.size > 0) {
      if (strategy?.type === 'move') await moveWords(words.docs, strategy.targetChapterId, chapterId)
      else if (strategy?.type === 'delete') await deleteWords(words.docs)
      else throw new AppError('Choose what to do with the vocabulary in this chapter.', 'strategy-required')
    }
    if ((await countWords(chapterId)) > 0) {
      throw new AppError('This chapter still contains vocabulary, so it was not deleted. Please try again.', 'not-empty')
    }
    await withTimeout(deleteDoc(doc(db, 'chapters', chapterId)))
  } catch (e) {
    throw toFriendlyError(e)
  }
}
