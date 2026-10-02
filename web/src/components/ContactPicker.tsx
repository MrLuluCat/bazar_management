import { useState } from 'react'
import { X } from 'lucide-react'
import type { ContactRecord } from '../api/types'
import { formatPhone, normalizePhone } from '../lib/phone'
import { Field } from './ui/Field'
import { Input } from './ui/Input'

export type ContactChoice = { id: string; draft?: { name: string; phone: string } }

/** Validates a draft; returns field errors (empty object = ok). */
export function validateDraft(choice: ContactChoice): Record<string, string> {
  if (!choice.draft) return {}
  const errors: Record<string, string> = {}
  if (!choice.draft.name.trim()) errors.draftName = 'Nama wajib diisi'
  if (!normalizePhone(choice.draft.phone)) errors.draftPhone = 'Nomor tidak valid'
  return errors
}

type Props = {
  contacts: ContactRecord[]
  value: ContactChoice
  onChange: (c: ContactChoice) => void
  errors?: Record<string, string>
}

export function ContactPicker({ contacts, value, onChange, errors = {} }: Props) {
  const [q, setQ] = useState('')
  const selected = contacts.find((c) => c.id === value.id)
  const matches = contacts.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5)

  if (value.draft) {
    return (
      <fieldset className="flex flex-col gap-3 rounded-lg border border-line p-3">
        <legend className="px-1 text-sm font-medium">Kontak baru</legend>
        <Field label="Nama kontak" error={errors.draftName}>
          <Input value={value.draft.name} onChange={(e) => onChange({ id: '', draft: { ...value.draft!, name: e.target.value } })} autoComplete="off" />
        </Field>
        <Field label="Nomor WhatsApp" error={errors.draftPhone}>
          <Input type="tel" inputMode="tel" value={value.draft.phone} onChange={(e) => onChange({ id: '', draft: { ...value.draft!, phone: e.target.value } })} />
        </Field>
        <button type="button" className="min-h-[44px] self-start text-sm underline underline-offset-4" onClick={() => onChange({ id: '' })}>
          Batal
        </button>
      </fieldset>
    )
  }

  if (selected) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Kontak</span>
        <div className="flex min-h-[44px] items-center justify-between gap-2 rounded-md border border-line-strong bg-surface px-3">
          <span className="min-w-0 truncate text-sm">
            {selected.name} <span className="num text-muted">{formatPhone(selected.phone)}</span>
          </span>
          <button type="button" aria-label="Hapus kontak" className="flex h-11 w-11 shrink-0 items-center justify-center" onClick={() => onChange({ id: '' })}>
            <X size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Field label="Kontak">
        <Input type="search" placeholder="Cari kontak" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </Field>
      {matches.length > 0 && (
        <ul className="flex flex-col rounded-md border border-line">
          {matches.map((c) => (
            <li key={c.id} className="border-b border-line last:border-b-0">
              <button type="button" className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 text-left text-sm hover:bg-accent-wash" onClick={() => onChange({ id: c.id })}>
                <span className="truncate">{c.name}</span>
                <span className="num shrink-0 text-muted">{formatPhone(c.phone)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="min-h-[44px] self-start text-sm font-medium text-accent underline underline-offset-4" onClick={() => onChange({ id: '', draft: { name: '', phone: '' } })}>
        + Kontak baru
      </button>
    </div>
  )
}
