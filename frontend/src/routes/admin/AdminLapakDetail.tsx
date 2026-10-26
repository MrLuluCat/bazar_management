import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { toast } from '../../components/ui/Toast'
import { adminApi, errorMessage } from '../../lib/adminPb'
import { ConfirmTyped } from './ConfirmTyped'
import { randomPasscode, useLapakList } from './api'
import { ShareLapak } from './ShareLapak'

const sectionTitle = 'text-base font-semibold'

export default function AdminLapakDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const list = useLapakList()
  const lapak = list.data?.find((l) => l.id === id)

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [passError, setPassError] = useState('')
  const [passBusy, setPassBusy] = useState(false)
  const [newPasscode, setNewPasscode] = useState('')
  const [danger, setDanger] = useState<'clear' | 'delete' | null>(null)
  const [dangerBusy, setDangerBusy] = useState(false)
  const [dangerError, setDangerError] = useState('')

  useEffect(() => {
    if (lapak) setName(lapak.name)
  }, [lapak?.name]) // eslint-disable-line react-hooks/exhaustive-deps

  if (list.isPending) return <SkeletonRows count={4} />
  if (!lapak) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-xl">Lapak tidak ditemukan</h1>
        <Link to="/admin" className="text-sm underline underline-offset-4">
          Kembali ke daftar lapak
        </Link>
      </div>
    )
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'lapak'] })

  const rename = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name.trim() === lapak.name) return
    setSaving(true)
    try {
      await adminApi.rename(lapak.id, name.trim())
      await refresh()
      toast.show('Nama disimpan')
    } catch (err) {
      toast.show(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changePasscode = async (e: FormEvent) => {
    e.preventDefault()
    if (passcode.length < 6) return setPassError('Minimal 6 karakter.')
    setPassError('')
    setPassBusy(true)
    try {
      await adminApi.passcode(lapak.id, passcode)
      setNewPasscode(passcode)
      setPasscode('')
      toast.show('Kode akses diganti')
    } catch (err) {
      setPassError(errorMessage(err))
    } finally {
      setPassBusy(false)
    }
  }

  const runDanger = async () => {
    setDangerBusy(true)
    setDangerError('')
    try {
      if (danger === 'clear') {
        await adminApi.clear(lapak.id, lapak.slug)
        await refresh()
        toast.show('Data lapak dikosongkan. Backup tersimpan.')
        setDanger(null)
      } else {
        await adminApi.remove(lapak.id, lapak.slug)
        await refresh()
        toast.show(`${lapak.name} dihapus. Backup tersimpan.`)
        navigate('/admin', { replace: true })
      }
    } catch (err) {
      setDangerError(errorMessage(err))
    } finally {
      setDangerBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <Link to="/admin" className="-ml-1 inline-flex min-h-[44px] items-center gap-1 self-start text-sm text-muted no-underline hover:text-ink">
          <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
          Semua lapak
        </Link>
        <h1 className="text-2xl text-balance">{lapak.name}</h1>
        <p className="num text-sm text-muted">
          {lapak.events} event · {lapak.contacts} kontak
        </p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="share-h">
        <h2 id="share-h" className={sectionTitle}>
          Bagikan ke tim lapak
        </h2>
        <ShareLapak name={lapak.name} slug={lapak.slug} passcode={newPasscode || undefined} />
      </section>

      <form onSubmit={rename} className="flex flex-col gap-3" aria-labelledby="name-h">
        <h2 id="name-h" className={sectionTitle}>
          Nama lapak
        </h2>
        <Field label="Nama">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Button type="submit" loading={saving} disabled={!name.trim() || name.trim() === lapak.name} className="self-start">
          Simpan nama
        </Button>
      </form>

      <form onSubmit={changePasscode} className="flex flex-col gap-3" aria-labelledby="pass-h">
        <h2 id="pass-h" className={sectionTitle}>
          Ganti kode akses
        </h2>
        <p className="max-w-prose text-sm text-muted">Semua perangkat lapak ini akan keluar dan harus masuk lagi dengan kode baru.</p>
        <div className="flex items-end gap-2">
          <Field label="Kode baru" error={passError} className="flex-1">
            <Input value={passcode} onChange={(e) => setPasscode(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} className="num" />
          </Field>
          <Button onClick={() => setPasscode(randomPasscode())} aria-label="Buat kode acak" title="Buat kode acak" className={passError ? 'mb-6' : ''}>
            <RefreshCw size={18} strokeWidth={1.5} aria-hidden />
          </Button>
        </div>
        <Button type="submit" loading={passBusy} disabled={!passcode} className="self-start">
          Ganti kode
        </Button>
      </form>

      <section className="flex flex-col gap-4 border-t border-line-strong pt-6" aria-labelledby="danger-h">
        <h2 id="danger-h" className={sectionTitle}>
          Hapus
        </h2>
        <div className="flex flex-col gap-2">
          <p className="max-w-prose text-sm">
            <strong className="font-semibold">Kosongkan data.</strong> Semua event, pembayaran dan kontak lapak ini dihapus. Lapak, link dan kode tetap.
          </p>
          <Button variant="danger" className="self-start" onClick={() => setDanger('clear')}>
            Kosongkan data…
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="max-w-prose text-sm">
            <strong className="font-semibold">Hapus lapak.</strong> Lapak, semua datanya dan kode aksesnya dihapus. Link berhenti bekerja.
          </p>
          <Button variant="danger" className="self-start" onClick={() => setDanger('delete')}>
            Hapus lapak…
          </Button>
        </div>
      </section>

      <ConfirmTyped
        open={danger !== null}
        onClose={() => {
          setDanger(null)
          setDangerError('')
        }}
        title={danger === 'clear' ? `Kosongkan ${lapak.name}?` : `Hapus ${lapak.name}?`}
        message={
          danger === 'clear'
            ? `${lapak.events} event (beserta pembayarannya) dan ${lapak.contacts} kontak akan dihapus.`
            : `Lapak beserta ${lapak.events} event dan ${lapak.contacts} kontak akan dihapus. Link /l/${lapak.slug} berhenti bekerja.`
        }
        word={lapak.slug}
        confirmLabel={danger === 'clear' ? 'Kosongkan data' : 'Hapus lapak'}
        loading={dangerBusy}
        error={dangerError}
        onConfirm={() => void runDanger()}
      />
    </div>
  )
}
