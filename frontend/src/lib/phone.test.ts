import { formatPhone, normalizePhone, telLink, waLink } from './phone'

test.each([
  '0812-3456-7890',
  '+62 812 3456 7890',
  '6281234567890',
  '(0812) 3456 7890',
  '006281234567890',
  '0812.3456.7890',
])('normalizePhone(%s) -> 6281234567890', (raw) => {
  expect(normalizePhone(raw)).toBe('6281234567890')
})

test('normalizePhone rejects short or garbage input', () => {
  expect(normalizePhone('0812')).toBeNull()
  expect(normalizePhone('08ab12345678')).toBeNull()
  expect(normalizePhone('')).toBeNull()
  expect(normalizePhone('0812345')).toBeNull()
})

test('formatPhone shows local 0-format with dashes', () => {
  expect(formatPhone('6281234567890')).toBe('0812-3456-7890')
  expect(formatPhone('628123456789')).toBe('0812-3456-789')
})

test('links', () => {
  expect(waLink('6281234567890')).toBe('https://wa.me/6281234567890')
  expect(telLink('6281234567890')).toBe('tel:+6281234567890')
})
