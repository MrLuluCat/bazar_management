import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { SkeletonRows } from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { fetchLapakList, forgetLapak, getLapak, type Lapak } from '../lib/lapak'
import { unlock } from '../lib/pb'

export default function Unlock() {
  const { isAuthed } = useAuth()
  const [lapak, setLapak] = useState(getLapak)

  if (isAuthed) return <Navigate to="/" replace />

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <p className="text-sm font-semibold text-muted">Bazar</p>
      {lapak ? (
        <PasscodeForm
          lapak={lapak}
          onSwitch={() => {
            forgetLapak()
            setLapak(null)
          }}
        />
      ) : (
        <LapakPicker />
      )}
      <a href="/admin" className="mt-12 self-start text-sm text-muted underline underline-offset-4 hover:text-ink">
        Panel admin
      </a>
    </main>
  )
}

function PasscodeForm({ lapak, onSwitch }: { lapak: Lapak; onSwitch: () => void }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

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
      <button type="button" onClick={onSwitch} className="-ml-1 mt-4 min-h-[44px] self-start px-1 text-sm text-ink underline underline-offset-4">
        Pilih lapak lain
      </button>
    </>
  )
}

function LapakPicker() {
  const [items, setItems] = useState<Pick<Lapak, 'name' | 'slug'>[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetchLapakList()
      .then(setItems)
      .catch(() => setFailed(true))
  }, [])

  return (
    <>
      <h1 className="pb-6 pt-1 text-3xl">Pilih lapak</h1>
      {!items && !failed && <SkeletonRows count={3} />}
      {failed && <p className="text-sm text-muted">Daftar lapak tidak bisa dimuat. Periksa koneksi internet, lalu muat ulang halaman.</p>}
      {items?.length === 0 && <p className="text-sm text-muted">Belum ada lapak. Admin membuat lapak lewat panel admin.</p>}
      {!!items?.length && (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((l) => (
            <li key={l.slug}>
              <Link
                to={`/l/${l.slug}`}
                className="-mx-2 flex min-h-[56px] items-center gap-3 rounded-md px-2 py-3 text-base font-medium text-ink no-underline transition-colors duration-150 hover:bg-accent-wash"
              >
                <span className="min-w-0 flex-1 truncate">{l.name}</span>
                <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
