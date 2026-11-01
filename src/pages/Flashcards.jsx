import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageIcon, Layers, Presentation, Search, SearchX } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Select from '../components/ui/Select.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import CardPreviewModal from '../components/flashcards/CardPreviewModal.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import useThumbnails from '../hooks/useThumbnails.js'
import { getAllWords } from '../services/vocabularyService.js'
import { listChapterTitles } from '../services/chapterService.js'
import { normalizeText } from '../utils/format.js'

const PAGE_SIZE = 24

export default function Flashcards() {
  const words = useAsyncData(getAllWords, 'cards-words')
  const chapters = useAsyncData(listChapterTitles, 'cards-chapters')
  const [search, setSearch] = useState('')
  const [chapterFilter, setChapterFilter] = useState('')
  const [imageFilter, setImageFilter] = useState('')
  const [shown, setShown] = useState(PAGE_SIZE)
  const [preview, setPreview] = useState(null)

  const titles = useMemo(() => Object.fromEntries((chapters.data ?? []).map((c) => [c.id, c.title])), [chapters.data])
  const filtered = useMemo(() => {
    const q = normalizeText(search.trim())
    return (words.data ?? []).filter((w) => {
      if (chapterFilter && w.chapterId !== chapterFilter) return false
      if (imageFilter === 'with' && !w.hasImage) return false
      if (imageFilter === 'missing' && w.hasImage) return false
      return !q || normalizeText([w.japanese, w.hiragana, w.katakana, w.romaji, w.english].join(' ')).includes(q)
    })
  }, [words.data, search, chapterFilter, imageFilter])
  const visible = useMemo(() => filtered.slice(0, shown), [filtered, shown])
  const thumbs = useThumbnails(visible)

  const reset = (setter) => (e) => { setter(e.target.value); setShown(PAGE_SIZE) }
  const presentTarget = chapterFilter || 'all'
  const hasCards = (words.data ?? []).length > 0
  const presentButton = (
    <Link to={`/present/${presentTarget}`} tabIndex={-1} aria-disabled={!hasCards}>
      <Button icon={Presentation} disabled={!hasCards}>{chapterFilter ? 'Present chapter' : 'Present all'}</Button>
    </Link>
  )

  return (
    <>
      <PageHeader title="Flashcards" description="Every saved word is a flashcard. Preview one, or present a whole chapter." actions={presentButton} />
      {words.error ? (
        <ErrorState title="Couldn’t load flashcards" message={words.error} onRetry={words.reload} />
      ) : words.loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : !hasCards ? (
        <EmptyState icon={Layers} title="No flashcards yet" description="Flashcards appear automatically once you add vocabulary." action={<Link to="/vocabulary/new" tabIndex={-1}><Button>Add Vocabulary</Button></Link>} />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(240px,1fr)_200px_180px]">
            <div className="relative">
              <label htmlFor="card-search" className="sr-only">Search flashcards</label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input id="card-search" type="search" lang="ja" value={search} onChange={reset(setSearch)} placeholder="Search cards" className="min-h-[44px] w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-[15px] hover:border-sand focus-visible:outline-offset-0" />
            </div>
            <Select label="" aria-label="Filter by chapter" value={chapterFilter} onChange={reset(setChapterFilter)} className="[&>label]:sr-only">
              <option value="">All chapters</option>
              {(chapters.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
            <Select label="" aria-label="Filter by image" value={imageFilter} onChange={reset(setImageFilter)} className="[&>label]:sr-only">
              <option value="">Any image status</option>
              <option value="with">Has image</option>
              <option value="missing">Missing image</option>
            </Select>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={SearchX} title="No cards match" description="Try a different search or filter." action={<Button variant="secondary" onClick={() => { setSearch(''); setChapterFilter(''); setImageFilter('') }}>Clear filters</Button>} />
          ) : (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((w) => (
                  <li key={w.id}>
                    <button type="button" onClick={() => setPreview(w)} aria-label={`Preview ${w.japanese}`} className="flex w-full flex-col overflow-hidden rounded-card border border-border bg-surface text-left shadow-card transition-colors hover:border-sand">
                      <span className="flex aspect-[4/3] items-center justify-center bg-surface-muted text-ink-muted">
                        {thumbs[w.id] ? <img src={thumbs[w.id]} alt="" loading="lazy" className="h-full w-full object-contain" /> : <ImageIcon className="h-8 w-8" aria-hidden="true" />}
                      </span>
                      <span className="block px-4 py-3">
                        <span lang="ja" className="jp block truncate text-2xl font-bold">{w.japanese}</span>
                        <span className="block truncate text-[15px]">{w.english}</span>
                        <span className="block truncate text-helper text-ink-muted">{titles[w.chapterId] ?? ''}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {filtered.length > shown && <div className="mt-6 flex justify-center"><Button variant="secondary" onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more ({filtered.length - shown} left)</Button></div>}
            </>
          )}
        </>
      )}
      {preview && <CardPreviewModal word={preview} onClose={() => setPreview(null)} />}
    </>
  )
}
