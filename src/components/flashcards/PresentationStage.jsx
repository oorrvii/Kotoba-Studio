import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import FlashcardFace from './FlashcardFace.jsx'
import FlipCard from './FlipCard.jsx'
import PresentationControls from './PresentationControls.jsx'
import PresentationSettings from './PresentationSettings.jsx'
import { useToast } from '../ui/Toast.jsx'
import usePresentationImages from '../../hooks/usePresentationImages.js'
import usePresentationSettings from '../../hooks/usePresentationSettings.js'
import useJapaneseSpeech from '../../hooks/useJapaneseSpeech.js'

const identity = (n) => Array.from({ length: n }, (_, i) => i)
function shuffled(n) {
  const a = identity(n)
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PresentationStage({ title, words, startId, exitTo, preloaded = null, notice = null }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [settings, updateSettings] = usePresentationSettings()
  const { urls, status } = usePresentationImages(words, preloaded)
  const speech = useJapaneseSpeech()

  const [order, setOrder] = useState(() => identity(words.length))
  const [position, setPosition] = useState(() => Math.max(0, words.findIndex((w) => w.id === startId)))
  const [flipped, setFlipped] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const warnedNoVoice = useRef(false)
  const touch = useRef(null)
  const actionsRef = useRef({})

  const total = words.length
  const current = words[order[position]]
  const { mode, showRomaji } = settings
  const canFlip = mode === 'reveal'
  const sentenceVisible = Boolean(current.exampleSentence) && (mode === 'both' || (mode === 'reveal' && flipped))

  const goNext = () => { if (position < total - 1) { setPosition(position + 1); setFlipped(false) } }
  const goPrev = () => { if (position > 0) { setPosition(position - 1); setFlipped(false) } }
  const flip = () => { if (canFlip) setFlipped((f) => !f) }
  const restart = () => { setPosition(0); setFlipped(false) }
  const toggleShuffle = () => {
    if (isShuffled) {
      setPosition(order[position])
      setOrder(identity(total))
    } else {
      setOrder(shuffled(total))
      setPosition(0)
    }
    setIsShuffled(!isShuffled)
    setFlipped(false)
  }

  const speakText = (text) => {
    if (!speech.supported) { toast.error('Speech isn’t supported in this browser.'); return }
    if (!speech.hasVoice && !warnedNoVoice.current) {
      warnedNoVoice.current = true
      toast.info('No Japanese voice was found on this device, so pronunciation may not work.')
    }
    speech.speak(text)
  }
  const speakWord = () => speakText(current.japanese)
  const speakSentence = () => { if (sentenceVisible) speakText(current.exampleSentence) }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      toast.error('Full screen isn’t available in this browser.')
    }
  }
  const exit = useCallback(() => navigate(exitTo), [navigate, exitTo])

  useEffect(() => { setFlipped(false) }, [mode])
  const cancelSpeech = speech.cancel
  useEffect(() => { cancelSpeech() }, [current.id, cancelSpeech])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.body.style.overflow = previous
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    actionsRef.current = { goNext, goPrev, flip, restart, toggleShuffle, speakWord, speakSentence, toggleFullscreen, exit, settingsOpen }
  })

  useEffect(() => {
    const onKey = (e) => {
      const a = actionsRef.current
      if (a.settingsOpen || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = e.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': e.preventDefault(); a.goNext(); break
        case 'ArrowLeft': case 'PageUp': e.preventDefault(); a.goPrev(); break
        case ' ': case 'Enter':
          if (tag === 'BUTTON' || tag === 'A') return
          e.preventDefault(); a.flip(); break
        case 'ArrowUp': case 'ArrowDown': case 'End': e.preventDefault(); break
        case 'Home': e.preventDefault(); a.restart(); break
        case 'r': case 'R': a.restart(); break
        case 's': case 'S': a.toggleShuffle(); break
        case 'p': case 'P': a.speakWord(); break
        case 'e': case 'E': a.speakSentence(); break
        case 'f': case 'F': a.toggleFullscreen(); break
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
          else a.exit()
          break
        default:
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY } }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? goNext : goPrev)()
  }

  const face = (side) => (
    <FlashcardFace large side={side} word={current} imageUrl={urls[current.id]} imageLoading={status(current) === 'loading'} showRomaji={showRomaji} />
  )

  return (
    <div className="fixed inset-0 flex flex-col bg-canvas">
      <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <p className="truncate text-lg font-medium text-ink-muted">{title}</p>
          {notice && <span className="shrink-0 rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-ink">{notice}</span>}
        </div>
        <button type="button" onClick={exit} aria-label="Exit presentation" title="Exit (Esc)" className="inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-[17px] font-medium hover:bg-surface-muted">
          <X className="h-6 w-6" aria-hidden="true" /> Exit
        </button>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center px-4 py-1 sm:px-8" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div key={current.id} className="h-full w-full max-w-[1280px] animate-card-in lg:max-h-[720px]">
          {mode === 'reveal' ? (
            <FlipCard flipped={flipped} onToggle={flip} front={face('front')} back={face('back')} />
          ) : (
            face(mode === 'both' ? 'both' : 'front')
          )}
        </div>
        <p className="sr-only" aria-live="polite">{`Card ${position + 1} of ${total}. ${flipped ? current.english : current.japanese}`}</p>
      </main>

      <PresentationControls
        position={position} total={total} canFlip={canFlip} flipped={flipped} shuffled={isShuffled}
        fullscreen={fullscreen} canFullscreen={Boolean(document.fullscreenEnabled)}
        canSpeak={speech.supported} sentenceVisible={sentenceVisible}
        onPrev={goPrev} onNext={goNext} onFlip={flip} onShuffle={toggleShuffle} onRestart={restart}
        onSpeakWord={speakWord} onSpeakSentence={speakSentence} onFullscreen={toggleFullscreen} onSettings={() => setSettingsOpen(true)}
      />

      {settingsOpen && <PresentationSettings settings={settings} onChange={updateSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
