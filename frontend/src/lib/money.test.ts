import { formatRupiah, parseRupiah } from './money'

test('formatRupiah uses dot thousands', () => {
  expect(formatRupiah(1250000)).toBe('Rp 1.250.000')
  expect(formatRupiah(0)).toBe('Rp 0')
  expect(formatRupiah(999)).toBe('Rp 999')
})

test('parseRupiah reads dotted input back to int', () => {
  expect(parseRupiah('1.250.000')).toBe(1250000)
  expect(parseRupiah('Rp 150.000')).toBe(150000)
  expect(parseRupiah('')).toBe(0)
  expect(parseRupiah('abc')).toBe(0)
})
