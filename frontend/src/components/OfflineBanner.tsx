import { WifiOff } from 'lucide-react'
import { useOnline } from '../hooks/useOnline'

export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div role="status" className="flex min-h-[36px] items-center justify-center gap-2 border-b border-line bg-accent-wash px-4 text-sm">
      <WifiOff size={16} strokeWidth={1.5} aria-hidden />
      <span>Offline — data terakhir</span>
    </div>
  )
}
