import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, BookOpen } from 'lucide-react'
import Skeleton from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import Button from '../components/ui/Button.jsx'
import VocabularyForm from '../components/vocabulary/VocabularyForm.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import { getWord } from '../services/vocabularyService.js'
import { listChapterTitles } from '../services/chapterService.js'

export default function VocabularyEdit() {
  const { wordId } = useParams()
  const [params] = useSearchParams()
  const editing = Boolean(wordId)
  const word = useAsyncData(() => (editing ? getWord(wordId) : Promise.resolve(null)), wordId ?? 'new')
  const chapters = useAsyncData(listChapterTitles, 'form-chapters')

  const error = word.error || chapters.error
  const loading = word.loading || chapters.loading || (!error && !chapters.data)

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link to="/vocabulary" className="rounded hover:text-ink hover:underline">Vocabulary</Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="text-ink">{editing ? 'Edit word' : 'Add word'}</span>
      </nav>
      <h1 className="mb-8 text-page-title">{editing ? 'Edit vocabulary' : 'Add vocabulary'}</h1>

      {error ? (
        <ErrorState title="Couldn’t load the form" message={error} onRetry={() => { word.reload(); chapters.reload() }} />
      ) : loading ? (
        <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-56" /></div>
      ) : chapters.data.length === 0 ? (
        <EmptyState icon={BookOpen} title="Create a chapter first" description="Every word belongs to a chapter, so add one before adding vocabulary." action={<Link to="/chapters" tabIndex={-1}><Button>Go to Chapters</Button></Link>} />
      ) : (
        <VocabularyForm key={word.data?.id ?? 'new'} word={word.data} chapters={chapters.data} defaultChapterId={params.get('chapter')} />
      )}
    </>
  )
}
