import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from './ui/Toast'

/** registerType 'prompt': tell the user a new version is ready instead of reloading under them. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  useEffect(() => {
    if (needRefresh) toast.show('Versi baru tersedia —', { ms: 60_000, action: { label: 'Muat ulang', onClick: () => void updateServiceWorker(true) } })
  }, [needRefresh, updateServiceWorker])
  return null
}
