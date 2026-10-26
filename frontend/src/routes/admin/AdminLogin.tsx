import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { adminApi, errorMessage } from '../../lib/adminPb'
import { AdminAuthPage } from './AdminAuthPage'
import { useAdminAuthed } from './AdminShell'

export default function AdminLogin() {
  const authed = useAdminAuthed()
  const navigate = useNavigate()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi
      .setupNeeded()
      .then((r) => setSetupNeeded(r.needed))
      .catch(() => {})
  }, [])

  if (authed) return <Navigate to="/admin" replace />

  if (setupNeeded) {
    return (
      <AdminAuthPage
        title="Belum ada admin"
        intro={
          <>
            <p>Akun admin pertama dibuat lewat link setup sekali pakai. Link itu tercetak di log server saat server dinyalakan.</p>
            <p className="pt-3">
              Di VPS: <span className="num text-ink">journalctl -u bazar | grep admin/setup</span>
            </p>
          </>
        }
      />
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await adminApi.login(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError((err as { status?: number }).status === 400 ? 'Email atau password salah.' : errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminAuthPage title="Masuk admin" intro={notice}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Email">
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </Field>
        <Field label="Password" error={error}>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary" loading={busy} disabled={!email || !password}>
          Masuk
        </Button>
      </form>
      <a href="/" className="mt-10 self-start text-sm text-muted underline underline-offset-4 hover:text-ink">
        Kembali ke aplikasi
      </a>
    </AdminAuthPage>
  )
}
