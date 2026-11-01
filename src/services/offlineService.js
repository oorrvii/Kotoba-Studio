import { AppError, toFriendlyError } from '../lib/errors.js'
import { sourceStamp } from '../features/offline/offlineModel.js'
import { fetchFullImageBlobs } from './imageService.js'
import { loadDeck } from './presentationService.js'
import { countDeck, loadAllSavedDecks, loadSavedDeck, saveDeck } from './offlineStore.js'

function toOfflineError(e) {
  if (e?.name === 'QuotaExceededError') return new AppError('There isn’t enough free storage on this device for the offline copy. Free some space and try again.', 'quota')
  return toFriendlyError(e)
}

async function warmFonts(words) {
  if (!document.fonts?.load) return
  const jp = [...new Set(words.flatMap((w) => [w.japanese, w.hiragana, w.katakana, w.exampleSentence, w.sentenceTranslation, w.english, w.romaji]).join(''))].join('')
  await Promise.allSettled([
    ...['400', '500', '700'].map((weight) => document.fonts.load(`${weight} 1em "Noto Sans JP"`, jp)),
    ...['400', '500', '600'].map((weight) => document.fonts.load(`${weight} 1em Inter`, 'AaBbCc0123456789 / ·')),
  ])
}

export async function prepareDeckOffline(uid, chapterId, onProgress = () => {}) {
  try {
    onProgress({ stage: 'Reading chapter', done: 0, total: 0 })
    const deck = await loadDeck(chapterId)
    if (deck.words.length === 0) throw new AppError('Add vocabulary to this chapter first.', 'empty')

    const withImages = deck.words.filter((w) => w.hasImage).map((w) => w.id)
    const blobs = await fetchFullImageBlobs(withImages, (done, total) => onProgress({ stage: 'Downloading images', done, total }))
    const missingImages = withImages.length - blobs.size

    onProgress({ stage: 'Preparing fonts', done: 0, total: 0 })
    await warmFonts(deck.words)

    onProgress({ stage: 'Saving on this device', done: 0, total: 0 })
    await saveDeck({ uid, chapterId, title: deck.title, words: deck.words, stamp: sourceStamp(deck.words), preparedAt: new Date(), missingImages }, blobs)

    const check = await countDeck(uid, chapterId)
    if (!check || check.words !== deck.words.length || check.images !== blobs.size) {
      throw new AppError('The offline copy couldn’t be verified, so it can’t be relied on. Please try again.', 'verify')
    }
    return { words: deck.words.length, images: blobs.size, missingImages }
  } catch (e) {
    throw toOfflineError(e)
  }
}

export async function loadOfflineDeck(uid, chapterId) {
  const exact = await loadSavedDeck(uid, chapterId)
  if (exact || chapterId !== 'all') return exact
  return loadAllSavedDecks(uid)
}
