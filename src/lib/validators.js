export const CHAPTER_TITLE_MAX = 120
export const CHAPTER_DESCRIPTION_MAX = 2000

export function validateChapter({ title, description }) {
  const errors = {}
  const t = title.trim()
  if (!t) errors.title = 'Enter a chapter title.'
  else if (t.length > CHAPTER_TITLE_MAX) errors.title = `Keep the title under ${CHAPTER_TITLE_MAX} characters.`
  if (description.trim().length > CHAPTER_DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${CHAPTER_DESCRIPTION_MAX.toLocaleString('en-IN')} characters.`
  }
  return errors
}

export const WORD_LIMITS = {
  japanese: 200, hiragana: 200, katakana: 200, romaji: 200,
  english: 300, exampleSentence: 1000, sentenceTranslation: 1000,
}

export function validateWord(values) {
  const errors = {}
  if (!values.chapterId) errors.chapterId = 'Choose a chapter.'
  if (!values.japanese.trim()) errors.japanese = 'Enter the Japanese word.'
  if (!values.english.trim()) errors.english = 'Enter the English meaning.'
  Object.entries(WORD_LIMITS).forEach(([key, max]) => {
    if (!errors[key] && values[key].trim().length > max) errors[key] = `Keep this under ${max} characters.`
  })
  return errors
}
