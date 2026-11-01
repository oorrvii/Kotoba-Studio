import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Languages, Plus, Search, SearchX } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Select from '../components/ui/Select.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import WordList from '../components/vocabulary/WordList.jsx'
import DeleteWordModal from '../components/vocabulary/DeleteWordModal.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import useThumbnails from '../hooks/useThumbnails.js'
import { getAllWords } from '../services/vocabularyService.js'
import { listChapterTitles } from '../services/chapterService.js'
import { normalizeText } from '../utils/format.js'

const PAGE_SIZE = 30

export default function Vocabulary() {
  const toast = useToast()
  const words = useAsyncData(getAllWords, 'all-words')
  const chapters = useAsyncData(listChapterTitles, 'all-words-chapters')
  const [search, setSearch] = useState('')
  const [chapterFilter, setChapterFilter] = useState('')
  const [imageFilter, setImageFilter] = useState('')
  const [shown, setShown] = useState(PAGE_SIZE)
  const [toDelete, setToDelete] = useState(null)

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
  const filtersActive = Boolean(search.trim() || chapterFilter || imageFilter)
  const clearFilters = () => { setSearch(''); setChapterFilter(''); setImageFilter(''); setShown(PAGE_SIZE) }
  const resetPaging = (setter) => (value) => { setter(value); setShown(PAGE_SIZE) }

  const add = <Link to="/vocabulary/new" tabIndex={-1}><Button icon={Plus}>Add Vocabulary</Button></Link>

  return (
    <>
      <PageHeader title="All Vocabulary" description="Every word across all chapters. Search Japanese, kana, romaji or English." actions={add} />
      {words.error ? (
        <ErrorState title="Couldn’t load vocabulary" message={words.error} onRetry={words.reload} />
      ) : words.loading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : words.data.length === 0 ? (
        <EmptyState icon={Languages} title="No vocabulary yet" description="Add your first word with its image. You’ll need at least one chapter." action={add} />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(240px,1fr)_200px_180px]">
            <div className="relative">
              <label htmlFor="word-search" className="sr-only">Search vocabulary</label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input id="word-search" type="search" lang="ja" value={search} onChange={(e) => resetPaging(setSearch)(e.target.value)} placeholder="Search words" className="min-h-[44px] w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-[15px] hover:border-sand focus-visible:outline-offset-0" />
            </div>
            <Select label="" aria-label="Filter by chapter" value={chapterFilter} onChange={(e) => resetPaging(setChapterFilter)(e.target.value)} className="[&>label]:sr-only">
              <option value="">All chapters</option>
              {(chapters.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
            <Select label="" aria-label="Filter by image" value={imageFilter} onChange={(e) => resetPaging(setImageFilter)(e.target.value)} className="[&>label]:sr-only">
              <option value="">Any image status</option>
              <option value="with">Has image</option>
              <option value="missing">Missing image</option>
            </Select>
          </div>
          <p className="mb-3 text-sm text-ink-muted" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'word' : 'words'}{filtersActive ? ' match' : ''}</p>
          {filtered.length === 0 ? (
            <EmptyState icon={SearchX} title="No words match" description="Try a different search or clear the filters." action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} />
          ) : (
            <>
              <WordList words={visible} thumbs={thumbs} chapterTitles={titles} onDelete={setToDelete} />
              {filtered.length > shown && (
                <div className="mt-6 flex justify-center"><Button variant="secondary" onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more ({filtered.length - shown} left)</Button></div>
              )}
            </>
          )}
        </>
      )}
      {toDelete && (
        <DeleteWordModal
          word={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={(w) => { setToDelete(null); toast.success(`“${w.japanese}” was deleted.`); words.reload({ silent: true }) }}
        />
      )}
    </>
  )
}
