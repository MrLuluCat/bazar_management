import { useQuery } from '@tanstack/react-query'
import { pb } from '../lib/pb'
import { monthRange } from '../lib/dates'
import { sortEvents } from '../lib/agenda'
import type { EventRecord, EventWithPayments, PaymentRecord } from './types'

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
