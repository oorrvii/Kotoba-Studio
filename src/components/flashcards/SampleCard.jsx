import { ImageIcon } from 'lucide-react'

// Static preview of the flashcard design language. The real, data-driven
// Flashcard component is built in Phase 5.
export default function SampleCard({ side = 'front', large = false }) {
  const jp = large ? 'text-[clamp(3rem,8vw,5.5rem)]' : 'text-5xl'
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="flex flex-1 items-center justify-center bg-surface-muted">
        <div className="flex flex-col items-center gap-2 text-ink-muted">
          <ImageIcon className="h-10 w-10" aria-hidden="true" />
          <span className="text-helper">Image appears here</span>
        </div>
      </div>
      <div className="px-8 py-6 text-center">
        <p lang="ja" className={`jp font-bold leading-tight ${jp}`}>図書館</p>
        <p lang="ja" className="jp mt-1 text-xl text-ink-muted">としょかん</p>
        {side === 'back' ? (
          <p className="mt-3 text-3xl font-semibold text-vermilion-dark">library</p>
        ) : (
          <p className="mt-3 text-base text-ink-muted">toshokan</p>
        )}
      </div>
    </div>
  )
}
