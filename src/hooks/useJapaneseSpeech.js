import { useCallback, useEffect, useState } from 'react'

export default function useJapaneseSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [voice, setVoice] = useState(null)

  useEffect(() => {
    if (!supported) return undefined
    const synth = window.speechSynthesis
    const pick = () => {
      const found = synth.getVoices().find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('ja'))
      setVoice(found ?? null)
    }
    pick()
    synth.addEventListener('voiceschanged', pick)
    return () => { synth.removeEventListener('voiceschanged', pick); synth.cancel() }
  }, [supported])

  const speak = useCallback((text) => {
    if (!supported || !text) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.85
    if (voice) utterance.voice = voice
    synth.speak(utterance)
  }, [supported, voice])

  const cancel = useCallback(() => { if (supported) window.speechSynthesis.cancel() }, [supported])

  return { supported, hasVoice: Boolean(voice), speak, cancel }
}
