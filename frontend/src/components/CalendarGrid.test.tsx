import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CalendarGrid } from './CalendarGrid'
import type { EventWithPayments } from '../api/types'

const mk = (id: string, date: string, o: Partial<EventWithPayments> = {}): EventWithPayments => ({
  id, workspace: 'w', title: id, date, start_time: '', end_time: '', location: 'L', contact: '', total_cost: 100,
  status: 'active', notes: '', series_id: '', payments: [], ...o,
})

test('cells show dots, 3+ label, and select on tap', async () => {
  const onSelect = vi.fn()
  render(
    <CalendarGrid
      ym="2026-10"
      selectedDate={null}
      onSelect={onSelect}
      events={[mk('a', '2026-10-24'), mk('b', '2026-10-24'), mk('c', '2026-10-24'), mk('d', '2026-10-11')]}
    />,
  )
  expect(screen.getByRole('gridcell', { name: /24 Oktober/ })).toHaveTextContent('3+')
  expect(screen.getByRole('gridcell', { name: /11 Oktober/ })).toHaveTextContent('•')
  await userEvent.click(screen.getByRole('gridcell', { name: /24 Oktober/ }))
  expect(onSelect).toHaveBeenCalledWith('2026-10-24')
})

test('unpaid day gets the accent marker class; fully paid does not', () => {
  render(
    <CalendarGrid
      ym="2026-10"
      selectedDate={null}
      onSelect={() => {}}
      events={[mk('a', '2026-10-10'), mk('b', '2026-10-12', { payments: [{ id: 'p', event: 'b', amount: 100, paid_at: '2026-10-01', note: '', proof: '' }] })]}
    />,
  )
  expect(screen.getByRole('gridcell', { name: /10 Oktober/ }).querySelector('[data-unpaid="true"]')).not.toBeNull()
  expect(screen.getByRole('gridcell', { name: /12 Oktober/ }).querySelector('[data-unpaid="true"]')).toBeNull()
})
