import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Presentation, WifiOff } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { listDecks } from '../services/offlineStore.js'
import { formatDate, pluralWords } from '../utils/format.js'

export default function OfflineHome({ embedded = false }) {
  const { user, recheck } = useAuth()
  const decks = useAsyncData(() => listDecks(user.uid), 'offline-decks')

  useEffect(() => {
    if (embedded) return undefined
    window.addEventListener('online', recheck)
    return () => window.removeEventListener('online', recheck)
  }, [recheck, embedded])

  return (
    <div className={embedded ? 'max-w-2xl' : 'mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12'}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-vermilion-soft text-vermilion"><WifiOff className="h-6 w-6" aria-hidden="true" /></span>
      <h1 className="mt-4 text-page-title">{embedded ? 'Available offline' : 'You’re offline'}</h1>
      <p className="mt-2 text-[16px] text-ink-muted">Editing and syncing need an internet connection. You can still present chapters you prepared on this device.</p>

      <div className="mt-8">
        {decks.loading ? (
          <Skeleton className="h-24" />
        ) : decks.error ? (
          <p role="alert" className="text-[15px] text-[#9B2C20]">{decks.error}</p>
        ) : decks.data.length === 0 ? (
          <Card><p className="font-medium">No chapters are available offline.</p><p className="mt-1 text-[15px] text-ink-muted">When you’re back online, open a chapter and choose “Prepare for offline”.</p></Card>
        ) : (
          <ul className="space-y-3">
            {decks.data.map((d) => (
              <li key={d.key}>
                <Card className="flex flex-wrap items-center justify-between gap-4 !p-5">
                  <div className="min-w-0">
                    <p lang="ja" className="truncate text-lg font-semibold">{d.title}</p>
                    <p className="text-sm text-ink-muted">{pluralWords(d.words.length)} · prepared {formatDate(d.preparedAt)}</p>
                  </div>
                  <Link to={`/present/${d.chapterId}`} tabIndex={-1}><Button icon={Presentation}>Present</Button></Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!embedded && <div className="mt-8"><Button variant="secondary" onClick={recheck}>Try again</Button></div>}
    </div>
  )
}
