import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Trash2, WifiOff } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import { ProgressBar } from '../backup/ExportCard.jsx'
import { useToast } from '../ui/Toast.jsx'
import useAsyncData from '../../hooks/useAsyncData.js'
import useOnlineStatus from '../../hooks/useOnlineStatus.js'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { isDeckStale } from '../../features/offline/offlineModel.js'
import { deleteDeck, getDeckMeta } from '../../services/offlineStore.js'
import { prepareDeckOffline } from '../../services/offlineService.js'
import { formatDate, pluralWords } from '../../utils/format.js'

export default function OfflineChapterControl({ chapterId, words }) {
  const { user } = useAuth()
  const toast = useToast()
  const online = useOnlineStatus()
  const meta = useAsyncData(() => getDeckMeta(user.uid, chapterId), `offline-${chapterId}`)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const prepare = async () => {
    setError(null)
    setProgress({ stage: 'Starting', done: 0, total: 0 })
    try {
      const out = await prepareDeckOffline(user.uid, chapterId, setProgress)
      toast.success(`Ready offline: ${pluralWords(out.words)}, ${out.images} ${out.images === 1 ? 'image' : 'images'}.`)
      if (out.missingImages > 0) toast.error(`${out.missingImages} ${out.missingImages === 1 ? 'image was' : 'images were'} missing and won’t show offline.`)
      await meta.reload({ silent: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setProgress(null)
    }
  }

  const remove = async () => {
    try {
      await deleteDeck(user.uid, chapterId)
      toast.success('Offline copy removed from this device.')
      await meta.reload({ silent: true })
    } catch (e) {
      setError(e.message || 'The offline copy couldn’t be removed.')
    }
  }

  const copy = meta.data
  const stale = copy ? isDeckStale(copy, words) : false
  const Icon = copy ? (stale ? AlertTriangle : CheckCircle2) : WifiOff
  const tone = copy ? (stale ? 'bg-[#FBF4E2] text-[#8A6417]' : 'bg-[#E8EEE6] text-sage-dark') : 'bg-surface-muted text-ink-muted'

  return (
    <Card className="mb-6 !p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{copy ? (stale ? 'Offline copy is out of date' : 'Available offline on this device') : 'Not available offline'}</h2>
            <p className="mt-0.5 text-[15px] text-ink-muted">
              {meta.error
                ? meta.error
                : copy
                  ? `Prepared ${formatDate(copy.preparedAt)} · ${pluralWords(copy.words.length)} · ${copy.imageCount} ${copy.imageCount === 1 ? 'image' : 'images'}.${stale ? ' This chapter has changed since. Refresh before your lesson.' : ''}`
                  : 'Prepare this chapter before a lesson if the classroom internet might be unreliable.'}
            </p>
            {copy?.missingImages > 0 && <p className="mt-1 text-[15px] text-[#8A6417]">{copy.missingImages} {copy.missingImages === 1 ? 'image was' : 'images were'} missing when this copy was made.</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={copy && !stale ? 'secondary' : 'primary'} size="sm" icon={Download} onClick={prepare} loading={Boolean(progress)} disabled={!online || words.length === 0}>
            {copy ? 'Refresh offline copy' : 'Prepare for offline'}
          </Button>
          {copy && <Button variant="danger" size="sm" icon={Trash2} onClick={remove} disabled={Boolean(progress)}>Remove</Button>}
        </div>
      </div>
      {!online && <p className="mt-3 text-helper text-ink-muted">Connect to the internet to prepare or refresh an offline copy.</p>}
      {progress && <ProgressBar progress={progress} />}
      {error && <p role="alert" className="mt-3 text-[15px] text-[#9B2C20]">{error}</p>}
    </Card>
  )
}
