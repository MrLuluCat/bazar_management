import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pb } from '../lib/pb'
import { monthRange } from '../lib/dates'
import { sortEvents } from '../lib/agenda'
import type { EventFormValues } from '../lib/eventSchema'
import type { EventRecord, EventStatus, EventWithPayments, PaymentRecord } from './types'

export async function fetchMonthEvents(ym: string): Promise<EventWithPayments[]> {
  const { start, end } = monthRange(ym)
  const [events, payments] = await Promise.all([
    pb.collection('events').getFullList<EventRecord>({
      filter: pb.filter('date >= {:start} && date <= {:end}', { start, end }),
      expand: 'contact',
      sort: 'date,start_time',
    }),
    pb.collection('payments').getFullList<PaymentRecord>({
      filter: pb.filter('event.date >= {:start} && event.date <= {:end}', { start, end }),
      sort: 'paid_at',
    }),
  ])
  const byEvent = new Map<string, PaymentRecord[]>()
  for (const p of payments) byEvent.set(p.event, [...(byEvent.get(p.event) ?? []), p])
  return sortEvents(events.map((e) => ({ ...e, payments: byEvent.get(e.id) ?? [] })))
}

export function useMonthEvents(ym: string) {
  return useQuery({ queryKey: ['events', ym], queryFn: () => fetchMonthEvents(ym) })
}

export async function fetchEvent(id: string): Promise<EventWithPayments> {
  const [event, payments] = await Promise.all([
    pb.collection('events').getOne<EventRecord>(id, { expand: 'contact' }),
    pb.collection('payments').getFullList<PaymentRecord>({ filter: pb.filter('event = {:id}', { id }), sort: 'paid_at,created' }),
  ])
  return { ...event, payments }
}

export function useEvent(id: string | undefined) {
  return useQuery({ queryKey: ['event', id], queryFn: () => fetchEvent(id!), enabled: !!id })
}

/** Distinct locations used before, newest first, for autocomplete. */
export function usePastLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const r = await pb.collection('events').getList<Pick<EventRecord, 'location'>>(1, 200, { sort: '-created', fields: 'location' })
      return [...new Set(r.items.map((e) => e.location).filter(Boolean))]
    },
  })
}

export type EventInput = EventFormValues & { contact?: string; series_id?: string }

function useInvalidate() {
  const qc = useQueryClient()
  return () => Promise.all([qc.invalidateQueries({ queryKey: ['events'] }), qc.invalidateQueries({ queryKey: ['event'] }), qc.invalidateQueries({ queryKey: ['locations'] })])
}

export function useCreateEvent(workspaceId: string | undefined) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: EventInput) => {
      if (!workspaceId) throw new Error('Workspace belum siap')
      return pb.collection('events').create<EventRecord>({ ...input, workspace: workspaceId })
    },
    onSuccess: invalidate,
  })
}

export function useUpdateEvent() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EventInput> }) => pb.collection('events').update<EventRecord>(id, patch),
    onSuccess: invalidate,
  })
}

export function useSetEventStatus() {
  const update = useUpdateEvent()
  return { ...update, mutateAsync: (id: string, status: EventStatus) => update.mutateAsync({ id, patch: { status } }) }
}

export function useDeleteEvent() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => pb.collection('events').delete(id),
    onSuccess: invalidate,
  })
}

/** Soft undo for a deleted event: re-creates it and its payments (proof files are not restored). */
export async function restoreEvent(e: EventWithPayments): Promise<EventRecord> {
  const { id: _id, expand: _expand, payments, ...fields } = e
  void _id
  void _expand
  const created = await pb.collection('events').create<EventRecord>({ ...fields, contact: fields.contact || null })
  for (const p of payments) {
    await pb.collection('payments').create({ event: created.id, amount: p.amount, paid_at: p.paid_at, note: p.note })
  }
  return created
}
