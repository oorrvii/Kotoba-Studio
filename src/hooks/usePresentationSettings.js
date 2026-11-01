import { useEffect, useState } from 'react'

const KEY = 'kotoba.presentation.settings'
export const DISPLAY_MODES = [
  { value: 'reveal', label: 'Japanese first, reveal English', hint: 'Show the Japanese side; flip to reveal the meaning.' },
  { value: 'japanese', label: 'Japanese only', hint: 'Never show the English meaning.' },
  { value: 'both', label: 'Show both', hint: 'Japanese and English together on one card.' },
]
const DEFAULTS = { mode: 'reveal', showRomaji: true }

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return {
      mode: DISPLAY_MODES.some((m) => m.value === saved.mode) ? saved.mode : DEFAULTS.mode,
      showRomaji: typeof saved.showRomaji === 'boolean' ? saved.showRomaji : DEFAULTS.showRomaji,
    }
  } catch {
    return DEFAULTS
  }
}

export default function usePresentationSettings() {
  const [settings, setSettings] = useState(read)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch {}
  }, [settings])
  const update = (patch) => setSettings((s) => ({ ...s, ...patch }))
  return [settings, update]
}
