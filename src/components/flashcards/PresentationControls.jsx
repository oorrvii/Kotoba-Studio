import { ChevronLeft, ChevronRight, Eye, EyeOff, Maximize2, Minimize2, RotateCcw, Settings, Shuffle, Volume2, MessageSquareText } from 'lucide-react'

const base = 'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-4 text-[17px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const look = {
  primary: 'border-transparent bg-vermilion text-white hover:bg-vermilion-dark',
  secondary: 'border-border bg-surface text-ink hover:bg-surface-muted',
  on: 'border-vermilion bg-vermilion-soft text-vermilion-dark',
}

function Control({ icon: Icon, label, onClick, variant = 'secondary', showLabel = false, pressed, disabled, hint }) {
  return (
    <button
      type="button"
      onClick={(e) => { onClick(); if (e.detail > 0) e.currentTarget.blur() }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={hint ? `${label} (${hint})` : label}
      className={`${base} ${look[pressed ? 'on' : variant]} ${showLabel ? 'min-w-[132px] px-6' : 'w-[52px] px-0'}`}
    >
      <Icon className="h-6 w-6" aria-hidden="true" />
      {showLabel && <span>{label}</span>}
    </button>
  )
}

export default function PresentationControls({
  position, total, canFlip, flipped, shuffled, fullscreen, canFullscreen,
  canSpeak, sentenceVisible,
  onPrev, onNext, onFlip, onShuffle, onRestart, onSpeakWord, onSpeakSentence, onFullscreen, onSettings,
}) {
  const percent = Math.round(((position + 1) / total) * 100)
  return (
    <footer className="px-4 pb-5 pt-2 sm:px-8">
      <div className="mx-auto mb-3 flex max-w-[1280px] items-center justify-center gap-4">
        <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-border" role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={position + 1}>
          <div className="h-full rounded-full bg-vermilion transition-[width] duration-200" style={{ width: `${percent}%` }} />
        </div>
        <span className="min-w-[72px] text-lg font-semibold tabular-nums">{position + 1} / {total}</span>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Control icon={Shuffle} label={shuffled ? 'Shuffle on' : 'Shuffle'} pressed={shuffled} onClick={onShuffle} hint="S" />
          <Control icon={RotateCcw} label="Restart" onClick={onRestart} hint="R" />
        </div>
        <div className="flex items-center gap-3 max-sm:order-first max-sm:w-full max-sm:justify-center">
          <Control icon={ChevronLeft} label="Previous" showLabel onClick={onPrev} disabled={position === 0} hint="←" />
          {canFlip && <Control icon={flipped ? EyeOff : Eye} label={flipped ? 'Hide' : 'Reveal'} showLabel variant="primary" onClick={onFlip} hint="Space" />}
          <Control icon={ChevronRight} label="Next" showLabel onClick={onNext} disabled={position === total - 1} hint="→" />
        </div>
        <div className="flex gap-2">
          <Control icon={Volume2} label="Pronounce word" onClick={onSpeakWord} disabled={!canSpeak} hint="P" />
          {sentenceVisible && <Control icon={MessageSquareText} label="Pronounce sentence" onClick={onSpeakSentence} disabled={!canSpeak} hint="E" />}
          {canFullscreen && <Control icon={fullscreen ? Minimize2 : Maximize2} label={fullscreen ? 'Exit full screen' : 'Full screen'} onClick={onFullscreen} hint="F" />}
          <Control icon={Settings} label="Presentation settings" onClick={onSettings} />
        </div>
      </div>
    </footer>
  )
}
