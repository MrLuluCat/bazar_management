import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EventForm } from './EventForm'

const setup = (onSubmit = vi.fn().mockResolvedValue(undefined)) => {
  render(<EventForm open onClose={() => {}} defaultDate="2026-10-12" locations={['South City']} onSubmit={onSubmit} />)
  return onSubmit
}

test('shows plain-Indonesian errors for missing judul and lokasi', async () => {
  const onSubmit = setup()
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText('Judul wajib diisi')).toBeInTheDocument()
  expect(screen.getByText('Lokasi wajib diisi')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('end before start shows error under Selesai', async () => {
  setup()
  await userEvent.type(screen.getByLabelText('Judul'), 'CFD')
  await userEvent.type(screen.getByLabelText('Lokasi'), 'South City')
  await userEvent.type(screen.getByLabelText('Mulai'), '10:00')
  await userEvent.type(screen.getByLabelText('Selesai'), '09:00')
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText('Jam selesai harus setelah jam mulai')).toBeInTheDocument()
})

test('defaults tanggal from defaultDate and submits parsed values', async () => {
  const onSubmit = setup()
  expect(screen.getByLabelText('Tanggal')).toHaveValue('2026-10-12')
  await userEvent.type(screen.getByLabelText('Judul'), 'CFD')
  await userEvent.type(screen.getByLabelText('Lokasi'), 'South City')
  await userEvent.type(screen.getByLabelText('Biaya booth'), '150000')
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'CFD', date: '2026-10-12', location: 'South City', total_cost: 150000, status: 'active' })
})

test('double tap on Simpan submits once (Review Focus 5)', async () => {
  let release!: () => void
  const onSubmit = vi.fn(() => new Promise<void>((r) => (release = r)))
  setup(onSubmit)
  await userEvent.type(screen.getByLabelText('Judul'), 'CFD')
  await userEvent.type(screen.getByLabelText('Lokasi'), 'South City')
  const save = screen.getByRole('button', { name: 'Simpan' })
  await userEvent.dblClick(save)
  expect(onSubmit).toHaveBeenCalledTimes(1)
  expect(save).toBeDisabled()
  release()
})
