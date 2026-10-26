import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { adminApi, errorMessage } from '../../lib/adminPb'
import { AdminAuthPage } from './AdminAuthPage'

/** /admin/setup?token=… — creates the first admin with the one-time token from the server log. */
export default function AdminSetup() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; repeat?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  if (!token) {
    return (
      <AdminAuthPage
        title="Link setup tidak lengkap"
        intro="Buka link lengkap dari log server, termasuk bagian ?token=… di akhirnya."
      />
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Isi email yang valid.'
    if (password.length < 12) next.password = 'Minimal 12 karakter.'
    else if (repeat !== password) next.repeat = 'Password tidak sama.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await adminApi.setup({ token, email: email.trim(), password })
      await adminApi.login(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setErrors({ form: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminAuthPage
      title="Buat akun admin"
      intro="Akun ini mengelola semua lapak: membuat lapak baru, mengganti kode akses, dan backup. Simpan password-nya di password manager."
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Email" error={errors.email}>
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </Field>
        <Field label="Password" error={errors.password} hint={errors.password ? undefined : 'Minimal 12 karakter. Kalimat pendek lebih mudah diingat.'}>
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Ulangi password" error={errors.repeat}>
          <Input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        </Field>
        {errors.form && (
          <p role="alert" className="text-sm text-unpaid">
            {errors.form}
          </p>
        )}
        <Button type="submit" variant="primary" loading={busy}>
          Buat akun admin
        </Button>
      </form>
    </AdminAuthPage>
  )
}
