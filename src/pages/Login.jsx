import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import FullPageMessage from '../components/ui/FullPageMessage.jsx'
import { useAuth } from '../features/auth/AuthContext.jsx'
import LoginShowcase from '../components/flashcards/LoginShowcase.jsx'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.300v2.700h3.500c2.100-1.900 3.300-4.700 3.300-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.500-1 7.300-2.700l-3.500-2.700c-1 .7-2.300 1.100-3.800 1.100-2.900 0-5.400-2-6.300-4.600H2.100v2.800A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.700 14.100a6.600 6.600 0 0 1 0-4.200V7.100H2.100a11 11 0 0 0 0 9.800l3.600-2.800z" />
      <path fill="#EA4335" d="M12 5.400c1.600 0 3.100.6 4.200 1.700l3.100-3.100A11 11 0 0 0 2.100 7.100l3.600 2.800C6.600 7.400 9.100 5.400 12 5.400z" />
    </svg>
  )
}

export default function Login() {
  const { status, signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (status === 'loading') return <FullPageMessage loading />

  if (['checking', 'authorised', 'denied', 'error', 'offline'].includes(status)) return <Navigate to="/" replace />

  const handleSignIn = async () => {
    setBusy(true)
    setError(null)
    const result = await signIn()
    if (!result.ok && result.error) setError(result.error)
    setBusy(false)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="jp flex h-11 w-11 items-center justify-center rounded-xl bg-vermilion text-2xl font-bold text-white" aria-hidden="true">語</span>
            <span className="text-xl font-semibold">Kotoba Studio</span>
          </div>
          <h1 className="mt-10 text-page-title">A private workspace for Japanese vocabulary</h1>
          <p className="mt-3 text-[16px] text-ink-muted">Prepare words with your own images, organise them into chapters, and present them one card at a time.</p>
          <Button size="lg" variant="secondary" className="mt-8 w-full" onClick={handleSignIn} loading={busy} disabled={status === 'unconfigured'}>
            {!busy && <GoogleMark />} Continue with Google
          </Button>
          {status === 'unconfigured' && (
            <p role="alert" className="mt-3 text-helper text-[#9B2C20]">Firebase isn’t configured yet. Add your values to .env (see docs/SETUP_FIREBASE.md).</p>
          )}
          {error && <p role="alert" className="mt-3 text-helper text-[#9B2C20]">{error}</p>}
          <p className="mt-4 flex items-start gap-2 text-helper text-ink-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Access is limited to one authorised account. There is no sign-up.
          </p>
        </div>
      </section>
      <section className="hidden items-center justify-center bg-surface-muted p-12 lg:flex" aria-hidden="true">
        <LoginShowcase />
      </section>
    </div>
  )
}
