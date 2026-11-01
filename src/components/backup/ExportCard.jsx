import { Archive, CheckCircle2, Download } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import useBackupExport from '../../hooks/useBackupExport.js'
import { formatBytes } from '../../utils/download.js'

export function ProgressBar({ progress }) {
  const pct = progress.total ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0
  return (
    <div role="status" className="mt-4">
      <p className="text-[15px] text-ink-muted">{progress.stage}{progress.total ? ` (${progress.done} of ${progress.total})` : '…'}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={progress.stage}>
        <div className="h-full rounded-full bg-vermilion transition-[width]" style={{ width: `${progress.total ? pct : 8}%` }} />
      </div>
    </div>
  )
}

export default function ExportCard() {
  const { busy, progress, error, summary, run } = useBackupExport()
  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vermilion-soft text-vermilion"><Archive className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-section-title">Export full backup</h2>
          <p className="mt-1.5 text-[15px] text-ink-muted">Downloads one ZIP file with every chapter, every word and the original image files. Keep a copy somewhere safe, such as a USB drive or your own cloud storage. A backup is your protection if this account is ever lost.</p>
          <Button className="mt-5" icon={Download} onClick={run} loading={busy}>Export full backup</Button>
          {busy && progress && <ProgressBar progress={progress} />}
          {error && <p role="alert" className="mt-4 text-[15px] text-[#9B2C20]">{error}</p>}
          {summary && (
            <div role="status" className="mt-5 rounded-xl border border-border bg-surface-muted/60 p-4">
              <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-5 w-5 text-sage-dark" aria-hidden="true" />Backup created: {summary.filename}</p>
              <p className="mt-1 text-[15px] text-ink-muted">{summary.counts.chapters} chapters · {summary.counts.words} words · {summary.counts.images} images · {formatBytes(summary.size)}. Check your Downloads folder.</p>
              {summary.warnings.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] text-[#8A6417]">{summary.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
