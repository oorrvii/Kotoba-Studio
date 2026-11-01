import { useRef, useState } from 'react'
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import Button from '../ui/Button.jsx'

export default function ImageDropzone({ previewUrl, busy, error, onFile, onRemove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const pick = (files) => {
    const file = files?.[0]
    if (file) onFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Image</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files) }}
        disabled={busy}
        aria-label={previewUrl ? 'Choose a different image' : 'Choose an image to upload'}
        className={`flex min-h-[220px] w-full flex-col items-center justify-center rounded-card border-2 border-dashed p-4 text-center transition-colors ${dragging ? 'border-vermilion bg-vermilion-soft' : 'border-sand bg-surface hover:bg-surface-muted'}`}
      >
        {busy ? (
          <span className="flex flex-col items-center gap-2 text-ink-muted"><Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />Preparing image…</span>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Selected image preview" className="max-h-72 w-full rounded-lg object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-vermilion-soft text-vermilion"><ImagePlus className="h-6 w-6" aria-hidden="true" /></span>
            <span className="text-[15px] font-medium">Drop an image here, or click to browse</span>
            <span className="text-helper text-ink-muted">JPG, PNG or WebP. Large images are resized automatically.</span>
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files)} />
      {previewUrl && !busy && (
        <div className="mt-3 flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => inputRef.current?.click()}>Replace</Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={onRemove}>Remove image</Button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-helper text-[#9B2C20]">{error}</p>}
    </div>
  )
}
