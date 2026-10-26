import { act, render, screen } from '@testing-library/react'
import { OfflineBanner } from './OfflineBanner'
import { Button } from './ui/Button'

const setOnline = (v: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', { value: v, configurable: true })
  act(() => {
    window.dispatchEvent(new Event(v ? 'online' : 'offline'))
  })
}

afterEach(() => setOnline(true))

test('banner appears offline and disappears online', () => {
  render(<OfflineBanner />)
  expect(screen.queryByText('Offline — data terakhir')).toBeNull()
  setOnline(false)
  expect(screen.getByText('Offline — data terakhir')).toBeInTheDocument()
  setOnline(true)
  expect(screen.queryByText('Offline — data terakhir')).toBeNull()
})

test('write buttons are disabled offline with a tooltip', () => {
  render(<Button write>Simpan</Button>)
  const btn = screen.getByRole('button', { name: 'Simpan' })
  expect(btn).toBeEnabled()
  setOnline(false)
  expect(btn).toBeDisabled()
  expect(btn).toHaveAttribute('title', 'Butuh koneksi internet')
})

test('non-write buttons stay enabled offline', () => {
  render(<Button>Kunci</Button>)
  setOnline(false)
  expect(screen.getByRole('button', { name: 'Kunci' })).toBeEnabled()
})
