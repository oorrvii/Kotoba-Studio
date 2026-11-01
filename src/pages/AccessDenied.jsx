import { useState } from 'react'
import { ShieldAlert, Copy, Check } from 'lucide-react'
import FullPageMessage from '../components/ui/FullPageMessage.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../features/auth/AuthContext.jsx'

export default function AccessDenied() {
  const { user, signOut, recheck } = useAuth()
  const [copied, setCopied] = useState(false)

  const copyUid = async () => {
    try {
      await navigator.clipboard.writeText(user.uid)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <FullPageMessage
      icon={ShieldAlert}
      title="This account isn’t authorised"
      description={`${user?.email ?? 'This Google account'} can’t open this workspace. Sign in with the professor’s account instead.`}
    >
      <div className="rounded-xl border border-border bg-surface p-4 text-left">
        <p className="text-helper text-ink-muted">First-time setup only: the owner adds this account ID in Firebase (see docs/SETUP_FIREBASE.md).</p>
        <p className="mt-2 break-all font-mono text-sm">{user?.uid}</p>
        <Button variant="secondary" size="sm" className="mt-3" icon={copied ? Check : Copy} onClick={copyUid}>
          {copied ? 'Copied' : 'Copy account ID'}
        </Button>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button onClick={signOut}>Sign out</Button>
        <Button variant="secondary" onClick={recheck}>Check again</Button>
      </div>
    </FullPageMessage>
  )
}
