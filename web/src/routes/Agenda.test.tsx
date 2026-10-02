import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import type { EventWithPayments } from '../api/types'

const state: { data?: EventWithPayments[]; isLoading: boolean; isError: boolean; refetch: () => void } = {
  data: [], isLoading: false, isError: false, refetch: vi.fn(),
}
vi.mock('../api/events', () => ({ useMonthEvents: () => state }))

import Agenda from './Agenda'

const mk = (o: Partial<EventWithPayments>): EventWithPayments => ({
  id: 'e', workspace: 'w', title: 'T', date: '2026-10-24', start_time: '', end_time: '', location: 'L', contact: '',
  total_cost: 100000, status: 'active', notes: '', series_id: '', payments: [], ...o,
})
const paid = (amount: number) => [{ id: 'p', event: 'x', amount, paid_at: '2026-10-01', note: '', proof: '' }]
const show = () =>
  render(
    <MemoryRouter initialEntries={['/?m=2026-10']}>
      <Agenda />
    </MemoryRouter>,
  )

beforeEach(() => {
  state.isLoading = false
  state.isError = false
  state.data = [
    mk({ id: 'a', title: 'CFD South City', date: '2026-10-24' }),
    mk({ id: 'b', title: 'Bazar Sekolah', date: '2026-10-24', payments: paid(100000) }),
    mk({ id: 'c', title: 'Pasar Minggu', date: '2026-10-11', location: 'Alun-alun', payments: paid(40000) }),
  ]
})

test('lists only dates that have events, grouped by date header', () => {
  show()
  const headers = screen.getAllByRole('heading', { level: 2 })
  expect(headers).toHaveLength(2)
  expect(screen.getByText('CFD South City')).toBeInTheDocument()
  expect(screen.getByText('Bazar Sekolah')).toBeInTheDocument()
})

test('summary counts active events with totals', () => {
  show()
  const strip = screen.getByRole('group', { name: 'Ringkasan bulan' })
  expect(within(strip).getByText('3')).toBeInTheDocument()
  expect(within(strip).getByText('Rp 300.000')).toBeInTheDocument()
  expect(within(strip).getByText('Rp 160.000')).toBeInTheDocument()
})

test('"Belum lunas" chip hides paid events', async () => {
  show()
  await userEvent.click(screen.getByRole('button', { name: 'Belum lunas' }))
  expect(screen.queryByText('Bazar Sekolah')).toBeNull()
  expect(screen.getByText('CFD South City')).toBeInTheDocument()
})

test('search filters by location', async () => {
  show()
  await userEvent.type(screen.getByRole('searchbox'), 'alun')
  expect(screen.getByText('Pasar Minggu')).toBeInTheDocument()
  expect(screen.queryByText('CFD South City')).toBeNull()
})

test('empty month shows message and add button', () => {
  state.data = []
  show()
  expect(screen.getByText(/Belum ada event/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tambah event' })).toBeInTheDocument()
})

test('loading shows skeleton rows, not a spinner', () => {
  state.isLoading = true
  state.data = undefined
  show()
  expect(screen.getByRole('status', { name: 'Memuat' })).toBeInTheDocument()
})

test('error shows message and retry', async () => {
  state.isError = true
  state.data = undefined
  show()
  await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
  expect(state.refetch).toHaveBeenCalled()
})
