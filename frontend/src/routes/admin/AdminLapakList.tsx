import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Sheet } from '../../components/ui/Sheet'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { adminApi, errorMessage, type AdminLapak } from '../../lib/adminPb'
import { randomPasscode, SLUG_RE, slugify, useLapakList } from './api'
import { ShareLapak } from './ShareLapak'

export default function AdminLapakList() {
  const list = useLapakList()
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<{ lapak: AdminLapak; passcode: string } | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-xl">
          Lapak {list.data && <span className="num font-normal text-muted">({list.data.length})</span>}
        </h1>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={18} strokeWidth={1.5} aria-hidden />
          Lapak baru
        </Button>
      </div>

      {list.isPending && <SkeletonRows count={3} />}

      {list.isError && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">{errorMessage(list.error, 'Daftar lapak gagal dimuat.')}</p>
          <Button onClick={() => void list.refetch()}>
            <RefreshCw size={18} strokeWidth={1.5} aria-hidden />
            Coba lagi
          </Button>
        </div>
      )}

      {list.data?.length === 0 && (
        <div className="flex flex-col items-start gap-2 border-y border-line py-8">
          <p className="text-base font-medium">Belum ada lapak.</p>
          <p className="max-w-prose text-sm text-muted">
            Buat lapak pertama: beri nama, pilih link, dan tentukan kode akses. Setelah itu kirim link dan kodenya ke tim lapak.
          </p>
        </div>
      )}

      {!!list.data?.length && (
        <ul className="divide-y divide-line border-y border-line">
          {list.data.map((l) => (
            <li key={l.id}>
              <Link
                to={`/admin/lapak/${l.id}`}
                className="-mx-2 flex min-h-[64px] items-center gap-3 rounded-md px-2 py-3 text-ink no-underline transition-colors duration-150 hover:bg-accent-wash"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base font-medium">{l.name}</span>
                  <span className="num truncate text-sm text-muted">/l/{l.slug}</span>
                </span>
                <span className="num shrink-0 text-right text-sm text-muted">
                  {l.events} event
                  <br />
                  {l.contacts} kontak
                </span>
                <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateLapakSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(lapak, passcode) => {
          setCreating(false)
          setCreated({ lapak, passcode })
        }}
      />

      <Sheet open={!!created} onClose={() => setCreated(null)} title="Lapak siap" footer={<div className="flex justify-end"><Button variant="primary" onClick={() => setCreated(null)}>Selesai</Button></div>}>
        {created && (
          <div className="flex flex-col gap-4">
            <p className="text-sm">
              Kirim link dan kode ini ke tim <strong className="font-semibold">{created.lapak.name}</strong>. Kode akses tidak ditampilkan lagi setelah jendela ini ditutup.
            </p>
            <ShareLapak name={created.lapak.name} slug={created.lapak.slug} passcode={created.passcode} />
          </div>
        )}
      </Sheet>
    </div>
  )
}

function CreateLapakSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (l: AdminLapak, passcode: string) => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [passcode, setPasscode] = useState(randomPasscode)
  const [errors, setErrors] = useState<{ name?: string; slug?: string; passcode?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setName('')
    setSlug('')
    setSlugTouched(false)
    setPasscode(randomPasscode())
    setErrors({})
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Isi nama lapak.'
    if (slug.length < 3 || slug.length > 40 || !SLUG_RE.test(slug)) next.slug = 'Pakai 3–40 huruf kecil, angka atau tanda minus.'
    if (passcode.length < 6) next.passcode = 'Minimal 6 karakter.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      const l = await adminApi.create({ name: name.trim(), slug, passcode })
      await qc.invalidateQueries({ queryKey: ['admin', 'lapak'] })
      onCreated(l, passcode)
      reset()
    } catch (err) {
      const msg = errorMessage(err)
      setErrors(msg.startsWith('Link') ? { slug: msg } : { form: msg })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Lapak baru"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" loading={busy} onClick={() => void submit()}>
            Buat lapak
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Nama lapak" error={errors.name}>
          <Input
            value={name}
            data-autofocus
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
          />
        </Field>
        <Field label="Link" error={errors.slug} hint={errors.slug ? undefined : `${window.location.host}/l/${slug || 'nama-lapak'}`}>
          <Input
            value={slug}
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
            }}
          />
        </Field>
        <div className="flex items-end gap-2">
          <Field label="Kode akses" error={errors.passcode} className="flex-1">
            <Input value={passcode} autoComplete="off" autoCapitalize="none" spellCheck={false} onChange={(e) => setPasscode(e.target.value)} className="num" />
          </Field>
          <Button onClick={() => setPasscode(randomPasscode())} aria-label="Buat kode acak" title="Buat kode acak" className={errors.passcode ? 'mb-6' : ''}>
            <RefreshCw size={18} strokeWidth={1.5} aria-hidden />
          </Button>
        </div>
        {errors.form && (
          <p role="alert" className="text-sm text-unpaid">
            {errors.form}
          </p>
        )}
        <button type="submit" hidden />
      </form>
    </Sheet>
  )
}
