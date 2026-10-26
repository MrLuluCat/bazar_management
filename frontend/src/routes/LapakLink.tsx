import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getLapak, fetchLapak, setLapak } from '../lib/lapak'
import { lock, pb } from '../lib/pb'

/** /l/:slug — remember this lapak on the device, then go to the passcode screen. */
export default function LapakLink() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<'loading' | 'missing' | 'error'>('loading')

  useEffect(() => {
    let alive = true
    fetchLapak(slug)
      .then((l) => {
        if (!alive) return
        if (!l) return setState('missing')
        const same = getLapak()?.slug === l.slug
        // Another lapak's session on this device must not carry over.
        if (!same && pb.authStore.isValid) lock()
        setLapak(l)
        navigate(same && pb.authStore.isValid ? '/' : '/unlock', { replace: true })
      })
      .catch(() => alive && setState('error'))
    return () => {
      alive = false
    }
  }, [slug, navigate])

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <p className="text-sm font-semibold text-muted">Bazar</p>
      {state === 'loading' && (
        <h1 className="pt-1 text-xl" aria-live="polite">
          Membuka lapak…
        </h1>
      )}
      {state === 'missing' && (
        <>
          <h1 className="pb-3 pt-1 text-3xl">Link tidak dikenal</h1>
          <p className="text-sm text-muted">Lapak dengan link ini tidak ada atau sudah dihapus. Minta link terbaru ke admin.</p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="pb-3 pt-1 text-3xl">Tidak bisa terhubung</h1>
          <p className="text-sm text-muted">Periksa koneksi internet, lalu buka link ini lagi.</p>
        </>
      )}
    </main>
  )
}
