import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, BookPlus, Presentation, BookOpen, ChevronRight } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import ChapterFormModal from '../components/chapters/ChapterFormModal.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import { getChapters } from '../services/chapterService.js'
import { getRecentWords } from '../services/vocabularyService.js'
import useThumbnails from '../hooks/useThumbnails.js'
import WordList from '../components/vocabulary/WordList.jsx'
import { formatDate, pluralWords } from '../utils/format.js'

function Metric({ label, value, loading }) {
  return (
    <Card>
      <p className="text-sm text-ink-muted">{label}</p>
      {loading ? <Skeleton className="mt-2 h-10 w-16" /> : <p className="mt-1 text-4xl font-semibold tabular-nums">{value}</p>}
    </Card>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, loading, error, reload } = useAsyncData(getChapters, 'dashboard')
  const recentWords = useAsyncData(() => getRecentWords(5), 'dashboard-words')
  const recentList = useMemo(() => recentWords.data ?? [], [recentWords.data])
  const thumbs = useThumbnails(recentList)
  const [creating, setCreating] = useState(false)

  const totalWords = useMemo(() => (data ?? []).reduce((sum, c) => sum + c.wordCount, 0), [data])
  const recent = useMemo(
    () => [...(data ?? [])].sort((a, b) => (b.updatedAt?.getTime() ?? Infinity) - (a.updatedAt?.getTime() ?? Infinity)).slice(0, 4),
    [data],
  )

  return (
    <>
      <PageHeader
        title="Welcome back"
        description="Add vocabulary, organise chapters, and present your next lesson."
        actions={<Link to="/vocabulary/new" tabIndex={-1}><Button icon={Plus}>Add Vocabulary</Button></Link>}
      />
      {error ? (
        <ErrorState title="Couldn’t load your workspace" message={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <Metric label="Chapters" value={data?.length ?? 0} loading={loading} />
            <Metric label="Vocabulary entries" value={totalWords} loading={loading} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" icon={BookPlus} onClick={() => setCreating(true)}>Create Chapter</Button>
            <Link to="/flashcards" tabIndex={-1}><Button variant="secondary" icon={Presentation}>Present</Button></Link>
          </div>
          <section className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-section-title">Recently updated chapters</h2>
              {data?.length > 0 && <Link to="/chapters" className="text-sm font-medium text-vermilion-dark hover:underline">View all</Link>}
            </div>
            {loading ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : recent.length === 0 ? (
              <EmptyState icon={BookOpen} title="No chapters yet" description="Create your first chapter to start collecting vocabulary." action={<Button icon={Plus} onClick={() => setCreating(true)}>Create Chapter</Button>} />
            ) : (
              <Card padded={false} className="divide-y divide-border">
                {recent.map((c) => (
                  <Link key={c.id} to={`/chapters/${c.id}`} className="flex min-h-[64px] items-center justify-between gap-4 px-5 py-3 first:rounded-t-card last:rounded-b-card hover:bg-surface-muted">
                    <span className="min-w-0">
                      <span lang="ja" className="block truncate font-medium">{c.title}</span>
                      <span className="block text-sm text-ink-muted">{pluralWords(c.wordCount)} · Updated {formatDate(c.updatedAt)}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  </Link>
                ))}
              </Card>
            )}
          </section>
          {recentList.length > 0 && (
            <section className="mt-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-section-title">Recent vocabulary</h2>
                <Link to="/vocabulary" className="text-sm font-medium text-vermilion-dark hover:underline">View all</Link>
              </div>
              <WordList words={recentList} thumbs={thumbs} />
            </section>
          )}
        </>
      )}
      {creating && (
        <ChapterFormModal
          onClose={() => setCreating(false)}
          onSaved={({ id }) => { setCreating(false); toast.success('Chapter created.'); navigate(`/chapters/${id}`) }}
        />
      )}
    </>
  )
}
