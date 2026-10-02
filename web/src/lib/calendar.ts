import { remaining } from './payment'

const pad = (n: number) => String(n).padStart(2, '0')

/** Monday-first month grid: leading `null` blanks, then every 'YYYY-MM-DD', then trailing blanks to a full week. */
export function buildMonthGrid(ym: string): (string | null)[] {
  const [y, m] = ym.split('-').map(Number)
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const days = new Date(y, m, 0).getDate()
  const cells: (string | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${pad(d)}`)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

type Markable = { status: string; total_cost: number; payments: { amount: number }[] }

/** Dots for a day: '•', '••' or '3+'. `unpaid` = any active event with a balance left. Cancelled events do not count. */
export function dayMarker(events: Markable[]): { count: number; label: string; unpaid: boolean } {
  const active = events.filter((e) => e.status !== 'cancelled')
  const count = active.length
  return {
    count,
    label: count === 0 ? '' : count === 1 ? '•' : count === 2 ? '••' : '3+',
    unpaid: active.some((e) => remaining(e.total_cost, e.payments) > 0),
  }
}
