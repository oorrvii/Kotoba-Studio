import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import { validateChapter } from '../../lib/validators.js'
import { createChapter, updateChapter } from '../../services/chapterService.js'

export default function ChapterFormModal({ chapter = null, onClose, onSaved }) {
  const editing = Boolean(chapter)
  const [title, setTitle] = useState(chapter?.title ?? '')
  const [description, setDescription] = useState(chapter?.description ?? '')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const save = async () => {
    const found = validateChapter({ title, description })
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setSubmitError(null)
    try {
      const payload = { title, description }
      const id = editing ? await updateChapter(chapter.id, payload) : await createChapter(payload)
      onSaved({ id, created: !editing })
    } catch (e) {
      setSubmitError(e.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={saving ? () => {} : onClose}
      title={editing ? 'Edit chapter' : 'Create chapter'}
      description={editing ? undefined : 'Chapters group the words for a lesson.'}
    >
      <div className="space-y-4">
        <Input label="Title" lang="ja" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} placeholder="e.g. Lesson 1: Greetings" autoFocus />
        <Input label="Description (optional)" multiline value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} placeholder="What this chapter covers" />
        {submitError && <p role="alert" className="text-sm text-[#9B2C20]">{submitError}</p>}
      </div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Create chapter'}</Button>
      </div>
    </Modal>
  )
}
