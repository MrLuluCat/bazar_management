import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RupiahInput } from './RupiahInput'

function Harness({ onValue }: { onValue: (n: number) => void }) {
  const [v, setV] = useState(0)
  return (
    <div>
      <label htmlFor="biaya">Biaya</label>
      <RupiahInput
        id="biaya"
        value={v}
        onChange={(n) => {
          setV(n)
          onValue(n)
        }}
      />
    </div>
  )
}

test('formats thousands live, numeric keyboard, emits integer', async () => {
  const seen: number[] = []
  render(<Harness onValue={(n) => seen.push(n)} />)
  const input = screen.getByLabelText('Biaya')
  expect(input).toHaveAttribute('inputmode', 'numeric')
  await userEvent.type(input, '1250000')
  expect(input).toHaveValue('1.250.000')
  expect(seen.at(-1)).toBe(1250000)
})

test('clearing gives 0 and an empty field', async () => {
  const seen: number[] = []
  render(<Harness onValue={(n) => seen.push(n)} />)
  const input = screen.getByLabelText('Biaya')
  await userEvent.type(input, '500')
  await userEvent.clear(input)
  expect(seen.at(-1)).toBe(0)
  expect(input).toHaveValue('')
})

test('ignores non-digit characters', async () => {
  render(<Harness onValue={() => {}} />)
  const input = screen.getByLabelText('Biaya')
  await userEvent.type(input, 'ab12c')
  expect(input).toHaveValue('12')
})
