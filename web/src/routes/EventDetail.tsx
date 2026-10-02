import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { restoreEvent, useDeleteEvent, useEvent, useSetEventStatus } from '../api/events'
import { ContactCard } from '../components/ContactCard'
import { DateStub } from '../components/DateStub'
import { PaymentBar } from '../components/PaymentBar'
import { StatusBadge } from '../components/StatusBadge'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { SkeletonRows } from '../components/ui/Skeleton'
import { toast } from '../components/ui/Toast'
import { useOverlay } from '../hooks/useOverlay'
import { useQueryClient } from '@tanstack/react-query'
import { formatDayMonth, formatTimeRange, todayJakarta } from '../lib/dates'
import { formatRupiah } from '../lib/money'
import { paid, paymentStatus, remaining } from '../lib/payment'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-b border-line py-2 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { open } = useOverlay()
  const { data: e, isLoading, isError, refetch } = useEvent(id)
  const setStatus = useSetEventStatus()
  const del = useDeleteEvent()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <SkeletonRows count={2} />
  if (isError || !e) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-unpaid">Event tidak ditemukan atau gagal dimuat.</p>
        <Button onClick={() => void refetch()}>Coba lagi</Button>
      </div>
    )
  }

  const cancelled = e.status === 'cancelled'
  const back = `/?m=${e.date.slice(0, 7)}`
  const total = e.total_cost
  const { status, overpaid } = paymentStatus(total, e.payments)

  const toggleStatus = async () => {
    try {
      await setStatus.mutateAsync(e.id, cancelled ? 'active' : 'cancelled')
      toast.show(cancelled ? 'Event diaktifkan' : 'Event dibatalkan')
    } catch {
      toast.show('Gagal mengubah status')
    }
  }

  const remove = async () => {
    const snapshot = e
    try {
      await del.mutateAsync(e.id)
      setConfirmDelete(false)
      navigate(back, { replace: true })
      toast.show('Event dihapus', {
        ms: 5000,
        action: {
          label: 'Urungkan',
          onClick: () => {
            void restoreEvent(snapshot)
              .then((created) => {
                void qc.invalidateQueries({ queryKey: ['events'] })
                toast.show('Event dikembalikan')
                navigate(`/event/${created.id}`)
              })
              .catch(() => toast.show('Gagal mengembalikan event'))
          },
        },
      })
    } catch {
      toast.show('Gagal menghapus. Coba lagi.')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link to={back} className="inline-flex min-h-[44px] items-center gap-1 text-sm no-underline">
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden />
        Agenda
      </Link>

      <header className="flex gap-3">
        <DateStub as="div" date={e.date} today={e.date === todayJakarta()} />
        <div className="min-w-0 flex-1 border-l border-dashed border-line-strong pl-4">
          <h1 className={`text-2xl ${cancelled ? 'line-through text-muted' : ''}`}>{e.title}</h1>
          <div className="mt-2">
            <StatusBadge total={total} payments={e.payments} cancelled={cancelled} />
          </div>
        </div>
      </header>

      <dl>
        <Row label="Waktu">{formatTimeRange(e.start_time, e.end_time) || 'Belum diatur'}</Row>
        <Row label="Lokasi">{e.location}</Row>
        <Row label="Biaya booth">
          <span className="num">{formatRupiah(total)}</span>
        </Row>
        {e.notes && <Row label="Catatan">{e.notes}</Row>}
      </dl>

      <section aria-labelledby="pay-h" className="flex flex-col gap-2">
        <h2 id="pay-h" className="text-lg">
          Pembayaran
        </h2>
        <PaymentBar total={total} payments={e.payments} />
        <div className="num flex justify-between text-sm">
          <span>Terbayar {formatRupiah(paid(e.payments))}</span>
          <span>Sisa {formatRupiah(remaining(total, e.payments))}</span>
        </div>
        {status === 'lunas' && overpaid > 0 && <p className="num text-sm text-muted">Lebih {formatRupiah(overpaid)}</p>}
        {e.payments.length === 0 && <p className="text-sm text-muted">Belum ada pembayaran.</p>}
      </section>

      {e.expand?.contact && (
        <section aria-labelledby="pj-h" className="flex flex-col gap-2">
          <h2 id="pj-h" className="text-lg">
            Penanggung jawab
          </h2>
          <ContactCard contact={e.expand.contact} link />
        </section>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button onClick={() => open('edit', e.id)}>Edit</Button>
        <Button disabled title="Segera hadir">
          Duplikat
        </Button>
        <Button onClick={() => void toggleStatus()} loading={setStatus.isPending}>
          {cancelled ? 'Aktifkan' : 'Batalkan'}
        </Button>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          Hapus
        </Button>
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus event?"
        message={`Hapus '${e.title}' ${formatDayMonth(e.date)}? Pembayaran ikut terhapus.`}
        confirmLabel="Hapus"
        danger
        loading={del.isPending}
        onConfirm={() => void remove()}
      />
    </div>
  )
}
