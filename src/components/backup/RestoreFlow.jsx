import { useMemo, useRef, useState } from 'react'
import { ArchiveRestore, Loader2 } from 'lucide-react'
import Card from '../ui/Card.jsx'
import RestorePreview from './RestorePreview.jsx'
import RestoreResult from './RestoreResult.jsx'
import { ProgressBar } from './ExportCard.jsx'
import { planRestore } from '../../features/backup/backupModel.js'
import { getRestoreContext, readBackup, restoreBackup } from '../../services/restoreService.js'
import { clearImageCache } from '../../services/imageService.js'

export default function RestoreFlow() {
  const inputRef = useRef(null)
  const [step, setStep] = useState('choose')
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loaded, setLoaded] = useState(null)
  const [strategy, setStrategy] = useState('merge')
  const [result, setResult] = useState(null)

  const plan = useMemo(() => (loaded ? planRestore(loaded.validation, loaded.context, strategy) : null), [loaded, strategy])

  const reset = () => { setStep('choose'); setError(null); setLoaded(null); setStrategy('merge'); setResult(null); setProgress(null) }

  const handleFile = async (file) => {
    if (!file) return
    setStep('reading')
    setError(null)
    setProgress({ stage: 'Opening backup', done: 0, total: 0 })
    try {
      const { metadata, validation, bytes } = await readBackup(file, setProgress)
      const context = await getRestoreContext()
      setLoaded({ fileName: file.name, metadata, validation, bytes, context })
      setStep('preview')
    } catch (e) {
      setError(e.message)
      setStep('choose')
    }
  }

  const start = async () => {
    setStep('restoring')
    setProgress({ stage: 'Starting', done: 0, total: 0 })
    try {
      const outcome = await restoreBackup({ plan, bytes: loaded.bytes, onProgress: setProgress })
      clearImageCache()
      setResult(outcome)
      setStep('done')
    } catch (e) {
      setError(e.message)
      setStep('preview')
    }
  }

  return (
    <section aria-labelledby="restore-heading">
      {step === 'choose' || step === 'reading' ? (
        <Card>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-vermilion-soft text-vermilion"><ArchiveRestore className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <h2 id="restore-heading" className="text-section-title">Restore from a backup</h2>
              <p className="mt-1.5 text-[15px] text-ink-muted">Choose a backup ZIP made by this app. It is checked first, and you will see exactly what will change before anything is saved.</p>
              <button type="button" disabled={step === 'reading'} onClick={() => inputRef.current?.click()} className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-surface px-4 text-[15px] font-medium hover:bg-surface-muted disabled:opacity-60">
                {step === 'reading' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArchiveRestore className="h-4 w-4" aria-hidden="true" />}Choose backup file
              </button>
              <input ref={inputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }} />
              {step === 'reading' && progress && <ProgressBar progress={progress} />}
              {error && <p role="alert" className="mt-4 rounded-xl border border-[#E3B7B0] bg-[#FBEFED] px-4 py-3 text-[15px] text-[#9B2C20]">{error}</p>}
            </div>
          </div>
        </Card>
      ) : (
        <h2 id="restore-heading" className="mb-4 text-section-title">Restore from a backup</h2>
      )}
      {step === 'preview' && loaded && (
        <>
          {error && <p role="alert" className="mb-4 rounded-xl border border-[#E3B7B0] bg-[#FBEFED] px-4 py-3 text-[15px] text-[#9B2C20]">{error}</p>}
          <RestorePreview fileName={loaded.fileName} metadata={loaded.metadata} validation={loaded.validation} plan={plan} strategy={strategy} onStrategy={setStrategy} onRestore={start} onCancel={reset} />
        </>
      )}
      {step === 'restoring' && (
        <Card className="text-center" role="status">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-vermilion" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold">Restoring…</h3>
          <p className="text-ink-muted">Keep this page open until it finishes.</p>
          {progress && <div className="mx-auto max-w-md text-left"><ProgressBar progress={progress} /></div>}
        </Card>
      )}
      {step === 'done' && result && <RestoreResult result={result} onAnother={reset} />}
    </section>
  )
}
