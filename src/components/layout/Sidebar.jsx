import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { NAV_ITEMS } from '../../lib/nav.js'

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="jp flex h-10 w-10 items-center justify-center rounded-xl bg-vermilion text-xl font-bold text-white" aria-hidden="true">語</span>
      <div className="leading-tight">
        <p className="text-[17px] font-semibold">Kotoba Studio</p>
        <p className="text-helper text-ink-muted">Vocabulary workspace</p>
      </div>
    </div>
  )
}

function NavList({ onNavigate }) {
  return (
    <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors ${
              isActive ? 'bg-vermilion-soft text-vermilion-dark' : 'text-ink hover:bg-surface-muted'
            }`
          }
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Brand />
        <NavList />
        <p className="mt-auto px-3 text-helper text-ink-muted">Private workspace</p>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-surface px-4 py-6 shadow-pop" aria-label="Navigation menu">
            <div className="flex items-start justify-between">
              <Brand />
              <button type="button" onClick={onClose} aria-label="Close menu" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl hover:bg-surface-muted">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <NavList onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
