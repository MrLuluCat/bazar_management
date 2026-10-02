import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { PaymentInput } from '../api/payments'
import type { PaymentRecord } from '../api/types'
import { Button } from './ui/Button'
import { DatePicker } from './ui/DatePicker'
import { Field } from './ui/Field'
import { Input } from './ui/Input'
import { RupiahInput } from './ui/RupiahInput'
import { Sheet } from './ui/Sheet'

const MAX_PROOF = 5 * 1024 * 1024

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  /** 'YYYY-MM-DD' default for paid_at. */
  today: string
  /** Prefill: the remaining balance for "Lunasi". */
  initialAmount?: number
  /** Present when editing. */
  payment?: PaymentRecord
  /** URL of the existing proof (edit). */
  proofUrl?: string
  onSubmit: (values: PaymentInput) => Promise<void>
}

export function PaymentForm({ open, onClose, title, today, initialAmount = 0, payment, proofUrl, onSubmit }: Props) {
  const [amount, setAmount] = useState(0)
  const [paidAt, setPaidAt] = useState(today)
  const [note, setNote] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [removeProof, setRemoveProof] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!open) return
    setAmount(payment?.amount ?? initialAmount)
    setPaidAt(payment?.paid_at ?? today)
    setNote(payment?.note ?? '')
    setProof(null)
    setRemoveProof(false)
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment?.id, initialAmount])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (inFlight.current) return
    const next: Record<string, string> = {}
    if (!(amount > 0)) next.amount = 'Nominal harus lebih dari 0'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) next.paid_at = 'Tanggal wajib diisi'
    if (proof) {
      if (!proof.type.startsWith('image/')) next.proof = 'File harus berupa foto'
      else if (proof.size > MAX_PROOF) next.proof = 'Foto maksimal 5 MB'
    }
    setErrors(next)
    if (Object.keys(next).length) return
    inFlight.current = true
    setSaving(true)
    try {
      await onSubmit({ amount, paid_at: paidAt, note: note.trim(), proof, removeProof })
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title ?? (payment ? 'Ubah pembayaran' : 'Catat pembayaran')}
      footer={
        <Button type="submit" form="payment-form" variant="primary" className="w-full" loading={saving}>
          Simpan
        </Button>
      }
    >
      <form id="payment-form" onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Nominal" error={errors.amount}>
          <RupiahInput data-autofocus value={amount} onChange={setAmount} />
        </Field>
        <Field label="Tanggal bayar" error={errors.paid_at}>
          <DatePicker value={paidAt} onChange={setPaidAt} />
        </Field>
        <Field label="Catatan">
          <Input value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" placeholder="DP, pelunasan, transfer" />
        </Field>
        <Field label="Foto bukti" error={errors.proof} hint="Opsional, maksimal 5 MB">
          <Input type="file" accept="image/*" onChange={(e) => setProof(e.target.files?.[0] ?? null)} className="py-2" />
        </Field>
        {payment && proofUrl && !proof && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <a href={proofUrl} target="_blank" rel="noopener noreferrer">
              Lihat foto saat ini
            </a>
            <label className="flex min-h-[44px] items-center gap-2">
              <input type="checkbox" checked={removeProof} onChange={(e) => setRemoveProof(e.target.checked)} />
              Hapus foto
            </label>
          </div>
        )}
      </form>
    </Sheet>
  )
}
