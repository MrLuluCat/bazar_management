import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Dates are 'YYYY-MM-DD' text everywhere; build local Dates from parts so no timezone shift happens.
const toDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const weekdayShort = (date: string) => format(toDate(date), 'EEE', { locale: id })
export const formatDateLabel = (date: string) => format(toDate(date), 'EEE, d MMM', { locale: id })

export function groupByDate<T extends { date: string }>(events: T[]): { date: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e])
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({ date, items }))
}

export function monthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { start: `${ym}-01`, end: `${ym}-${String(last).padStart(2, '0')}` }
}

export function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
}
