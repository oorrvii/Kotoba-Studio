import { useMemo, useState } from 'react'
import { AlertTriangle, Download } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Modal from '../ui/Modal.jsx'
import { ProgressBar } from './ExportCard.jsx'
import useBackupExport from '../../hooks/useBackupExport.js'
import { formatBytes } from '../../utils/download.js'

const optionClass = 'flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-vermilion has-[:checked]:bg-vermilion-soft'
const when = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? 'unknown date' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) }

function Row({ label, value, tone = '' }) {
  return <div className="contents"><dt className="text-ink-muted">{label}</dt><dd className={`text-right font-semibold tabular-nums ${tone}`}>{value}</dd></div>
}

export default function RestorePreview({ fileName, metadata, validation, plan, strategy, onStrategy, onRestore, onCancel }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const exporter = useBackupExport()
  const errors = validation.issues.filter((i) => i.level === 'error')
  const warnings = validation.issues.filter((i) => i.level === 'warning')
  const images = useMemo(() => plan.wordsToWrite.filter((w) => w.image).length, [plan])
  const replace = strategy === 'replace'
  const nothing = !replace && plan.chaptersToWrite.length === 0 && plan.wordsToWrite.length === 0

  return (
    <div className="space-y-6">
      <p className="text-[15px] text-ink-muted"><strong className="text-ink">{fileName}</strong> · made {when(metadata.exportedAt)} · {metadata.counts?.chapters ?? '?'} chapters, {metadata.counts?.vocabulary ?? '?'} words, {metadata.counts?.images ?? '?'} images</p>

      {validation.issues.length > 0 && (
        <details className="rounded-card border border-[#E8D6AE] bg-[#FBF4E2] px-5 py-4" open={errors.length > 0}>
          <summary className="flex cursor-pointer items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" aria-hidden="true" />{errors.length} {errors.length === 1 ? 'record' : 'records'} can’t be restored · {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}</summary>
          <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-[15px]">
            {validation.issues.slice(0, 50).map((i, idx) => <li key={idx}><span className="font-medium">{i.where}:</span> {i.message}</li>)}
            {validation.issues.length > 50 && <li className="text-ink-muted">…and {validation.issues.length - 50} more.</li>}
          </ul>
        </details>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-1 text-base font-semibold">How should it be restored?</legend>
        <label className={optionClass}>
          <input type="radio" name="strategy" className="mt-1 accent-[#B84A3A]" checked={strategy === 'merge'} onChange={() => onStrategy('merge')} />
          <span><span className="block font-medium">Merge (recommended)</span><span className="block text-sm text-ink-muted">Adds anything missing from your library. Items that already exist are left exactly as they are. Nothing is overwritten or deleted.</span></span>
        </label>
        <label className={optionClass}>
          <input type="radio" name="strategy" className="mt-1 accent-[#9B2C20]" checked={strategy === 'replace'} onChange={() => onStrategy('replace')} />
          <span><span className="block font-medium">Replace my library with this backup</span><span className="block text-sm text-ink-muted">Makes your library match the backup. Matching items are overwritten, and items that are not in the backup are permanently deleted, after the backup has restored cleanly.</span></span>
        </label>
      </fieldset>

      <Card>
        <h2 className="text-base font-semibold">What will happen</h2>
        <dl className="mt-3 grid max-w-md grid-cols-[1fr_auto] gap-x-8 gap-y-1.5 text-[15px]">
          <Row label={replace ? 'Chapters written' : 'Chapters added'} value={plan.chaptersToWrite.length} />
          <Row label={replace ? 'Words written' : 'Words added'} value={plan.wordsToWrite.length} />
          <Row label="…with images" value={images} />
          {!replace && <Row label="Chapters already in library (kept)" value={plan.chaptersSkipped.length} />}
          {!replace && <Row label="Words already in library (kept)" value={plan.wordsSkipped.length} />}
          {replace && <Row label="Words permanently deleted" value={plan.deleteWordIds.length} tone={plan.deleteWordIds.length ? 'text-[#9B2C20]' : ''} />}
          {replace && <Row label="Chapters permanently deleted" value={plan.deleteChapterIds.length} tone={plan.deleteChapterIds.length ? 'text-[#9B2C20]' : ''} />}
        </dl>
        <p className="mt-4 text-helper text-ink-muted">Cloud database writes can’t be undone as one group. If anything fails you will get a list of exactly what wasn’t restored.{replace ? ' In Replace mode nothing is deleted unless everything else restored without a single failure.' : ''} Words with the same Japanese text but different internal IDs are treated as different words.</p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={onCancel}>Choose another file</Button>
        {replace ? (
          <Button variant="dangerSolid" onClick={() => { setTyped(''); setConfirmOpen(true) }} disabled={plan.wordsToWrite.length + plan.chaptersToWrite.length === 0}>Replace my library…</Button>
        ) : (
          <Button onClick={onRestore} disabled={nothing}>{nothing ? 'Nothing new to restore' : `Restore ${plan.wordsToWrite.length} words`}</Button>
        )}
      </div>

      {confirmOpen && (
        <Modal
          open
          onClose={() => !exporter.busy && setConfirmOpen(false)}
          title="Replace your whole library?"
          description={`This overwrites matching items and permanently deletes ${plan.deleteWordIds.length} words and ${plan.deleteChapterIds.length} chapters that aren’t in this backup.`}
        >
          <div className="rounded-xl border border-border bg-surface-muted/60 p-4">
            <p className="text-[15px]">Strongly recommended: download a backup of your current library first, so you can go back.</p>
            <Button className="mt-3" variant="secondary" size="sm" icon={Download} onClick={exporter.run} loading={exporter.busy}>Back up current library first</Button>
            {exporter.busy && exporter.progress && <ProgressBar progress={exporter.progress} />}
            {exporter.summary && <p role="status" className="mt-3 text-[15px] text-sage-dark">Saved {exporter.summary.filename} ({formatBytes(exporter.summary.size)}).</p>}
            {exporter.error && <p role="alert" className="mt-3 text-[15px] text-[#9B2C20]">{exporter.error}</p>}
          </div>
          <Input className="mt-4" label="Type REPLACE to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={exporter.busy}>Cancel</Button>
            <Button variant="dangerSolid" disabled={typed.trim() !== 'REPLACE' || exporter.busy} onClick={() => { setConfirmOpen(false); onRestore() }}>Replace library</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
