import { filterEvents, sortEvents } from './agenda'
import { formatTimeRange } from './dates'

const ev = (o: Record<string, unknown>) => ({
  id: 'x', date: '2026-10-10', start_time: '', end_time: '', title: 'T', location: 'L', status: 'active',
  total_cost: 100, payments: [], contact: '', expand: undefined, ...o,
}) as any

test('formatTimeRange handles all combinations without crashing', () => {
  expect(formatTimeRange('06:00', '10:00')).toBe('06:00–10:00')
  expect(formatTimeRange('06:00', '')).toBe('06:00')
  expect(formatTimeRange('', '10:00')).toBe('s/d 10:00')
  expect(formatTimeRange('', '')).toBe('')
})

test('sortEvents: by date, then start_time, events without time last', () => {
  const out = sortEvents([
    ev({ id: 'c', date: '2026-10-11' }),
    ev({ id: 'b', start_time: '' }),
    ev({ id: 'a', start_time: '06:00' }),
    ev({ id: 'd', start_time: '', end_time: '09:00' }),
  ])
  expect(out.map((e) => e.id)).toEqual(['a', 'b', 'd', 'c'])
})

test('filter chip "akan" keeps active events from today on', () => {
  const list = [ev({ id: 'past', date: '2026-10-01' }), ev({ id: 'today', date: '2026-10-05' }), ev({ id: 'x', date: '2026-10-09', status: 'cancelled' })]
  expect(filterEvents(list, { chip: 'akan', q: '', today: '2026-10-05' }).map((e) => e.id)).toEqual(['today'])
})

test('filter chip "belum" keeps active events with remaining > 0', () => {
  const list = [
    ev({ id: 'unpaid' }),
    ev({ id: 'dp', payments: [{ amount: 40 }] }),
    ev({ id: 'lunas', payments: [{ amount: 100 }] }),
    ev({ id: 'gratis', total_cost: 0 }),
    ev({ id: 'batal', status: 'cancelled' }),
  ]
  expect(filterEvents(list, { chip: 'belum', q: '', today: '2026-10-05' }).map((e) => e.id)).toEqual(['unpaid', 'dp'])
})

test('search matches title, location and contact name, case-insensitive', () => {
  const list = [
    ev({ id: 't', title: 'CFD South City' }),
    ev({ id: 'l', location: 'SD Harapan' }),
    ev({ id: 'c', expand: { contact: { name: 'Bu Rina' } } }),
    ev({ id: 'none' }),
  ]
  const f = (q: string) => filterEvents(list, { chip: 'semua', q, today: '2026-10-05' }).map((e) => e.id)
  expect(f('south')).toEqual(['t'])
  expect(f('harapan')).toEqual(['l'])
  expect(f('RINA')).toEqual(['c'])
})
