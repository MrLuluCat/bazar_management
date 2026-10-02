import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { restoreEvent, useDeleteEvent, useEvent, useSetEventStatus } from '../api/events'
import { useCreatePayment, useDeletePayment, useUpdatePayment, type PaymentInput } from '../api/payments'
import { PaymentForm } from '../components/PaymentForm'
import { PaymentList } from '../components/PaymentList'
import type { PaymentRecord } from '../api/types'
import { pb } from '../lib/pb'
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
  const { params, open, close } = useOverlay()
  const { data: e, isLoading, isError, refetch } = useEvent(id)
  const setStatus = useSetEventStatus()
  const del = useDeleteEvent()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletingPayment, setDeletingPayment] = useState<PaymentRecord | null>(null)
  const createPayment = useCreatePayment(id ?? '')
  const updatePayment = useUpdatePayment(id ?? '')
  const deletePayment = useDeletePayment(id ?? '')

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

  const payParam = params.get('pay')
  const editingPayment = payParam && payParam !== 'new' && payParam !== 'lunasi' ? e.payments.find((p) => p.id === payParam) : undefined
  const payOpen = payParam === 'new' || payParam === 'lunasi' || !!editingPayment
  const left = remaining(total, e.payments)

  const savePayment = async (values: PaymentInput) => {
    close()
    try {
      if (editingPayment) await updatePayment.mutateAsync({ id: editingPayment.id, input: values })
      else await createPayment.mutateAsync(values)
      toast.show('Pembayaran dicatat')
    } catch {
      /* rollback + toast handled by the mutation */
    }
  }

  const removePayment = async () => {
    const target = deletingPayment
    setDeletingPayment(null)
    if (!target) return
    try {
      await deletePayment.mutateAsync(target.id)
      toast.show('Pembayaran dihapus')
    } catch {
      /* rollback + toast handled by the mutation */
    }
  }

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
        <PaymentList
          payments={e.payments}
          onEdit={(p) => open('pay', p.id)}
          onDelete={setDeletingPayment}
        />
        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={() => open('pay', 'new')}>Catat pembayaran</Button>
          {left > 0 && total > 0 && (
            <Button variant="primary" onClick={() => open('pay', 'lunasi')}>
              Lunasi
            </Button>
          )}
        </div>
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

      <PaymentForm
        open={payOpen}
        onClose={close}
        title={payParam === 'lunasi' ? 'Lunasi' : undefined}
        today={todayJakarta()}
        initialAmount={payParam === 'lunasi' ? left : 0}
        payment={editingPayment}
        proofUrl={editingPayment?.proof ? pb.files.getURL(editingPayment, editingPayment.proof) : undefined}
        onSubmit={savePayment}
      />
      <Dialog
        open={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        title="Hapus pembayaran?"
        message={deletingPayment ? `Hapus pembayaran ${formatRupiah(deletingPayment.amount)}${deletingPayment.note ? ` (${deletingPayment.note})` : ''}?` : undefined}
        confirmLabel="Hapus"
        danger
        onConfirm={() => void removePayment()}
      />
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
