import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { unlock } from '../lib/pb'

export default function Unlock() {
  const { isAuthed } = useAuth()
  const navigate = useNavigate()
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
    } catch {
      setError('Kode salah')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="pb-8 text-3xl">Bazar</h1>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Kode akses" error={error}>
          <Input type="password" autoComplete="current-password" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
        </Field>
        <Button type="submit" variant="primary" loading={busy}>
          Masuk
        </Button>
      </form>
    </main>
  )
}
