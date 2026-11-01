import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { WifiOff, Settings2 } from 'lucide-react'
import FullPageMessage from '../components/ui/FullPageMessage.jsx'
import Button from '../components/ui/Button.jsx'
import AccessDenied from '../pages/AccessDenied.jsx'
import OfflineHome from '../pages/OfflineHome.jsx'
import { useAuth } from '../features/auth/AuthContext.jsx'

export default function ProtectedRoute() {
  const { status, error, recheck, signOut } = useAuth()
  const { pathname } = useLocation()

  switch (status) {
    case 'unconfigured':
      return (
        <FullPageMessage
          icon={Settings2}
          title="Firebase isn’t configured"
          description="Copy .env.example to .env, fill in your Firebase values, then restart the dev server. See docs/SETUP_FIREBASE.md."
        />
      )
    case 'loading':
    case 'checking':
      return <FullPageMessage loading />
    case 'signedOut':
      return <Navigate to="/login" replace />
    case 'denied':
      return <AccessDenied />
    case 'offline':

      return pathname.startsWith('/present/') ? <Outlet /> : <OfflineHome />
    case 'error':
      return (
        <FullPageMessage icon={WifiOff} title="Couldn’t verify your access" description={error}>
          <div className="flex justify-center gap-3">
            <Button onClick={recheck}>Try again</Button>
            <Button variant="secondary" onClick={signOut}>Sign out</Button>
          </div>
        </FullPageMessage>
      )
    default:
      return <Outlet />
  }
}
