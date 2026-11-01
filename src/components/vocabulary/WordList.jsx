import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ImageIcon, Pencil, Trash2 } from 'lucide-react'
import Card from '../ui/Card.jsx'

const iconBtn = 'flex h-11 w-11 items-center justify-center rounded-xl text-ink-muted hover:bg-surface-muted hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent'

export default function WordList({ words, thumbs = {}, chapterTitles, onDelete, reorder }) {
  return (
    <Card padded={false} className="divide-y divide-border">
      {words.map((w, index) => (
        <div key={w.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-muted text-ink-muted">
            {thumbs[w.id] ? <img src={thumbs[w.id]} alt="" loading="lazy" className="h-full w-full object-contain" /> : <ImageIcon className="h-5 w-5" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate">
              <Link to={`/vocabulary/${w.id}/edit`} lang="ja" className="jp text-xl font-bold hover:underline">{w.japanese}</Link>
              {(w.hiragana || w.katakana) && <span lang="ja" className="jp ml-3 text-[15px] text-ink-muted">{[w.hiragana, w.katakana].filter(Boolean).join(' · ')}</span>}
            </p>
            <p className="truncate text-[15px]">{w.english}</p>
            {chapterTitles && <p className="truncate text-helper text-ink-muted">{chapterTitles[w.chapterId] ?? 'Unknown chapter'}</p>}
          </div>
          <div className="flex shrink-0 items-center">
            {reorder && (
              <>
                <button type="button" className={iconBtn} aria-label={`Move ${w.japanese} up`} disabled={reorder.busy || index === 0} onClick={() => reorder.onMove(index, -1)}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" className={iconBtn} aria-label={`Move ${w.japanese} down`} disabled={reorder.busy || index === words.length - 1} onClick={() => reorder.onMove(index, 1)}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
              </>
            )}
            <Link to={`/vocabulary/${w.id}/edit`} className={iconBtn} aria-label={`Edit ${w.japanese}`}><Pencil className="h-4 w-4" aria-hidden="true" /></Link>
            {onDelete && <button type="button" className={`${iconBtn} hover:!bg-[#FBEFED] hover:!text-[#9B2C20]`} aria-label={`Delete ${w.japanese}`} onClick={() => onDelete(w)}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>}
          </div>
        </div>
      ))}
    </Card>
  )
}
