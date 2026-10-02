import { Image, Pencil, Trash2 } from 'lucide-react'
import type { PaymentRecord } from '../api/types'
import { pb } from '../lib/pb'
import { formatDayMonth } from '../lib/dates'
import { formatRupiah } from '../lib/money'

type Props = {
  payments: PaymentRecord[]
  onEdit: (p: PaymentRecord) => void
  onDelete: (p: PaymentRecord) => void
  disabled?: boolean
}

const iconBtn = 'flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent-wash disabled:opacity-50'

export function PaymentList({ payments, onEdit, onDelete, disabled }: Props) {
  if (payments.length === 0) return <p className="text-sm text-muted">Belum ada pembayaran.</p>
  return (
    <ul className="flex flex-col">
      {payments.map((p) => {
        const label = p.note || formatDayMonth(p.paid_at)
        return (
          <li key={p.id} className="flex items-center justify-between gap-2 border-b border-line py-1 last:border-b-0">
            <div className="min-w-0">
              <p className="num text-base font-medium">{formatRupiah(p.amount)}</p>
              <p className="truncate text-sm text-muted">
                {formatDayMonth(p.paid_at)}
                {p.note ? ` · ${p.note}` : ''}
              </p>
            </div>
            <div className="flex shrink-0">
              {p.proof && (
                <a href={pb.files.getURL(p, p.proof)} target="_blank" rel="noopener noreferrer" aria-label={`Lihat bukti ${label}`} className={iconBtn}>
                  <Image size={18} strokeWidth={1.5} aria-hidden />
                </a>
              )}
              <button type="button" aria-label={`Ubah pembayaran ${label}`} className={iconBtn} onClick={() => onEdit(p)} disabled={disabled}>
                <Pencil size={18} strokeWidth={1.5} aria-hidden />
              </button>
              <button type="button" aria-label={`Hapus pembayaran ${label}`} className={iconBtn} onClick={() => onDelete(p)} disabled={disabled}>
                <Trash2 size={18} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
