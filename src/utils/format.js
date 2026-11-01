const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDate = (date) => (date ? dateFormat.format(date) : 'Just now')
export const pluralWords = (n) => `${n} ${n === 1 ? 'word' : 'words'}`

export const normalizeText = (s) => (s ?? '').normalize('NFKC').toLowerCase()
