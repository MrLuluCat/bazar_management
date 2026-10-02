import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ContactForm } from './ContactForm'

const setup = () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<ContactForm open onClose={() => {}} onSubmit={onSubmit} />)
  return onSubmit
}

test('invalid phone shows "Nomor tidak valid" and nothing is saved (Review Focus 3)', async () => {
  const onSubmit = setup()
  await userEvent.type(screen.getByLabelText('Nama'), 'Bu Rina')
  await userEvent.type(screen.getByLabelText('Nomor WhatsApp'), '08ab1234')
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText('Nomor tidak valid')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('missing nama shows error', async () => {
  const onSubmit = setup()
  await userEvent.type(screen.getByLabelText('Nomor WhatsApp'), '081234567890')
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText('Nama wajib diisi')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('phone is normalized to 62… on submit', async () => {
  const onSubmit = setup()
  await userEvent.type(screen.getByLabelText('Nama'), 'Bu Rina')
  await userEvent.type(screen.getByLabelText('Nomor WhatsApp'), '0812-3456-7890')
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Bu Rina', phone: '6281234567890' })
})
