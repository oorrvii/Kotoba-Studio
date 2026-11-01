import { ImageIcon, Loader2 } from 'lucide-react'

export default function FlashcardFace({ side = 'front', word, imageUrl, imageLoading = false, showRomaji = true, large = false }) {
  const readings = [word.hiragana, word.katakana].filter(Boolean).join(' · ')
  const s = large
    ? {
        jp: 'text-[clamp(3rem,5.2vw,4.75rem)]',
        jpSmall: 'text-[clamp(1.75rem,3vw,2.75rem)]',
        reading: 'text-[clamp(1.5rem,2.4vw,2.25rem)]',
        romaji: 'text-[clamp(1.125rem,1.8vw,1.5rem)]',
        en: 'text-[clamp(1.75rem,3vw,2.5rem)]',
        sentence: 'text-[clamp(1.25rem,1.9vw,1.75rem)]',
      }
    : { jp: 'text-5xl', jpSmall: 'text-2xl', reading: 'text-xl', romaji: 'text-base', en: 'text-3xl', sentence: 'text-lg' }

  const showJapanese = side !== 'back'
  const showEnglish = side !== 'front'

  return (
    <div className={`flex h-full w-full overflow-hidden rounded-card border border-border bg-surface shadow-card ${large ? 'flex-col lg:flex-row' : 'flex-col'}`}>
      <div className={`flex min-h-0 items-center justify-center bg-surface-muted ${large ? 'flex-[11] p-3' : 'flex-1'}`}>
        {imageUrl ? (
          <img src={imageUrl} alt={word.japanese ? `Illustration for ${word.japanese}` : ''} className="h-full w-full object-contain" />
        ) : imageLoading ? (
          <div role="status" className="flex flex-col items-center gap-2 text-ink-muted">
            <Loader2 className="h-9 w-9 animate-spin" aria-hidden="true" />
            <span className="text-helper">Loading image…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-muted">
            <ImageIcon className="h-10 w-10" aria-hidden="true" />
            <span className="text-helper">No image</span>
          </div>
        )}
      </div>
      <div className={`min-h-0 text-center ${large ? 'flex flex-[9] flex-col justify-center overflow-hidden px-6 py-5 lg:px-10' : 'px-6 py-5'}`}>
        {showJapanese ? (
          <>
            <p lang="ja" className={`jp break-words font-bold leading-tight ${s.jp} ${word.japanese ? '' : 'text-ink-muted'}`}>{word.japanese || '日本語'}</p>
            {readings && <p lang="ja" className={`jp mt-1 text-ink-muted ${s.reading}`}>{readings}</p>}
            {showRomaji && word.romaji && <p className={`mt-1.5 text-ink-muted ${s.romaji}`}>{word.romaji}</p>}
          </>
        ) : (
          <p lang="ja" className={`jp break-words font-medium leading-tight text-ink-muted ${s.jpSmall}`}>{word.japanese || '日本語'}</p>
        )}
        {showEnglish && (
          <>
            <p className={`${showJapanese ? 'mt-4' : 'mt-2'} font-semibold leading-tight text-vermilion-dark ${s.en}`}>{word.english || 'English meaning'}</p>
            {word.exampleSentence && <p lang="ja" className={`jp mt-4 ${s.sentence}`}>{word.exampleSentence}</p>}
            {word.sentenceTranslation && <p className={`mt-1 text-ink-muted ${s.sentence}`}>{word.sentenceTranslation}</p>}
          </>
        )}
      </div>
    </div>
  )
}
