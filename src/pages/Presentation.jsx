import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Layers, WifiOff } from 'lucide-react'
import FullPageMessage from '../components/ui/FullPageMessage.jsx'
import Button from '../components/ui/Button.jsx'
import PresentationStage from '../components/flashcards/PresentationStage.jsx'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { loadDeck } from '../services/presentationService.js'
import { loadOfflineDeck } from '../services/offlineService.js'
import { listDecks } from '../services/offlineStore.js'
import { formatDate } from '../utils/format.js'

async function explainMissingCopy(uid, chapterId, readError) {
  if (readError) {
    console.error('Offline copy could not be read', readError)
    return `This chapter’s offline copy exists on this device but couldn’t be read (${readError.message || readError.name}). Reconnect and use “Refresh offline copy”.`
  }
  let others = ''
  try {
    const decks = uid ? await listDecks(uid) : []
    others = decks.length > 0 ? ` Prepared on this device: ${decks.map((d) => d.title).join(', ')}.` : ' Nothing has been prepared on this device yet.'
  } catch {}
  return `You’re offline and this chapter (${chapterId === 'all' ? 'all vocabulary' : 'id ' + chapterId}) hasn’t been prepared for offline use on this device.${others} When you’re back online, open the chapter and choose “Prepare for offline”.`
}

export default function Presentation() {
  const { chapterId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const uid = user?.uid
  const [state, setState] = useState({ status: 'loading', deck: null, offline: false, error: null })
  const exitTo = chapterId === 'all' ? '/flashcards' : `/chapters/${chapterId}`

  const load = useCallback(async () => {
    setState({ status: 'loading', deck: null, offline: false, error: null })
    const savedCopy = async () => {
      try { return { copy: uid ? await loadOfflineDeck(uid, chapterId) : null, readError: null } } catch (readError) { return { copy: null, readError } }
    }

    if (!navigator.onLine) {
      const { copy, readError } = await savedCopy()
      setState(copy
        ? { status: 'ready', deck: copy, offline: true, error: null }
        : { status: 'error', deck: null, offline: false, error: await explainMissingCopy(uid, chapterId, readError) })
      return
    }
    try {
      setState({ status: 'ready', deck: await loadDeck(chapterId), offline: false, error: null })
    } catch (e) {
      if (e.code === 'unavailable' || e.code === 'timeout') {
        const { copy } = await savedCopy()
        if (copy) { setState({ status: 'ready', deck: copy, offline: true, error: null }); return }
      }
      setState({ status: 'error', deck: null, offline: false, error: e.message })
    }
  }, [chapterId, uid])

  useEffect(() => { load() }, [load])

  useEffect(() => () => {
    if (state.offline && state.deck?.urls) Object.values(state.deck.urls).forEach((u) => URL.revokeObjectURL(u))
  }, [state])

  if (state.status === 'loading') return <FullPageMessage loading />
  if (state.status === 'error') {
    return (
      <FullPageMessage icon={WifiOff} title="Couldn’t start the presentation" description={state.error}>
        <div className="flex justify-center gap-3">
          <Button onClick={load}>Try again</Button>
          <Button variant="secondary" onClick={() => navigate(navigator.onLine ? '/flashcards' : '/')}>Back</Button>
        </div>
      </FullPageMessage>
    )
  }
  if (state.deck.words.length === 0) {
    return (
      <FullPageMessage icon={Layers} title="Nothing to present yet" description="Add vocabulary to this chapter first.">
        <Button onClick={() => navigate(exitTo)}>Go back</Button>
      </FullPageMessage>
    )
  }
  return (
    <PresentationStage
      key={chapterId}
      title={state.deck.title}
      words={state.deck.words}
      startId={params.get('start')}
      exitTo={state.offline ? '/' : exitTo}
      preloaded={state.offline ? state.deck.urls : null}
      notice={state.offline ? `Offline copy · prepared ${formatDate(state.deck.preparedAt)}` : null}
    />
  )
}
