import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Languages, Pencil, Plus, Presentation, Search, SearchX, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import ChapterFormModal from '../components/chapters/ChapterFormModal.jsx'
import DeleteChapterModal from '../components/chapters/DeleteChapterModal.jsx'
import WordList from '../components/vocabulary/WordList.jsx'
import DeleteWordModal from '../components/vocabulary/DeleteWordModal.jsx'
import OfflineChapterControl from '../components/offline/OfflineChapterControl.jsx'
import OfflineChapterFallback from '../components/offline/OfflineChapterFallback.jsx'
import useOnlineStatus from '../hooks/useOnlineStatus.js'
import useAsyncData from '../hooks/useAsyncData.js'
import useThumbnails from '../hooks/useThumbnails.js'
import { getChapter } from '../services/chapterService.js'
import { getChapterWords, reorderWords } from '../services/vocabularyService.js'
import { formatDate, normalizeText, pluralWords } from '../utils/format.js'

export default function ChapterDetail() {
  const { chapterId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const online = useOnlineStatus()
  const chapterData = useAsyncData(() => getChapter(chapterId), chapterId)
  const wordData = useAsyncData(() => getChapterWords(chapterId), chapterId)
  const { data: chapter } = chapterData
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [wordToDelete, setWordToDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [reordering, setReordering] = useState(false)

  const words = useMemo(() => wordData.data ?? [], [wordData.data])
  const visible = useMemo(() => {
    const q = normalizeText(search.trim())
    return q ? words.filter((w) => normalizeText([w.japanese, w.hiragana, w.katakana, w.romaji, w.english].join(' ')).includes(q)) : words
  }, [words, search])
  const thumbs = useThumbnails(visible)
  const refreshAll = () => { chapterData.reload({ silent: true }); wordData.reload({ silent: true }) }

  const move = async (index, direction) => {
    const next = [...words]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setReordering(true)
    try {
      await reorderWords(next)
      await wordData.reload({ silent: true })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setReordering(false)
    }
  }

  const addLink = `/vocabulary/new?chapter=${chapterId}`
  const error = chapterData.error || wordData.error

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link to="/chapters" className="rounded hover:text-ink hover:underline">Chapters</Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="max-w-[60vw] truncate text-ink">{chapter?.title ?? '…'}</span>
      </nav>

      {!online && !chapter ? (
        <OfflineChapterFallback chapterId={chapterId} />
      ) : error ? (
        <ErrorState title="Couldn’t open this chapter" message={error} onRetry={() => { chapterData.reload(); wordData.reload() }} />
      ) : chapterData.loading || wordData.loading || !chapter ? (
        <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-40 w-full" /></div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <h1 lang="ja" className="text-page-title">{chapter.title}</h1>
              {chapter.description && <p className="mt-2 whitespace-pre-line text-[16px] text-ink-muted">{chapter.description}</p>}
              <p className="mt-3 text-sm text-ink-muted">{pluralWords(words.length)} · Updated {formatDate(chapter.updatedAt)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={addLink} tabIndex={-1}><Button icon={Plus}>Add Vocabulary</Button></Link>
              <Link to={`/present/${chapterId}`} tabIndex={-1} aria-disabled={words.length === 0}><Button variant="secondary" icon={Presentation} disabled={words.length === 0}>Present Chapter</Button></Link>
              <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="danger" icon={Trash2} onClick={() => setDeleting(true)}>Delete</Button>
            </div>
          </div>

          <OfflineChapterControl chapterId={chapterId} words={words} />

          {words.length === 0 ? (
            <EmptyState icon={Languages} title="No vocabulary in this chapter yet" description="Add a word with its Japanese, meaning and an image." action={<Link to={addLink} tabIndex={-1}><Button icon={Plus}>Add Vocabulary</Button></Link>} />
          ) : (
            <>
              <div className="relative mb-5 max-w-md">
                <label htmlFor="chapter-word-search" className="sr-only">Search this chapter</label>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                <input id="chapter-word-search" type="search" lang="ja" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search this chapter" className="min-h-[44px] w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-[15px] hover:border-sand focus-visible:outline-offset-0" />
              </div>
              {visible.length === 0 ? (
                <EmptyState icon={SearchX} title="No words match" description={`Nothing in this chapter matches “${search.trim()}”.`} action={<Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>} />
              ) : (
                <>
                  <WordList words={visible} thumbs={thumbs} onDelete={setWordToDelete} reorder={search.trim() ? undefined : { onMove: move, busy: reordering }} />
                  {search.trim() && <p className="mt-3 text-helper text-ink-muted">Clear the search to reorder words.</p>}
                </>
              )}
            </>
          )}

          {editing && (
            <ChapterFormModal chapter={chapter} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); toast.success('Chapter updated.'); refreshAll() }} />
          )}
          {deleting && (
            <DeleteChapterModal chapter={{ ...chapter, wordCount: words.length }} onClose={() => setDeleting(false)} onDeleted={(c) => { toast.success(`“${c.title}” was deleted.`); navigate('/chapters', { replace: true }) }} />
          )}
          {wordToDelete && (
            <DeleteWordModal word={wordToDelete} onClose={() => setWordToDelete(null)} onDeleted={(w) => { setWordToDelete(null); toast.success(`“${w.japanese}” was deleted.`); refreshAll() }} />
          )}
        </>
      )}
    </>
  )
}
