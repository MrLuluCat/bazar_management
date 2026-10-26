import { useNavigate, useLocation } from 'react-router'
import { useContacts, useCreateContact } from '../api/contacts'
import { normalizePhone } from '../lib/phone'
import type { ContactChoice } from './ContactPicker'
import type { EventInput } from '../api/events'
import { useCreateEvent, useEvent, usePastLocations, useUpdateEvent } from '../api/events'
import { useWorkspace } from '../api/workspace'
import { useOverlay } from '../hooks/useOverlay'
import { todayJakarta } from '../lib/dates'
import type { EventFormValues } from '../lib/eventSchema'
import { useCreateSeries, useUpdateSeries } from '../api/series'
import { SeriesScopeDialog, type SeriesScope } from './SeriesScopeDialog'
import { useState } from 'react'
import { EventForm } from './EventForm'
import { toast } from './ui/Toast'

/** Mounted in AppShell: opens the event sheet from ?new=event or ?edit=:id. */
export function EventFormHost() {
  const { params, close } = useOverlay()
  const navigate = useNavigate()
  const location = useLocation()
  const ws = useWorkspace()
  const locations = usePastLocations()
  const create = useCreateEvent(ws.data?.id)
  const update = useUpdateEvent()
  const contacts = useContacts()
  const createContact = useCreateContact(ws.data?.id)
  const createSeries = useCreateSeries()
  const updateSeries = useUpdateSeries()
  const [pending, setPending] = useState<{ patch: EventInput } | null>(null)

  const editId = params.get('edit')
  const isNew = params.get('new') === 'event'
  const editing = useEvent(editId ?? undefined)
  const open = isNew || (!!editId && !!editing.data)
  const defaultDate = params.get('date') ?? todayJakarta()

  const initial = editing.data
    ? {
        title: editing.data.title, date: editing.data.date, start_time: editing.data.start_time, end_time: editing.data.end_time,
        location: editing.data.location, total_cost: editing.data.total_cost, notes: editing.data.notes, status: editing.data.status,
      }
    : undefined

  const finishEdit = () => {
    const p = new URLSearchParams(location.search)
    p.delete('edit')
    navigate({ pathname: location.pathname, search: p.toString() }, { replace: true })
  }

  const applyScope = async (scope: SeriesScope) => {
    if (!pending || !editing.data) return
    const { patch } = pending
    setPending(null)
    try {
      await updateSeries.mutateAsync({ event: editing.data, patch, scope })
      toast.show('Event disimpan')
      finishEdit()
    } catch {
      toast.show('Gagal menyimpan. Coba lagi.')
    }
  }

  const submit = async (values: EventFormValues, choice: ContactChoice, repeatDates: string[] | null) => {
    try {
      let contact = choice.id
      if (choice.draft) {
        const phone = normalizePhone(choice.draft.phone)
        if (!phone) throw new Error('phone')
        const created = await createContact.mutateAsync({ name: choice.draft.name.trim(), phone, organization: '', notes: '' })
        contact = created.id
      }
      if (editId) {
        if (editing.data?.series_id) {
          setPending({ patch: { ...values, contact } })
          return
        }
        await update.mutateAsync({ id: editId, patch: { ...values, contact } })
        toast.show('Event disimpan')
        finishEdit()
      } else if (repeatDates) {
        if (!ws.data) throw new Error('Workspace belum siap')
        try {
          const made = await createSeries.mutateAsync({ workspace: ws.data.id, base: { ...values, contact }, dates: repeatDates })
          toast.show(`${made.length} event dibuat`)
        } catch (err) {
          const created = (err as { created?: number }).created ?? 0
          toast.show(created > 0 ? `Hanya ${created} event berhasil dibuat. Coba lagi untuk sisanya.` : 'Gagal menyimpan. Coba lagi.')
        }
        navigate(`/?m=${repeatDates[0].slice(0, 7)}&f=${repeatDates[0]}`, { replace: true })
      } else {
        await create.mutateAsync({ ...values, contact })
        toast.show('Event ditambahkan')
        navigate(`/?m=${values.date.slice(0, 7)}&f=${values.date}`, { replace: true })
      }
    } catch {
      toast.show('Gagal menyimpan. Coba lagi.')
    }
  }

  return (
    <>
    <EventForm
      open={open}
      onClose={close}
      initial={editId ? initial : undefined}
      defaultDate={defaultDate}
      locations={locations.data ?? []}
      contacts={contacts.data ?? []}
      initialContact={editId ? (editing.data?.contact ?? '') : ''}
      onSubmit={submit}
    />
    <SeriesScopeDialog
      open={!!pending}
      onClose={() => setPending(null)}
      title="Ubah event berulang"
      message="Terapkan perubahan ke mana? Tanggal dan pembayaran tidak ikut berubah pada event lain."
      onChoose={(scope) => void applyScope(scope)}
    />
    </>
  )
}
