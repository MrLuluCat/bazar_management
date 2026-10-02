import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RepeatFields, selectedDates, type RepeatValue } from './RepeatFields'

function Harness({ start, onValue }: { start: string; onValue: (v: RepeatValue) => void }) {
  const [v, setV] = useState<RepeatValue>({ enabled: false, freq: 'weekly', until: '', excluded: [] })
  return (
    <RepeatFields
      startDate={start}
      value={v}
      onChange={(n) => {
        setV(n)
        onValue(n)
      }}
    />
  )
}

test('toggle reveals frequency, until and a preview list of dates', async () => {
  render(<Harness start="2026-10-03" onValue={() => {}} />)
  expect(screen.queryByLabelText('Sampai tanggal')).toBeNull()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Ulangi' }))
  await userEvent.type(screen.getByLabelText('Sampai tanggal'), '2026-10-24')
  expect(screen.getAllByRole('checkbox', { name: /Okt/ })).toHaveLength(4)
})

test('unticking a preview date removes it from the save payload', async () => {
  let last!: RepeatValue
  render(<Harness start="2026-10-03" onValue={(v) => (last = v)} />)
  await userEvent.click(screen.getByRole('checkbox', { name: 'Ulangi' }))
  await userEvent.type(screen.getByLabelText('Sampai tanggal'), '2026-10-24')
  expect(selectedDates('2026-10-03', last)).toEqual(['2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24'])
  await userEvent.click(screen.getByRole('checkbox', { name: /Sab, 10 Okt/ }))
  expect(selectedDates('2026-10-03', last)).toEqual(['2026-10-03', '2026-10-17', '2026-10-24'])
})

test('caps at 52 occurrences and says so', async () => {
  render(<Harness start="2026-01-03" onValue={() => {}} />)
  await userEvent.click(screen.getByRole('checkbox', { name: 'Ulangi' }))
  await userEvent.type(screen.getByLabelText('Sampai tanggal'), '2030-01-01')
  expect(screen.getByText(/Maksimal 52 kali/)).toBeInTheDocument()
  expect(screen.getAllByRole('checkbox')).toHaveLength(1 + 52)
})
