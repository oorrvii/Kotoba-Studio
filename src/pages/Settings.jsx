import { useState } from 'react'
import { LogOut, Trash2 } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import useAsyncData from '../hooks/useAsyncData.js'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { clearOfflineData, deleteDeck, listDecks } from '../services/offlineStore.js'
import { APP_VERSION } from '../lib/constants.js'
import { formatDate, pluralWords } from '../utils/format.js'

export default function Settings() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const decks = useAsyncData(() => listDecks(user.uid), 'settings-decks')
  const [busy, setBusy] = useState(false)

  const removeOne = async (deck) => {
    try {
      await deleteDeck(user.uid, deck.chapterId)
      toast.success(`Offline copy of “${deck.title}” removed.`)
      decks.reload({ silent: true })
    } catch (e) {
      toast.error(e.message || 'The offline copy couldn’t be removed.')
    }
  }
  const removeAll = async () => {
    try {
      await clearOfflineData()
      toast.success('All offline copies removed from this device.')
      decks.reload({ silent: true })
    } catch (e) {
      toast.error(e.message || 'Offline copies couldn’t be removed.')
    }
  }
  const handleSignOut = async () => {
    setBusy(true)
    const result = await signOut()
    if (!result.ok) { toast.error(result.error); setBusy(false) } else if (result.warning) toast.error(result.warning)
  }

  return (
    <>
      <PageHeader title="Settings" description="Your account and what is stored on this device." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-section-title">Account</h2>
          <p className="mt-2 text-[15px] text-ink-muted">Signed in as</p>
          <p className="font-medium">{user?.email}</p>
          <p className="mt-3 text-[15px] text-ink-muted">Signing out also removes all offline copies from this device, which matters on a shared or classroom computer.</p>
          <Button className="mt-4" variant="secondary" icon={LogOut} onClick={handleSignOut} loading={busy}>Sign out</Button>
        </Card>

        <Card>
          <h2 className="text-section-title">Offline presentations</h2>
          <p className="mt-2 text-[15px] text-ink-muted">Chapters prepared on this device. Prepare a chapter from its own page. Each copy is only on this device.</p>
          <div className="mt-4">
            {decks.loading ? (
              <Skeleton className="h-16" />
            ) : decks.error ? (
              <p role="alert" className="text-[15px] text-[#9B2C20]">{decks.error}</p>
            ) : decks.data.length === 0 ? (
              <p className="rounded-xl bg-surface-muted px-4 py-3 text-[15px]">No chapters are available offline.</p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {decks.data.map((d) => (
                  <li key={d.key} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p lang="ja" className="truncate font-medium">{d.title}</p>
                      <p className="text-sm text-ink-muted">{pluralWords(d.words.length)} · prepared {formatDate(d.preparedAt)}</p>
                    </div>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => removeOne(d)} aria-label={`Remove offline copy of ${d.title}`}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {decks.data?.length > 1 && <Button className="mt-4" variant="danger" size="sm" onClick={removeAll}>Remove all offline copies</Button>}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-section-title">About</h2>
          <p className="mt-2 text-[15px] text-ink-muted">Kotoba Studio · version {APP_VERSION}. Your words and images are stored in your own Firebase project. Use Backup &amp; Restore to keep a copy you control.</p>
        </Card>
      </div>
    </>
  )
}
