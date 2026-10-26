import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ContactInput } from '../api/contacts'
import { formatPhone, normalizePhone } from '../lib/phone'
import { Button } from './ui/Button'
import { Field } from './ui/Field'
import { Input, Textarea } from './ui/Input'
import { Sheet } from './ui/Sheet'

type Props = {
  open: boolean
  onClose: () => void
  initial?: ContactInput
  onSubmit: (values: ContactInput) => Promise<void>
}

const blank: ContactInput = { name: '', phone: '', organization: '', notes: '' }

export function ContactForm({ open, onClose, initial, onSubmit }: Props) {
  const [v, setV] = useState<ContactInput>(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    if (open) {
      setV(initial ? { ...initial, phone: initial.phone ? formatPhone(initial.phone) : '' } : blank)
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.name])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (inFlight.current) return
    const next: Record<string, string> = {}
    if (!v.name.trim()) next.name = 'Nama wajib diisi'
    const phone = normalizePhone(v.phone)
    if (!phone) next.phone = 'Nomor tidak valid'
    setErrors(next)
    if (next.name || next.phone || !phone) return
    inFlight.current = true
    setSaving(true)
    try {
      await onSubmit({ ...v, name: v.name.trim(), phone })
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? 'Ubah kontak' : 'Tambah kontak'}
      footer={
        <Button type="submit" form="contact-form" variant="primary" write className="w-full" loading={saving}>
          Simpan
        </Button>
      }
    >
      <form id="contact-form" onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Nama" error={errors.name}>
          <Input data-autofocus value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="Nomor WhatsApp" error={errors.phone} hint="Contoh: 0812-3456-7890">
          <Input type="tel" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
        </Field>
        <Field label="Organisasi">
          <Input value={v.organization} onChange={(e) => setV({ ...v, organization: e.target.value })} autoComplete="off" />
        </Field>
        <Field label="Catatan">
          <Textarea value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        </Field>
      </form>
    </Sheet>
  )
}
