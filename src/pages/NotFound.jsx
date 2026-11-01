import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-page-title">Page not found</h1>
      <p className="mt-2 text-ink-muted">That address doesn’t exist in this workspace.</p>
      <Link to="/" className="mt-6"><Button tabIndex={-1}>Back to dashboard</Button></Link>
    </div>
  )
}
