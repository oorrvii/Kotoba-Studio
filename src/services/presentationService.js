import { getChapter, listChapterTitles } from './chapterService.js'
import { getAllWords, getChapterWords } from './vocabularyService.js'

export async function loadDeck(chapterId) {
  if (chapterId === 'all') {
    const [words, chapters] = await Promise.all([getAllWords(), listChapterTitles()])
    const rank = new Map(chapters.map((c, i) => [c.id, i]))
    words.sort((a, b) => (rank.get(a.chapterId) ?? 1e9) - (rank.get(b.chapterId) ?? 1e9) || a.displayOrder - b.displayOrder)
    return { title: 'All vocabulary', words }
  }
  const [chapter, words] = await Promise.all([getChapter(chapterId), getChapterWords(chapterId)])
  return { title: chapter.title, words }
}
