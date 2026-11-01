import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import useAsyncData from '../../hooks/useAsyncData.js'
import { deleteChapter, listChapterTitles } from '../../services/chapterService.js'
import { pluralWords } from '../../utils/format.js'

const optionClass = 'flex cursor-pointer gap-3 rounded-xl border border-border p-4 has-[:checked]:border-vermilion has-[:checked]:bg-vermilion-soft'

export default function DeleteChapterModal({ chapter, onClose, onDeleted }) {
  const count = chapter.wordCount
  const { data: titles, loading, error: titlesError } = useAsyncData(listChapterTitles, 'delete-targets')
  const others = (titles ?? []).filter((c) => c.id !== chapter.id)

  const [mode, setMode] = useState(null)
  const [target, setTarget] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const hasWords = count > 0
  const ready = !hasWords || (mode === 'move' && target) || (mode === 'delete' && confirmed)
  const label = !hasWords ? 'Delete chapter' : mode === 'move' ? 'Move words and delete chapter' : mode === 'delete' ? `Delete chapter and ${pluralWords(count)}` : 'Choose an option'

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const strategy = !hasWords ? undefined : mode === 'move' ? { type: 'move', targetChapterId: target } : { type: 'delete' }
      await deleteChapter(chapter.id, strategy)
      onDeleted(chapter)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={`Delete “${chapter.title}”?`}
      description={hasWords ? `This chapter has ${pluralWords(count)}. Choose what happens to them.` : 'This chapter is empty. Deleting it cannot be undone.'}
    >
      {hasWords && (
        <fieldset className="space-y-3">
          <legend className="sr-only">What should happen to the vocabulary?</legend>
          <label className={optionClass}>
            <input type="radio" name="strategy" className="mt-1 accent-[#B84A3A]" checked={mode === 'move'} onChange={() => setMode('move')} disabled={busy} />
            <span className="flex-1">
              <span className="block font-medium">Move the words to another chapter</span>
              <span className="block text-sm text-ink-muted">The chapter is deleted; its words are kept.</span>
              {mode === 'move' && (
                <span className="mt-3 block">
                  {loading ? (
                    <span className="text-sm text-ink-muted">Loading chapters…</span>
                  ) : titlesError ? (
                    <span className="text-sm text-[#9B2C20]">{titlesError}</span>
                  ) : others.length === 0 ? (
                    <span className="text-sm text-ink-muted">There is no other chapter yet. Create one first, or delete the words instead.</span>
                  ) : (
                    <select aria-label="Destination chapter" value={target} onChange={(e) => setTarget(e.target.value)} disabled={busy} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[15px]">
                      <option value="">Select a chapter…</option>
                      {others.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  )}
                </span>
              )}
            </span>
          </label>
          <label className={optionClass}>
            <input type="radio" name="strategy" className="mt-1 accent-[#B84A3A]" checked={mode === 'delete'} onChange={() => setMode('delete')} disabled={busy} />
            <span className="flex-1">
              <span className="block font-medium">Delete the chapter and its {pluralWords(count)}</span>
              <span className="block text-sm text-ink-muted">Words and their images are permanently removed.</span>
              {mode === 'delete' && (
                <span className="mt-3 flex items-start gap-2 text-sm">
                  <input id="confirm-delete" type="checkbox" className="mt-0.5 h-4 w-4 accent-[#9B2C20]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={busy} />
                  <label htmlFor="confirm-delete">I understand this permanently deletes {pluralWords(count)}.</label>
                </span>
              )}
            </span>
          </label>
        </fieldset>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-[#9B2C20]">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="dangerSolid" onClick={submit} loading={busy} disabled={!ready}>{label}</Button>
      </div>
    </Modal>
  )
}
