import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import { useToast } from '../ui/Toast.jsx'
import ImageDropzone from './ImageDropzone.jsx'
import FlashcardFace from '../flashcards/FlashcardFace.jsx'
import { validateWord } from '../../lib/validators.js'
import { processImage } from '../../utils/imageProcessing.js'
import { getFullImageUrl } from '../../services/imageService.js'
import { saveWord } from '../../services/vocabularyService.js'

const EMPTY = { japanese: '', hiragana: '', katakana: '', romaji: '', english: '', exampleSentence: '', sentenceTranslation: '' }

export default function VocabularyForm({ word, chapters, defaultChapterId }) {
  const navigate = useNavigate()
  const toast = useToast()
  const editing = Boolean(word)
  const validDefault = chapters.some((c) => c.id === defaultChapterId) ? defaultChapterId : ''

  const [values, setValues] = useState({
    ...EMPTY,
    ...(word ? { japanese: word.japanese, hiragana: word.hiragana, katakana: word.katakana, romaji: word.romaji, english: word.english, exampleSentence: word.exampleSentence, sentenceTranslation: word.sentenceTranslation } : {}),
    chapterId: word?.chapterId ?? validDefault ?? '',
  })
  const [errors, setErrors] = useState({})
  const [image, setImage] = useState({ kind: 'keep' })
  const [existingUrl, setExistingUrl] = useState(null)
  const [imageError, setImageError] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [side, setSide] = useState('front')

  const setField = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const wordId = word?.id
  const savedHasImage = word?.hasImage
  useEffect(() => {
    if (!savedHasImage) return undefined
    let url = null
    let cancelled = false
    getFullImageUrl(wordId)
      .then((u) => { if (cancelled) { if (u) URL.revokeObjectURL(u) } else { url = u; setExistingUrl(u) } })
      .catch(() => setImageError('The saved image couldn’t be loaded.'))
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [wordId, savedHasImage])

  const previewUrl = image.kind === 'set' ? image.previewUrl : image.kind === 'remove' ? null : existingUrl
  useEffect(() => () => { if (image.kind === 'set') URL.revokeObjectURL(image.previewUrl) }, [image])

  const handleFile = async (file) => {
    setImageError(null)
    setProcessing(true)
    try {
      const processed = await processImage(file)
      setImage({ kind: 'set', processed, previewUrl: URL.createObjectURL(processed.full.blob) })
    } catch (e) {
      setImageError(e.message)
    } finally {
      setProcessing(false)
    }
  }
  const handleRemove = () => { setImageError(null); setImage(word?.hasImage ? { kind: 'remove' } : { kind: 'keep' }) }

  const submit = async (addAnother) => {
    const found = validateWord(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setSubmitError(null)
    try {
      await saveWord({ id: word?.id, values, image })
      toast.success(editing ? 'Vocabulary updated.' : 'Vocabulary added.')
      if (addAnother) {
        setValues((v) => ({ ...EMPTY, chapterId: v.chapterId }))
        setImage({ kind: 'keep' })
        setErrors({})
        setSaving(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        navigate(`/chapters/${values.chapterId}`)
      }
    } catch (e) {
      setSubmitError(e.message)
      setSaving(false)
    }
  }

  const previewWord = values
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-6">
        <Card className="space-y-4">
          <Select label="Chapter" value={values.chapterId} onChange={setField('chapterId')} error={errors.chapterId}>
            <option value="">Select a chapter…</option>
            {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Japanese word" lang="ja" value={values.japanese} onChange={setField('japanese')} error={errors.japanese} placeholder="e.g. 図書館" autoFocus={!editing} />
            <Input label="English meaning" value={values.english} onChange={setField('english')} error={errors.english} placeholder="e.g. library" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Hiragana" lang="ja" value={values.hiragana} onChange={setField('hiragana')} error={errors.hiragana} placeholder="としょかん" />
            <Input label="Katakana" lang="ja" value={values.katakana} onChange={setField('katakana')} error={errors.katakana} placeholder="optional" />
            <Input label="Romaji" value={values.romaji} onChange={setField('romaji')} error={errors.romaji} placeholder="toshokan" />
          </div>
        </Card>

        <Card>
          <ImageDropzone previewUrl={previewUrl} busy={processing} error={imageError} onFile={handleFile} onRemove={handleRemove} />
        </Card>

        <details className="rounded-card border border-border bg-surface-muted/60 px-6 py-4" open={Boolean(values.exampleSentence || values.sentenceTranslation)}>
          <summary className="cursor-pointer text-[15px] font-medium">Example sentence (optional)</summary>
          <div className="mt-4 space-y-4">
            <Input label="Japanese sentence" lang="ja" multiline value={values.exampleSentence} onChange={setField('exampleSentence')} error={errors.exampleSentence} />
            <Input label="English translation" multiline value={values.sentenceTranslation} onChange={setField('sentenceTranslation')} error={errors.sentenceTranslation} />
          </div>
        </details>

        {submitError && <p role="alert" className="text-[15px] text-[#9B2C20]">{submitError}</p>}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => submit(false)} loading={saving} disabled={processing}>{editing ? 'Save changes' : 'Save vocabulary'}</Button>
          {!editing && <Button variant="secondary" onClick={() => submit(true)} disabled={saving || processing}>Save and add another</Button>}
          <Link to={values.chapterId ? `/chapters/${values.chapterId}` : '/vocabulary'} tabIndex={-1}><Button variant="tertiary" disabled={saving}>Cancel</Button></Link>
        </div>
      </div>

      <aside className="hidden xl:block" aria-label="Flashcard preview">
        <div className="sticky top-24">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Card preview</h2>
            <div className="flex rounded-xl border border-border bg-surface p-1" role="group" aria-label="Card side">
              {['front', 'back'].map((s) => (
                <button key={s} type="button" aria-pressed={side === s} onClick={() => setSide(s)} className={`min-h-[36px] rounded-lg px-4 text-sm font-medium capitalize ${side === s ? 'bg-vermilion text-white' : 'text-ink hover:bg-surface-muted'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="aspect-[3/4]"><FlashcardFace side={side} word={previewWord} imageUrl={previewUrl} /></div>
        </div>
      </aside>
    </div>
  )
}
