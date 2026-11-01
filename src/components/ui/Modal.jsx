import { useEffect, useRef, useId } from 'react'
import { X } from 'lucide-react'
import Button from './Button.jsx'

export default function Modal({ open, onClose, title, description, children, footer }) {
  const panelRef = useRef(null)
  const titleId = useId()
  const closeRef = useRef(onClose)

  useEffect(() => { closeRef.current = onClose })

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    panelRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="w-full max-w-lg rounded-card border border-border bg-surface p-6 shadow-pop outline-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-section-title">{title}</h2>
            {description && <p className="mt-1.5 text-[15px] text-ink-muted">{description}</p>}
          </div>
          <Button variant="tertiary" size="sm" onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-1 w-9 px-0"><X className="h-5 w-5" aria-hidden="true" /></Button>
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}
