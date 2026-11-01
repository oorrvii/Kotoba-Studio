import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { DISPLAY_MODES } from '../../hooks/usePresentationSettings.js'

const SHORTCUTS = [
  ['← / →', 'Previous / next card'],
  ['Space or Enter', 'Reveal / hide the meaning'],
  ['S', 'Shuffle on / off'],
  ['R or Home', 'Restart'],
  ['P / E', 'Pronounce word / example sentence'],
  ['F', 'Full screen'],
  ['Esc', 'Leave full screen, then exit'],
]

export default function PresentationSettings({ settings, onChange, onClose }) {
  return (
    <Modal open onClose={onClose} title="Presentation settings" footer={<Button onClick={onClose}>Done</Button>}>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Display mode</legend>
        <div className="space-y-2">
          {DISPLAY_MODES.map((m) => (
            <label key={m.value} className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 has-[:checked]:border-vermilion has-[:checked]:bg-vermilion-soft">
              <input type="radio" name="mode" className="mt-1 accent-[#B84A3A]" checked={settings.mode === m.value} onChange={() => onChange({ mode: m.value })} />
              <span><span className="block font-medium">{m.label}</span><span className="block text-sm text-ink-muted">{m.hint}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
        <input type="checkbox" className="h-4 w-4 accent-[#B84A3A]" checked={settings.showRomaji} onChange={(e) => onChange({ showRomaji: e.target.checked })} />
        <span className="font-medium">Show romaji</span>
      </label>
      <h3 className="mb-2 mt-6 text-sm font-medium">Keyboard shortcuts</h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {SHORTCUTS.map(([k, d]) => (
          <div key={k} className="contents"><dt className="font-medium">{k}</dt><dd className="text-ink-muted">{d}</dd></div>
        ))}
      </dl>
    </Modal>
  )
}
