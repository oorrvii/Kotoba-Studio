import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FlashcardFace from './FlashcardFace.jsx'
import { getFullImageUrl } from '../../services/imageService.js'

export default function CardPreviewModal({ word, onClose }) {
  const [side, setSide] = useState('front')
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(word.hasImage)

  useEffect(() => {
    if (!word.hasImage) return undefined
    let cancelled = false
    let url = null
    getFullImageUrl(word.id)
      .then((u) => { if (cancelled) { if (u) URL.revokeObjectURL(u) } else { url = u; setImageUrl(u) } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [word.id, word.hasImage])

  return (
    <Modal
      open
      onClose={onClose}
      title="Card preview"
      footer={
        <>
          <Link to={`/vocabulary/${word.id}/edit`} tabIndex={-1}><Button variant="secondary">Edit</Button></Link>
          <Link to={`/present/${word.chapterId}?start=${word.id}`} tabIndex={-1}><Button>Present from this card</Button></Link>
        </>
      }
    >
      <div className="mb-3 flex justify-center">
        <div className="flex rounded-xl border border-border bg-surface p-1" role="group" aria-label="Card side">
          {['front', 'back'].map((s) => (
            <button key={s} type="button" aria-pressed={side === s} onClick={() => setSide(s)} className={`min-h-[40px] rounded-lg px-5 text-sm font-medium capitalize ${side === s ? 'bg-vermilion text-white' : 'text-ink hover:bg-surface-muted'}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="aspect-[3/4] max-h-[60vh] w-full"><FlashcardFace side={side} word={word} imageUrl={imageUrl} imageLoading={loading} /></div>
    </Modal>
  )
}
