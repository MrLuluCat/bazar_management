import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pb } from '../lib/pb'
import type { EventRecord } from './types'
import type { EventInput } from './events'
import type { SeriesScope } from '../components/SeriesScopeDialog'

/** Create one event per date, sequentially. Throws with `created` count attached if one fails midway. */
export async function createMany(workspace: string, base: EventInput, dates: string[], seriesId?: string): Promise<EventRecord[]> {
  const out: EventRecord[] = []
  for (const date of dates) {
    try {
      out.push(await pb.collection('events').create<EventRecord>({ ...base, date, workspace, ...(seriesId ? { series_id: seriesId } : {}) }))
    } catch (err) {
      throw Object.assign(new Error('partial'), { created: out.length, cause: err })
    }
  }
  return out
}

export const newSeriesId = () => crypto.randomUUID()

function useInvalidateAll() {
  const qc = useQueryClient()
  return () => Promise.all(['events', 'event', 'locations', 'contact-events'].map((k) => qc.invalidateQueries({ queryKey: [k] })))
}

/** Fields "Ini & seterusnya" may change: everything except date (and payments, which are separate records). */
export function seriesPatch(patch: Partial<EventInput>): Partial<EventInput> {
  const { date: _date, ...rest } = patch
  void _date
  return rest
}

export function useDuplicateEvent() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ source, dates }: { source: EventRecord; dates: string[] }) => {
      const base: EventInput = {
        title: source.title, date: '', start_time: source.start_time, end_time: source.end_time, location: source.location,
        total_cost: source.total_cost, notes: source.notes, status: 'active', contact: source.contact || undefined,
      }
      return createMany(source.workspace, base, dates)
    },
    onSettled: invalidate,
  })
}

export function useCreateSeries() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ workspace, base, dates }: { workspace: string; base: EventInput; dates: string[] }) =>
      createMany(workspace, base, dates, newSeriesId()),
    onSettled: invalidate,
  })
}

async function followingIds(event: EventRecord): Promise<string[]> {
  const list = await pb.collection('events').getFullList<Pick<EventRecord, 'id'>>({
    filter: pb.filter('series_id = {:s} && date >= {:d}', { s: event.series_id, d: event.date }),
    fields: 'id',
    sort: 'date',
  })
  return list.map((e) => e.id)
}

export function useUpdateSeries() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async ({ event, patch, scope }: { event: EventRecord; patch: Partial<EventInput>; scope: SeriesScope }) => {
      if (scope === 'this' || !event.series_id) return void (await pb.collection('events').update(event.id, patch))
      for (const id of await followingIds(event)) await pb.collection('events').update(id, id === event.id ? patch : seriesPatch(patch))
    },
    onSettled: invalidate,
  })
}

export function useDeleteSeries() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async ({ event, scope }: { event: EventRecord; scope: SeriesScope }) => {
      if (scope === 'this' || !event.series_id) return void (await pb.collection('events').delete(event.id))
      for (const id of await followingIds(event)) await pb.collection('events').delete(id)
    },
    onSettled: invalidate,
  })
}
