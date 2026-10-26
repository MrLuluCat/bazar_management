import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { getLapak } from '../lib/lapak'
import { unlock } from '../lib/pb'

export default function Unlock() {
  const { isAuthed } = useAuth()
  const navigate = useNavigate()
  const lapak = getLapak()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthed) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (code.length < 6) throw new Error('short')
      await unlock(code)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as { status?: number }).status === 429 ? 'Terlalu banyak percobaan. Tunggu satu menit.' : 'Kode salah')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <p className="text-sm font-semibold text-muted">Bazar</p>
      {lapak ? (
        <>
          <h1 className="pb-8 pt-1 text-3xl text-balance">{lapak.name}</h1>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field label="Kode akses" error={error}>
              <Input type="password" autoComplete="current-password" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            </Field>
            <Button type="submit" variant="primary" loading={busy}>
              Masuk
            </Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="pb-3 pt-1 text-3xl">Buka link lapak</h1>
          <p className="text-sm text-muted">
            Setiap lapak punya link sendiri, misalnya <span className="num text-ink">…/l/nama-lapak</span>. Minta link dan kode akses ke admin, lalu buka link itu di perangkat ini.
          </p>
        </>
      )}
      <a href="/admin" className="mt-12 self-start text-sm text-muted underline underline-offset-4 hover:text-ink">
        Panel admin
      </a>
    </main>
  )
}
