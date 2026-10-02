import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useContact, useContactEvents, useDeleteContact } from '../api/contacts'
import { ContactCard } from '../components/ContactCard'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { SkeletonRows } from '../components/ui/Skeleton'
import { toast } from '../components/ui/Toast'
import { useOverlay } from '../hooks/useOverlay'
import { formatDateLabel, todayJakarta } from '../lib/dates'

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { open } = useOverlay()
  const { data: c, isLoading, isError, refetch } = useContact(id)
  const events = useContactEvents(id)
  const del = useDeleteContact()
  const [confirm, setConfirm] = useState(false)
  const today = todayJakarta()

  if (isLoading) return <SkeletonRows count={2} />
  if (isError || !c) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-unpaid">Kontak tidak ditemukan atau gagal dimuat.</p>
        <Button onClick={() => void refetch()}>Coba lagi</Button>
      </div>
    )
  }

  // Upcoming first (soonest), then past (most recent first).
  const all = events.data ?? []
  const upcoming = all.filter((e) => e.date >= today)
  const past = all.filter((e) => e.date < today).reverse()
  const linked = [...upcoming, ...past]

  const remove = async () => {
    try {
      await del.mutateAsync(c.id)
      toast.show('Kontak dihapus')
      navigate('/contacts', { replace: true })
    } catch {
      toast.show('Gagal menghapus. Coba lagi.')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link to="/contacts" className="inline-flex min-h-[44px] items-center gap-1 text-sm no-underline">
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
        Kontak
      </Link>
      <h1 className="text-2xl">{c.name}</h1>
      <ContactCard contact={c} />
      {c.notes && <p className="whitespace-pre-wrap text-sm">{c.notes}</p>}

      <section aria-labelledby="ev-h" className="flex flex-col gap-1">
        <h2 id="ev-h" className="text-lg">
          Event terkait
        </h2>
        {events.isLoading && <SkeletonRows count={2} />}
        {!events.isLoading && linked.length === 0 && <p className="text-sm text-muted">Belum ada event dengan kontak ini.</p>}
        <ul>
          {linked.map((e) => (
            <li key={e.id} className="border-b border-line last:border-b-0">
              <Link to={`/event/${e.id}`} className={`flex min-h-[44px] items-center justify-between gap-3 py-2 text-ink no-underline ${e.date < today ? 'opacity-70' : ''}`}>
                <span className="min-w-0 truncate">{e.title}</span>
                <span className="num shrink-0 text-sm text-muted">{formatDateLabel(e.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button write onClick={() => open('editContact', c.id)}>Edit</Button>
        <Button variant="danger" write onClick={() => setConfirm(true)}>
          Hapus
        </Button>
      </div>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Hapus kontak?"
        message={
          linked.length > 0
            ? `Hapus '${c.name}'? ${linked.length} event tetap ada, tetapi tanpa kontak.`
            : `Hapus '${c.name}'?`
        }
        confirmLabel="Hapus"
        danger
        loading={del.isPending}
        onConfirm={() => void remove()}
      />
    </div>
  )
}
