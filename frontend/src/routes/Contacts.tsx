import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Plus, Search } from 'lucide-react'
import { useContacts } from '../api/contacts'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SkeletonRows } from '../components/ui/Skeleton'
import { useOverlay } from '../hooks/useOverlay'
import { formatPhone } from '../lib/phone'

export default function Contacts() {
  const { open } = useOverlay()
  const { data, isLoading, isError, refetch } = useContacts()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (data ?? []).filter((c) => !needle || [c.name, c.organization, c.phone].some((s) => s.toLowerCase().includes(needle)))
  }, [data, q])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl">Kontak</h1>
        <Button variant="primary" write onClick={() => open('new', 'contact')}>
          <Plus size={18} strokeWidth={1.5} aria-hidden />
          Tambah kontak
        </Button>
      </div>
      <div className="relative">
        <Search aria-hidden size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input type="search" aria-label="Cari kontak" placeholder="Cari nama, organisasi, nomor" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
      </div>

      {isLoading && <SkeletonRows />}
      {isError && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-unpaid">Gagal memuat kontak.</p>
          <Button onClick={() => void refetch()}>Coba lagi</Button>
        </div>
      )}
      {!isLoading && !isError && (data ?? []).length === 0 && <p className="py-6 text-sm text-muted">Belum ada kontak. Tambahkan nomor penanggung jawab bazar.</p>}
      {!isLoading && !isError && (data ?? []).length > 0 && list.length === 0 && <p className="py-6 text-sm text-muted">Tidak ada kontak yang cocok.</p>}

      <ul className="flex flex-col">
        {list.map((c) => (
          <li key={c.id} className="border-b border-line last:border-b-0">
            <Link to={`/contacts/${c.id}`} className="flex min-h-[56px] items-center justify-between gap-3 py-2 text-ink no-underline">
              <span className="min-w-0">
                <span className="block truncate text-base font-medium">{c.name}</span>
                {c.organization && <span className="block truncate text-sm text-muted">{c.organization}</span>}
              </span>
              <span className="num shrink-0 text-sm text-muted">{formatPhone(c.phone)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
