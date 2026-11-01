import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import useOnlineStatus from '../../hooks/useOnlineStatus.js'

export default function ErrorState({ title = 'Couldn’t load this', message, onRetry }) {
  const online = useOnlineStatus()
  return (
    <div role="alert" className="flex flex-col items-center rounded-card border border-[#E3B7B0] bg-[#FBEFED] px-6 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-[#9B2C20]" aria-hidden="true" />
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-[15px] text-ink-muted">{message}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {!online && <Link to="/offline" tabIndex={-1}><Button>Open chapters prepared for offline</Button></Link>}
        {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
      </div>
    </div>
  )
}
