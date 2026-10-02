import { buildMonthGrid, dayMarker } from './calendar'

test('Monday-first grid: Oct 2026 starts on Thursday -> 3 leading blanks', () => {
  const g = buildMonthGrid('2026-10')
  expect(g.slice(0, 3)).toEqual([null, null, null])
  expect(g[3]).toBe('2026-10-01')
  expect(g.filter(Boolean)).toHaveLength(31)
  expect(g.length % 7).toBe(0)
})

test('month starting on Monday has no leading blanks', () => {
  expect(buildMonthGrid('2026-06')[0]).toBe('2026-06-01')
})

test('dayMarker: count label and unpaid flag, cancelled ignored', () => {
  const ev = (o: object) => ({ status: 'active', total_cost: 100, payments: [], ...o })
  expect(dayMarker([])).toEqual({ count: 0, label: '', unpaid: false })
  expect(dayMarker([ev({})])).toEqual({ count: 1, label: '•', unpaid: true })
  expect(dayMarker([ev({ payments: [{ amount: 100 }] }), ev({ total_cost: 0 })])).toEqual({ count: 2, label: '••', unpaid: false })
  expect(dayMarker([ev({}), ev({}), ev({})]).label).toBe('3+')
  expect(dayMarker([ev({ status: 'cancelled' })]).count).toBe(0)
})
