import { Link } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import useOnlineStatus from '../../hooks/useOnlineStatus.js'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#E8D6AE] bg-[#FBF4E2] px-5 py-2.5 text-[15px] sm:px-8 lg:px-10">
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>You’re offline. Changes can’t be saved right now.</span>
      <Link to="/offline" className="font-semibold underline underline-offset-2">Open chapters prepared for offline</Link>
    </div>
  )
}
