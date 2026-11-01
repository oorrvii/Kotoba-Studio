import { useMemo, useState } from 'react'
import { Plus, Search, BookOpen, SearchX } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import ChapterCard from '../components/chapters/ChapterCard.jsx'
import ChapterFormModal from '../components/chapters/ChapterFormModal.jsx'
import DeleteChapterModal from '../components/chapters/DeleteChapterModal.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import { getChapters } from '../services/chapterService.js'
import { normalizeText } from '../utils/format.js'

const byUpdated = (a, b) => (b.updatedAt?.getTime() ?? Infinity) - (a.updatedAt?.getTime() ?? Infinity)

export default function Chapters() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(getChapters, 'chapters')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('updated')
  const [form, setForm] = useState({ open: false, chapter: null })
  const [toDelete, setToDelete] = useState(null)

  const visible = useMemo(() => {
    const q = normalizeText(search.trim())
    const list = (data ?? []).filter((c) => !q || normalizeText(`${c.title} ${c.description}`).includes(q))
    return [...list].sort(sort === 'name' ? (a, b) => a.title.localeCompare(b.title) : sort === 'created' ? () => 0 : byUpdated)
  }, [data, search, sort])

  const openCreate = () => setForm({ open: true, chapter: null })

  return (
    <>
      <PageHeader title="Chapters" description="Group vocabulary into lessons, then present a whole chapter at once." actions={<Button icon={Plus} onClick={openCreate}>Create Chapter</Button>} />

      {error ? (
        <ErrorState title="Couldn’t load chapters" message={error} onRetry={reload} />
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState icon={BookOpen} title="No chapters yet" description="Create your first chapter, then add vocabulary to it." action={<Button icon={Plus} onClick={openCreate}>Create Chapter</Button>} />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:max-w-md">
              <label htmlFor="chapter-search" className="sr-only">Search chapters</label>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input id="chapter-search" type="search" lang="ja" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chapters" className="min-h-[44px] w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-[15px] hover:border-sand focus-visible:outline-offset-0" />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-[44px] rounded-xl border border-border bg-surface px-3 text-[15px] text-ink">
                <option value="updated">Last updated</option>
                <option value="created">Oldest first</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
          {visible.length === 0 ? (
            <EmptyState icon={SearchX} title="No chapters match your search" description={`Nothing matches “${search.trim()}”.`} action={<Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((c) => (
                <ChapterCard key={c.id} chapter={c} onEdit={(chapter) => setForm({ open: true, chapter })} onDelete={setToDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {form.open && (
        <ChapterFormModal
          chapter={form.chapter}
          onClose={() => setForm({ open: false, chapter: null })}
          onSaved={({ created }) => {
            setForm({ open: false, chapter: null })
            toast.success(created ? 'Chapter created.' : 'Chapter updated.')
            reload()
          }}
        />
      )}
      {toDelete && (
        <DeleteChapterModal
          chapter={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={(c) => {
            setToDelete(null)
            toast.success(`“${c.title}” was deleted.`)
            reload()
          }}
        />
      )}
    </>
  )
}
