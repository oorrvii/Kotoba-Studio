import { useState } from 'react'
import { Menu, Presentation, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button.jsx'
import { useToast } from '../ui/Toast.jsx'
import { useAuth } from '../../features/auth/AuthContext.jsx'

export default function Header({ onMenu }) {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const handleSignOut = async () => {
    setBusy(true)
    const result = await signOut()
    if (!result.ok) { toast.error(result.error); setBusy(false) } else if (result.warning) toast.error(result.warning)
  }

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-canvas/95 px-5 backdrop-blur-sm sm:px-8 lg:px-10">
      <button type="button" onClick={onMenu} aria-label="Open menu" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl hover:bg-surface-muted lg:hidden">
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[220px] truncate text-sm text-ink-muted sm:block">{user?.email}</span>
        <Link to="/flashcards" tabIndex={-1}>
          <Button variant="secondary" size="sm" icon={Presentation}>Present</Button>
        </Link>
        <Button variant="tertiary" size="sm" icon={LogOut} onClick={handleSignOut} loading={busy}>Sign out</Button>
      </div>
    </header>
  )
}
