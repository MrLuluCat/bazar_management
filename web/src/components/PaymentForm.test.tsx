import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { PaymentForm } from './PaymentForm'

const setup = (props: Partial<React.ComponentProps<typeof PaymentForm>> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  render(<PaymentForm open onClose={() => {}} today="2026-10-02" onSubmit={onSubmit} {...props} />)
  return onSubmit
}

test('amount must be greater than 0', async () => {
  const onSubmit = setup()
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText('Nominal harus lebih dari 0')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('"Lunasi" prefill: amount starts at the remaining balance', async () => {
  const onSubmit = setup({ initialAmount: 100000 })
  expect(screen.getByLabelText('Nominal')).toHaveValue('100.000')
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
  expect(onSubmit.mock.calls[0][0]).toMatchObject({ amount: 100000, paid_at: '2026-10-02' })
})

test('oversized proof shows "Foto maksimal 5 MB"', async () => {
  const onSubmit = setup({ initialAmount: 1000 })
  const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'bukti.jpg', { type: 'image/jpeg' })
  await userEvent.upload(screen.getByLabelText('Foto bukti'), big)
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText('Foto maksimal 5 MB')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('non-image proof is rejected', async () => {
  setup({ initialAmount: 1000 })
  const pdf = new File(['x'], 'bukti.pdf', { type: 'application/pdf' })
  await userEvent.upload(screen.getByLabelText('Foto bukti'), pdf, { applyAccept: false })
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText('File harus berupa foto')).toBeInTheDocument()
})
