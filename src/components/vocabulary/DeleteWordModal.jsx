import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { deleteWord } from '../../services/vocabularyService.js'

export default function DeleteWordModal({ word, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteWord(word.id)
      onDeleted(word)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={`Delete “${word.japanese}”?`}
      description="The word and its image will be permanently removed. This cannot be undone."
    >
      {error && <p role="alert" className="text-sm text-[#9B2C20]">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="dangerSolid" onClick={submit} loading={busy}>Delete word</Button>
      </div>
    </Modal>
  )
}
