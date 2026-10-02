import { useNavigate, useLocation } from 'react-router'
import { useCreateEvent, useEvent, usePastLocations, useUpdateEvent } from '../api/events'
import { useWorkspace } from '../api/workspace'
import { useOverlay } from '../hooks/useOverlay'
import { todayJakarta } from '../lib/dates'
import type { EventFormValues } from '../lib/eventSchema'
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

  const submit = async (values: EventFormValues) => {
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, patch: values })
        toast.show('Event disimpan')
        const p = new URLSearchParams(location.search)
        p.delete('edit')
        navigate({ pathname: location.pathname, search: p.toString() }, { replace: true })
      } else {
        await create.mutateAsync(values)
        toast.show('Event ditambahkan')
        navigate(`/?m=${values.date.slice(0, 7)}&f=${values.date}`, { replace: true })
      }
    } catch {
      toast.show('Gagal menyimpan. Coba lagi.')
    }
  }

  return (
    <EventForm
      open={open}
      onClose={close}
      initial={editId ? initial : undefined}
      defaultDate={defaultDate}
      locations={locations.data ?? []}
      onSubmit={submit}
    />
  )
}
