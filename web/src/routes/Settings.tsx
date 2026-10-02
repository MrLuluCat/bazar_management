import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { toast } from '../components/ui/Toast'
import { useUpdateWorkspaceName, useWorkspace } from '../api/workspace'
import { lock } from '../lib/pb'
import { applyTheme, getTheme, type ThemePref } from '../lib/theme'

type InstallEvent = Event & { prompt(): Promise<void> }

export default function Settings() {
  const navigate = useNavigate()
  const ws = useWorkspace()
  const rename = useUpdateWorkspaceName()
  const [name, setName] = useState('')
  const [theme, setTheme] = useState<ThemePref>(getTheme())
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null)
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    if (ws.data) setName(ws.data.name)
  }, [ws.data])

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault()
      setInstallEvt(e as InstallEvent)
    }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const save = async () => {
    if (!ws.data || !name.trim()) return
    try {
      await rename.mutateAsync({ id: ws.data.id, name: name.trim() })
      toast.show('Nama disimpan')
    } catch {
      toast.show('Gagal menyimpan nama')
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-xl">Pengaturan</h1>

      <section className="flex flex-col gap-3">
        <Field label="Nama lapak">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Button onClick={save} loading={rename.isPending} disabled={!ws.data || !name.trim() || name === ws.data.name} className="self-start">
          Simpan
        </Button>
      </section>

      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium">Tema</span>
        <SegmentedControl
          label="Tema"
          value={theme}
          onChange={(t) => {
            setTheme(t)
            applyTheme(t)
          }}
          options={[
            { value: 'auto', label: 'Otomatis' },
            { value: 'light', label: 'Terang' },
            { value: 'dark', label: 'Gelap' },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium">Pasang aplikasi</span>
        {installEvt ? (
          <Button className="self-start" onClick={() => void installEvt.prompt()}>
            Pasang aplikasi
          </Button>
        ) : isIos ? (
          <p className="text-sm text-muted">Di iPhone: ketuk Bagikan, lalu Tambah ke Layar Utama.</p>
        ) : (
          <p className="text-sm text-muted">Buka lewat Chrome atau Edge untuk memasang aplikasi.</p>
        )}
      </section>

      <section className="flex flex-col gap-2 border-t border-line pt-4">
        <Button
          variant="danger"
          className="self-start"
          onClick={() => {
            lock()
            navigate('/unlock', { replace: true })
          }}
        >
          Kunci
        </Button>
        <p className="num text-xs text-muted">Versi {__APP_VERSION__}</p>
      </section>
    </div>
  )
}
