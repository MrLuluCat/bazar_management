import { remaining } from './payment'

export type Chip = 'semua' | 'akan' | 'belum'

type Filterable = {
  date: string
  start_time: string
  title: string
  location: string
  status: string
  total_cost: number
  payments: { amount: number }[]
  expand?: { contact?: { name: string } }
}

/** By date, then start_time ascending; events without a start time go last within their day. */
export function sortEvents<T extends Pick<Filterable, 'date' | 'start_time'>>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    if (a.start_time === b.start_time) return 0
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return a.start_time.localeCompare(b.start_time)
  })
}

export function filterEvents<T extends Filterable>(events: T[], { chip, q, today }: { chip: Chip; q: string; today: string }): T[] {
  const needle = q.trim().toLowerCase()
  return events.filter((e) => {
    if (chip === 'akan' && !(e.status === 'active' && e.date >= today)) return false
    if (chip === 'belum' && !(e.status === 'active' && remaining(e.total_cost, e.payments) > 0)) return false
    if (!needle) return true
    return [e.title, e.location, e.expand?.contact?.name ?? ''].some((s) => s.toLowerCase().includes(needle))
  })
}
