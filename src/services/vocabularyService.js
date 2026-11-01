import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, where, writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { AppError, toFriendlyError } from '../lib/errors.js'
import { withTimeout } from '../lib/network.js'
import { buildImageDocs } from './imageService.js'

const vocabCol = () => collection(db, 'vocabulary')
const toDate = (ts) => (ts?.toDate ? ts.toDate() : null)

function toWord(snap) {
  const d = snap.data()
  return {
    id: snap.id,
    chapterId: d.chapterId,
    japanese: d.japanese ?? '',
    hiragana: d.hiragana ?? '',
    katakana: d.katakana ?? '',
    romaji: d.romaji ?? '',
    english: d.english ?? '',
    hasImage: d.hasImage === true,
    exampleSentence: d.exampleSentence ?? '',
    sentenceTranslation: d.sentenceTranslation ?? '',
    displayOrder: d.displayOrder ?? 0,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  }
}

const byOrder = (a, b) => a.displayOrder - b.displayOrder || (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)

export async function getChapterWords(chapterId) {
  try {
    const snap = await getDocs(query(vocabCol(), where('chapterId', '==', chapterId)))
    return snap.docs.map(toWord).sort(byOrder)
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function getAllWords() {
  try {
    const snap = await getDocs(vocabCol())
    return snap.docs.map(toWord).sort((a, b) => (b.updatedAt?.getTime() ?? Infinity) - (a.updatedAt?.getTime() ?? Infinity))
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function getRecentWords(count = 5) {
  try {
    const snap = await getDocs(query(vocabCol(), orderBy('updatedAt', 'desc'), limit(count)))
    return snap.docs.map(toWord)
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function getWord(wordId) {
  try {
    const snap = await getDoc(doc(db, 'vocabulary', wordId))
    if (!snap.exists()) throw new AppError('This word doesn’t exist or was deleted.', 'not-found')
    return toWord(snap)
  } catch (e) {
    throw toFriendlyError(e)
  }
}

async function nextOrder(chapterId) {
  const snap = await getDocs(query(vocabCol(), where('chapterId', '==', chapterId)))
  return snap.docs.reduce((max, d) => Math.max(max, d.data().displayOrder ?? 0), -1) + 1
}

export async function saveWord({ id, values, image }) {
  try {
    const ref = id ? doc(db, 'vocabulary', id) : doc(vocabCol())
    let existing = null
    if (id) {
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new AppError('This word was deleted on another device, so it can’t be saved.', 'not-found')
      existing = snap.data()
    }
    const imageDocs = image.kind === 'set' ? await buildImageDocs(image.processed) : null

    const batch = writeBatch(db)
    let hasImage = existing?.hasImage === true
    if (image.kind === 'set') {
      hasImage = true
      batch.set(doc(db, 'images', ref.id), { ...imageDocs.full, updatedAt: serverTimestamp() })
      batch.set(doc(db, 'thumbs', ref.id), { ...imageDocs.thumb, updatedAt: serverTimestamp() })
    } else if (image.kind === 'remove') {
      hasImage = false
      batch.delete(doc(db, 'images', ref.id))
      batch.delete(doc(db, 'thumbs', ref.id))
    }

    const chapterChanged = !existing || existing.chapterId !== values.chapterId
    const displayOrder = chapterChanged ? await nextOrder(values.chapterId) : existing.displayOrder ?? 0
    const fields = {
      chapterId: values.chapterId,
      japanese: values.japanese.trim(),
      hiragana: values.hiragana.trim(),
      katakana: values.katakana.trim(),
      romaji: values.romaji.trim(),
      english: values.english.trim(),
      exampleSentence: values.exampleSentence.trim(),
      sentenceTranslation: values.sentenceTranslation.trim(),
      hasImage,
      displayOrder,
      updatedAt: serverTimestamp(),
    }
    if (id) batch.update(ref, fields)
    else batch.set(ref, { ...fields, createdAt: serverTimestamp() })

    await withTimeout(batch.commit())
    return ref.id
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function deleteWord(wordId) {
  try {
    const batch = writeBatch(db)
    batch.delete(doc(db, 'vocabulary', wordId))
    batch.delete(doc(db, 'images', wordId))
    batch.delete(doc(db, 'thumbs', wordId))
    await withTimeout(batch.commit())
  } catch (e) {
    throw toFriendlyError(e)
  }
}

export async function reorderWords(orderedWords) {
  try {
    const changed = orderedWords
      .map((word, index) => ({ word, index }))
      .filter(({ word, index }) => word.displayOrder !== index)
    for (let i = 0; i < changed.length; i += 400) {
      const batch = writeBatch(db)
      changed.slice(i, i + 400).forEach(({ word, index }) => batch.update(doc(db, 'vocabulary', word.id), { displayOrder: index }))
      await withTimeout(batch.commit())
    }
  } catch (e) {
    throw toFriendlyError(e)
  }
}
