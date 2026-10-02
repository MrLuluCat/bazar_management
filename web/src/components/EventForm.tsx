import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ContactRecord } from '../api/types'
import { RepeatFields, emptyRepeat, selectedDates, type RepeatValue } from './RepeatFields'
import { ContactPicker, validateDraft, type ContactChoice } from './ContactPicker'
import { eventSchema, type EventFormValues } from '../lib/eventSchema'
import { Button } from './ui/Button'
import { DatePicker } from './ui/DatePicker'
import { Field } from './ui/Field'
import { Input, Select, Textarea } from './ui/Input'
import { RupiahInput } from './ui/RupiahInput'
import { Sheet } from './ui/Sheet'
import { TimeInput } from './ui/TimeInput'

type Props = {
  open: boolean
  onClose: () => void
  /** Present when editing. */
  initial?: Partial<EventFormValues>
  defaultDate: string
  locations: string[]
  contacts?: ContactRecord[]
  initialContact?: string
  onSubmit: (values: EventFormValues, contact: ContactChoice, repeatDates: string[] | null) => Promise<void>
  /** Extra fields (contact picker, repeat) rendered before notes. */
  children?: React.ReactNode
}

const empty = (date: string): EventFormValues => ({
  title: '', date, start_time: '', end_time: '', location: '', total_cost: 0, notes: '', status: 'active',
})

export function EventForm({ open, onClose, initial, defaultDate, locations, contacts = [], initialContact = '', onSubmit, children }: Props) {
  const editing = !!initial
  const [v, setV] = useState<EventFormValues>({ ...empty(defaultDate), ...initial })
  const [repeat, setRepeat] = useState<RepeatValue>(emptyRepeat)
  const [choice, setChoice] = useState<ContactChoice>({ id: initialContact })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const inFlight = useRef(false)

  // Reset when (re)opened or when editing a different record.
  useEffect(() => {
    if (open) {
      setV({ ...empty(defaultDate), ...initial })
      setChoice({ id: initialContact })
      setRepeat(emptyRepeat)
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.title, defaultDate, initialContact])

  const set = <K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) => setV((p) => ({ ...p, [k]: val }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (inFlight.current) return
    const parsed = eventSchema.safeParse(v)
    const next: Record<string, string> = validateDraft(choice)
    if (!parsed.success) for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message
    const dates = !editing && repeat.enabled ? selectedDates(v.date, repeat) : null
    if (dates && dates.length === 0) next.until = 'Pilih tanggal akhir setelah tanggal mulai'
    setErrors(next)
    if (!parsed.success || Object.keys(next).length > 0) return
    inFlight.current = true
    setSaving(true)
    try {
      await onSubmit(parsed.data, choice, dates)
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Ubah event' : 'Tambah event'}
      footer={
        <Button type="submit" form="event-form" variant="primary" write className="w-full" loading={saving}>
          Simpan
        </Button>
      }
    >
      <form id="event-form" onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Judul" error={errors.title}>
          <Input data-autofocus value={v.title} onChange={(e) => set('title', e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Tanggal" error={errors.date}>
          <DatePicker value={v.date} onChange={(d) => set('date', d)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mulai" error={errors.start_time}>
            <TimeInput value={v.start_time} onChange={(t) => set('start_time', t)} />
          </Field>
          <Field label="Selesai" error={errors.end_time}>
            <TimeInput value={v.end_time} onChange={(t) => set('end_time', t)} />
          </Field>
        </div>
        <Field label="Lokasi" error={errors.location}>
          <Input value={v.location} onChange={(e) => set('location', e.target.value)} list="event-locations" autoComplete="off" />
        </Field>
        <datalist id="event-locations">
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <ContactPicker contacts={contacts} value={choice} onChange={setChoice} errors={errors} />
        {!editing && <RepeatFields startDate={v.date} value={repeat} onChange={setRepeat} error={errors.until} />}
        {children}
        <Field label="Biaya booth" error={errors.total_cost}>
          <RupiahInput value={v.total_cost} onChange={(n) => set('total_cost', n)} />
        </Field>
        {editing && (
          <Field label="Status">
            <Select value={v.status} onChange={(e) => set('status', e.target.value as EventFormValues['status'])}>
              <option value="active">Aktif</option>
              <option value="cancelled">Batal</option>
            </Select>
          </Field>
        )}
        <Field label="Catatan">
          <Textarea value={v.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </form>
    </Sheet>
  )
}
