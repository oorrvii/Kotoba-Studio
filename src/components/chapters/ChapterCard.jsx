import { Link } from 'react-router-dom'
import { Pencil, Trash2, ChevronRight } from 'lucide-react'
import Card from '../ui/Card.jsx'
import { formatDate, pluralWords } from '../../utils/format.js'

export default function ChapterCard({ chapter, onEdit, onDelete }) {
  return (
    <Card as="article" className="group relative flex flex-col transition-colors hover:border-sand">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-snug">
          <Link to={`/chapters/${chapter.id}`} className="after:absolute after:inset-0 after:rounded-card focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-vermilion">
            {chapter.title}
          </Link>
        </h2>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
      <p className="mt-2 line-clamp-2 min-h-[3rem] text-[15px] text-ink-muted">
        {chapter.description || 'No description'}
      </p>
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">{pluralWords(chapter.wordCount)}</span> · Updated {formatDate(chapter.updatedAt)}
        </p>
        <div className="relative z-10 flex gap-1">
          <button type="button" onClick={() => onEdit(chapter)} aria-label={`Edit ${chapter.title}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted hover:text-ink">
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onDelete(chapter)} aria-label={`Delete ${chapter.title}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted hover:bg-[#FBEFED] hover:text-[#9B2C20]">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Card>
  )
}
