import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CalendarPlus, Check, UserPlus, Wallet } from 'lucide-react'
import type { Proposal } from '../../api/ai'
import { useWorkspace } from '../../api/workspace'
import { formatTimeRange } from '../../lib/dates'
import { formatRupiah } from '../../lib/money'
import { formatPhone } from '../../lib/phone'
import { pb } from '../../lib/pb'
import { Button } from '../ui/Button'
import { toast } from '../ui/Toast'
import { assistant, type ProposalState } from './store'

const day = (iso: string) => {
  try {
    return format(parseISO(iso), 'EEE, d MMM yyyy', { locale: localeId })
  } catch {
    return iso
  }
}

const ICON = { event: CalendarPlus, payment: Wallet, contact: UserPlus }
const SAVED = { event: 'Event disimpan', payment: 'Pembayaran dicatat', contact: 'Kontak disimpan' }

/** One AI proposal. Nothing is written until the user taps Simpan. */
export function ProposalCard({ p, bubbleId, state }: { p: Proposal; bubbleId: number; state: ProposalState }) {
  const ws = useWorkspace()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const Icon = ICON[p.kind]

  const save = async (thenEdit: boolean) => {
    if (!ws.data) return
    setBusy(true)
    try {
      let to = ''
      if (p.kind === 'event') {
        let contact = p.payload.contact || ''
        if (p.new_contact) contact = (await pb.collection('contacts').create({ ...p.new_contact, workspace: ws.data.id })).id
        const r = await pb.collection('events').create({ ...p.payload, contact, status: 'active', workspace: ws.data.id })
        to = `/event/${r.id}${thenEdit ? `?edit=${r.id}` : ''}`
      } else if (p.kind === 'contact') {
        const r = await pb.collection('contacts').create({ ...p.payload, workspace: ws.data.id })
        to = `/contacts/${r.id}${thenEdit ? `?editContact=${r.id}` : ''}`
      } else {
        const r = await pb.collection('payments').create(p.payload)
        to = `/event/${p.payload.event}${thenEdit ? `?pay=${r.id}` : ''}`
      }
      assistant.mark(bubbleId, p.id, 'saved')
      await Promise.all(['events', 'event', 'contacts', 'contact', 'contact-events', 'locations'].map((k) => qc.invalidateQueries({ queryKey: [k] })))
      toast.show(SAVED[p.kind])
      if (thenEdit) {
        assistant.hide()
        navigate(to)
      }
    } catch {
      toast.show('Gagal menyimpan. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const rows: [string, string][] =
    p.kind === 'event'
      ? [
          ['Tanggal', day(p.payload.date)],
          ['Waktu', formatTimeRange(p.payload.start_time, p.payload.end_time) || 'Belum diisi'],
          ['Lokasi', p.payload.location],
          ['Biaya booth', p.payload.total_cost ? formatRupiah(p.payload.total_cost) : 'Gratis'],
          ...(p.new_contact
            ? ([['Kontak baru', `${p.new_contact.name} · ${formatPhone(p.new_contact.phone)}`]] as [string, string][])
            : p.contact_name
              ? ([['Kontak', p.contact_name]] as [string, string][])
              : []),
        ]
      : p.kind === 'payment'
        ? [
            ['Event', p.event_title || 'Tidak ditemukan'],
            ['Jumlah', formatRupiah(p.payload.amount)],
            ['Tanggal bayar', day(p.payload.paid_at)],
            ...(p.payload.note ? ([['Catatan', p.payload.note]] as [string, string][]) : []),
          ]
        : [
            ['Telepon', p.payload.phone ? formatPhone(p.payload.phone) : '—'],
            ...(p.payload.organization ? ([['Organisasi', p.payload.organization]] as [string, string][]) : []),
          ]

  const title = p.kind === 'event' ? p.payload.title || 'Event tanpa judul' : p.kind === 'payment' ? 'Pembayaran' : p.payload.name || 'Kontak'
  const done = state !== 'open'

  return (
    <article className={'flex flex-col gap-3 rounded-md border border-line-strong bg-paper p-3' + (state === 'discarded' ? ' opacity-60' : '')} aria-label={`Usulan: ${title}`}>
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Icon size={18} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 truncate">{title}</span>
      </h3>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="num min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
      {p.reason && <p className="text-xs text-muted">{p.reason}</p>}
      {!p.valid && (
        <ul className="text-sm text-unpaid">
          {p.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {state === 'saved' && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-paid">
          <Check size={16} strokeWidth={2} aria-hidden /> Tersimpan
        </p>
      )}
      {state === 'discarded' && <p className="text-sm text-muted">Dibuang</p>}
      {!done && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" write loading={busy} disabled={!p.valid} disabledReason="Lengkapi dulu lewat percakapan" onClick={() => void save(false)}>
            Simpan
          </Button>
          <Button write disabled={!p.valid || busy} onClick={() => void save(true)}>
            Simpan &amp; ubah
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => assistant.mark(bubbleId, p.id, 'discarded')}>
            Buang
          </Button>
        </div>
      )}
    </article>
  )
}
