import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Download } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import { downloadText } from '../../utils/download.js'

export default function RestoreResult({ result, onAnother }) {
  const clean = result.failures.length === 0 && !result.aborted
  const Icon = clean ? CheckCircle2 : AlertTriangle
  const report = () => downloadText('restore-report.txt', JSON.stringify(result, null, 2))
  return (
    <Card className="mx-auto max-w-2xl">
      <div className="text-center">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${clean ? 'bg-[#E8EEE6] text-sage-dark' : 'bg-[#FBF4E2] text-[#8A6417]'}`}><Icon className="h-7 w-7" aria-hidden="true" /></span>
        <h2 className="mt-4 text-section-title">{clean ? 'Restore complete' : 'Restore finished with problems'}</h2>
      </div>
      <dl className="mx-auto mt-5 grid max-w-sm grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-[16px]">
        <dt>Chapters restored</dt><dd className="text-right font-semibold tabular-nums">{result.chaptersWritten}</dd>
        <dt>Words restored</dt><dd className="text-right font-semibold tabular-nums">{result.wordsWritten}</dd>
        <dt>Images restored</dt><dd className="text-right font-semibold tabular-nums">{result.imagesWritten}</dd>
        {(result.deletedWords > 0 || result.deletedChapters > 0) && <><dt>Removed (not in backup)</dt><dd className="text-right font-semibold tabular-nums">{result.deletedWords} words, {result.deletedChapters} chapters</dd></>}
        <dt>Failed</dt><dd className={`text-right font-semibold tabular-nums ${result.failures.length ? 'text-[#9B2C20]' : ''}`}>{result.failures.length}</dd>
        {result.notAttempted > 0 && <><dt>Not attempted</dt><dd className="text-right font-semibold tabular-nums text-[#9B2C20]">{result.notAttempted}</dd></>}
      </dl>
      {result.aborted && <p role="alert" className="mt-4 text-[15px] text-[#9B2C20]">{result.aborted}</p>}
      {result.failures.length > 0 && (
        <details className="mt-4 rounded-xl border border-[#E3B7B0] bg-[#FBEFED] px-4 py-3" open>
          <summary className="cursor-pointer font-medium">What failed</summary>
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-[15px]">
            {result.failures.slice(0, 50).map((f, i) => <li key={i}><span className="font-medium">{f.kind} “{f.label}”:</span> {f.message}</li>)}
            {result.failures.length > 50 && <li>…and {result.failures.length - 50} more (see the report).</li>}
          </ul>
        </details>
      )}
      {result.warnings.length > 0 && <ul className="mt-4 list-disc space-y-1 pl-5 text-[15px] text-[#8A6417]">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
      {!clean && <p className="mt-4 text-[15px] text-ink-muted">Fix the cause (usually the connection) and restore again with Merge: items that were already restored are kept, so nothing is duplicated.</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" icon={Download} onClick={report}>Download report</Button>
        <Link to="/chapters" tabIndex={-1}><Button variant="secondary">View chapters</Button></Link>
        <Button onClick={onAnother}>Restore another</Button>
      </div>
    </Card>
  )
}
