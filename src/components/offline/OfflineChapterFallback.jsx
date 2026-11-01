import { Link } from 'react-router-dom'
import { Presentation, WifiOff } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Button from '../ui/Button.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import useAsyncData from '../../hooks/useAsyncData.js'
import { useAuth } from '../../features/auth/AuthContext.jsx'
import { getDeckMeta } from '../../services/offlineStore.js'
import { formatDate, pluralWords } from '../../utils/format.js'

export default function OfflineChapterFallback({ chapterId }) {
  const { user } = useAuth()
  const copy = useAsyncData(() => getDeckMeta(user.uid, chapterId), `fallback-${chapterId}`)

  if (copy.loading) return <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40" /></div>
  if (copy.error) return <p role="alert" className="text-[15px] text-[#9B2C20]">{copy.error}</p>

  if (!copy.data) {
    return (
      <Card className="max-w-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-muted"><WifiOff className="h-6 w-6" aria-hidden="true" /></span>
        <h1 className="mt-4 text-page-title">This chapter isn’t available offline</h1>
        <p className="mt-2 text-[16px] text-ink-muted">You’re offline, and this chapter wasn’t prepared on this device. When you’re back online, open it and choose “Prepare for offline”.</p>
        <Link to="/offline" tabIndex={-1}><Button className="mt-5" variant="secondary">See chapters prepared for offline</Button></Link>
      </Card>
    )
  }

  const { title, words, preparedAt } = copy.data
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <h1 lang="ja" className="text-page-title">{title}</h1>
          <p className="mt-2 text-[16px] text-ink-muted">You’re offline. This is the copy saved on {formatDate(preparedAt)}. Editing is unavailable until you reconnect.</p>
          <p className="mt-2 text-sm text-ink-muted">{pluralWords(words.length)}</p>
        </div>
        <Link to={`/present/${chapterId}`} tabIndex={-1}><Button size="lg" icon={Presentation}>Present offline</Button></Link>
      </div>
      <Card padded={false} className="divide-y divide-border">
        {words.map((w) => (
          <div key={w.id} className="px-5 py-3">
            <p><span lang="ja" className="jp text-xl font-bold">{w.japanese}</span>{(w.hiragana || w.katakana) && <span lang="ja" className="jp ml-3 text-[15px] text-ink-muted">{[w.hiragana, w.katakana].filter(Boolean).join(' · ')}</span>}</p>
            <p className="text-[15px]">{w.english}</p>
          </div>
        ))}
      </Card>
    </>
  )
}
