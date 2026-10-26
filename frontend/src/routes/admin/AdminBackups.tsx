import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Archive, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { SkeletonRows } from '../../components/ui/Skeleton'
import { toast } from '../../components/ui/Toast'
import { adminApi, adminPb, errorMessage, type Backup } from '../../lib/adminPb'
import { ConfirmTyped } from './ConfirmTyped'
import { useBackups } from './api'

const when = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })

function size(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

/** Backup file name -> what made it. */
function origin(name: string): string {
  if (name.startsWith('@auto')) return 'Harian otomatis'
  if (name.startsWith('pre-clear')) return 'Sebelum kosongkan data'
  if (name.startsWith('pre-delete')) return 'Sebelum hapus lapak'
  if (name.startsWith('pre-restore')) return 'Sebelum pulihkan'
  if (name.startsWith('pre-manual')) return 'Manual'
  return 'Lainnya'
}

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000))
    try {
      if ((await fetch(`${adminPb.baseURL}/api/health`)).ok) return
    } catch {
      /* restarting */
    }
  }
}

export default function AdminBackups() {
  const backups = useBackups()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [target, setTarget] = useState<Backup | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState('')

  const create = async () => {
    setCreating(true)
    try {
      await adminApi.createBackup()
      await qc.invalidateQueries({ queryKey: ['admin', 'backups'] })
      toast.show('Backup dibuat')
    } catch (err) {
      toast.show(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const restore = async () => {
    if (!target) return
    setRestoring(true)
    setRestoreError('')
    try {
      await adminApi.restore(target.name)
    } catch (err) {
      // The server restarts mid-request on success: a dropped connection is expected.
      if ((err as { status?: number }).status !== 0) {
        setRestoreError(errorMessage(err))
        setRestoring(false)
        return
      }
    }
    await waitForServer()
    adminApi.logout()
    navigate('/admin/login', { replace: true, state: { notice: 'Database dipulihkan. Masuk lagi untuk melanjutkan.' } })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-xl">Backup</h1>
        <Button variant="primary" loading={creating} onClick={() => void create()}>
          <Archive size={18} strokeWidth={1.5} aria-hidden />
          Buat backup
        </Button>
      </div>
      <p className="max-w-prose text-sm text-muted">
        Backup harian dibuat otomatis pukul 02.00 WIB (7 terakhir disimpan). Sebelum kosongkan data, hapus lapak atau pulihkan, backup juga dibuat otomatis.
      </p>

      {backups.isPending && <SkeletonRows count={3} />}

      {backups.isError && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">{errorMessage(backups.error, 'Daftar backup gagal dimuat.')}</p>
          <Button onClick={() => void backups.refetch()}>
            <RefreshCw size={18} strokeWidth={1.5} aria-hidden />
            Coba lagi
          </Button>
        </div>
      )}

      {backups.data && backups.data.items.length === 0 && <p className="border-y border-line py-8 text-sm">Belum ada backup.</p>}

      {!!backups.data?.items.length && (
        <ul className="divide-y divide-line border-y border-line">
          {backups.data.items.map((b) => (
            <li key={b.name} className="flex min-h-[64px] items-center gap-3 py-3">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="num text-base">{when.format(new Date(b.modified))}</span>
                <span className="truncate text-sm text-muted" title={b.name}>
                  {origin(b.name)} · <span className="num">{size(b.size)}</span>
                </span>
              </span>
              {backups.data.canRestore && (
                <Button variant="ghost" onClick={() => setTarget(b)}>
                  Pulihkan…
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {backups.data && !backups.data.canRestore && (
        <p className="text-sm text-muted">Pulihkan hanya tersedia di server Linux (VPS).</p>
      )}

      <ConfirmTyped
        open={!!target}
        onClose={() => {
          if (restoring) return
          setTarget(null)
          setRestoreError('')
        }}
        title="Pulihkan backup?"
        message={
          target
            ? `Seluruh database (semua lapak) dikembalikan ke kondisi ${when.format(new Date(target.modified))}. Perubahan setelah itu hilang. Server restart sebentar.`
            : ''
        }
        word="pulihkan"
        confirmLabel={restoring ? 'Memulihkan…' : 'Pulihkan'}
        loading={restoring}
        error={restoreError}
        onConfirm={() => void restore()}
      />
    </div>
  )
}
