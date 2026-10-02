import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EventRow } from './EventRow'
import type { EventWithPayments } from '../api/types'

const base: EventWithPayments = {
  id: 'e1', workspace: 'w', title: 'CFD South City', date: '2026-10-24', start_time: '06:00', end_time: '10:00',
  location: 'South City', contact: '', total_cost: 150000, status: 'active', notes: '', series_id: '', payments: [],
}
const renderRow = (e: Partial<EventWithPayments>) =>
  render(
    <MemoryRouter>
      <EventRow event={{ ...base, ...e }} />
    </MemoryRouter>,
  )
const pay = (amount: number) => [{ id: 'p', event: 'e1', amount, paid_at: '2026-10-01', note: '', proof: '' }]

test.each([
  [{}, 'Belum bayar'],
  [{ payments: pay(50000) }, 'DP'],
  [{ payments: pay(150000) }, 'Lunas'],
  [{ total_cost: 0 }, 'Gratis'],
])('badge text for %j is %s, with a shape icon', (over, text) => {
  const { container } = renderRow(over)
  expect(screen.getByText(text)).toBeInTheDocument()
  expect(container.querySelector('svg')).not.toBeNull()
})

test('remaining amount only when > 0', () => {
  const { unmount } = renderRow({ payments: pay(50000) })
  expect(screen.getByText('Rp 100.000')).toBeInTheDocument()
  unmount()
  renderRow({ payments: pay(150000) })
  expect(screen.queryByText(/Rp 0/)).toBeNull()
})

test('cancelled: strikethrough title and Batal tag', () => {
  renderRow({ status: 'cancelled' })
  expect(screen.getByText('CFD South City')).toHaveClass('line-through')
  expect(screen.getByText('Batal')).toBeInTheDocument()
})

test('event without times renders without crashing', () => {
  renderRow({ start_time: '', end_time: '' })
  expect(screen.getByText('South City', { exact: true })).toBeInTheDocument()
})

test('links to event detail', () => {
  renderRow({})
  expect(screen.getByRole('link')).toHaveAttribute('href', '/event/e1')
})
