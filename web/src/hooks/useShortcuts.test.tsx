import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { useShortcuts } from './useShortcuts'

function Probe({ h }: { h: Record<string, () => void> }) {
  useShortcuts(h)
  return (
    <div>
      <input aria-label="field" />
      <textarea aria-label="area" />
    </div>
  )
}

test('keys call their handlers', async () => {
  const h = { n: vi.fn(), ArrowLeft: vi.fn(), ArrowRight: vi.fn(), t: vi.fn(), '/': vi.fn() }
  render(<Probe h={h} />)
  await userEvent.keyboard('n{ArrowLeft}{ArrowRight}t/')
  expect(h.n).toHaveBeenCalledTimes(1)
  expect(h.ArrowLeft).toHaveBeenCalledTimes(1)
  expect(h.ArrowRight).toHaveBeenCalledTimes(1)
  expect(h.t).toHaveBeenCalledTimes(1)
  expect(h['/']).toHaveBeenCalledTimes(1)
})

test('typing in a field never triggers shortcuts', async () => {
  const h = { n: vi.fn(), t: vi.fn(), '/': vi.fn() }
  const { getByLabelText } = render(<Probe h={h} />)
  await userEvent.type(getByLabelText('field'), 'nt/')
  await userEvent.type(getByLabelText('area'), 'nt/')
  expect(h.n).not.toHaveBeenCalled()
  expect(h.t).not.toHaveBeenCalled()
  expect(h['/']).not.toHaveBeenCalled()
})

test('modifier combos (Ctrl+T, Cmd+N) are left to the browser', async () => {
  const h = { n: vi.fn(), t: vi.fn() }
  render(<Probe h={h} />)
  await userEvent.keyboard('{Control>}t{/Control}{Meta>}n{/Meta}')
  expect(h.n).not.toHaveBeenCalled()
  expect(h.t).not.toHaveBeenCalled()
})

test('does nothing while a dialog is open', async () => {
  const h = { n: vi.fn() }
  render(
    <>
      <Probe h={h} />
      <div role="dialog" aria-modal="true" />
    </>,
  )
  await userEvent.keyboard('n')
  expect(h.n).not.toHaveBeenCalled()
})
