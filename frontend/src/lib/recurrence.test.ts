import { generateOccurrences } from './recurrence'

test('weekly', () => {
  expect(generateOccurrences('2026-10-03', 'weekly', '2026-11-07')).toEqual([
    '2026-10-03', '2026-10-10', '2026-10-17', '2026-10-24', '2026-10-31', '2026-11-07',
  ])
})

test('biweekly, until inclusive', () => {
  expect(generateOccurrences('2026-10-03', 'biweekly', '2026-10-17')).toEqual(['2026-10-03', '2026-10-17'])
})

test('monthly keeps same date', () => {
  expect(generateOccurrences('2026-10-12', 'monthly', '2027-01-12')).toEqual(['2026-10-12', '2026-11-12', '2026-12-12', '2027-01-12'])
})

test('monthly on the 31st skips months without 31 (no rollover)', () => {
  expect(generateOccurrences('2026-01-31', 'monthly', '2026-06-30')).toEqual(['2026-01-31', '2026-03-31', '2026-05-31'])
})

test('monthly on the 29th skips non-leap February', () => {
  expect(generateOccurrences('2027-01-29', 'monthly', '2027-04-30')).toEqual(['2027-01-29', '2027-03-29', '2027-04-29'])
})

test('capped at 52', () => {
  expect(generateOccurrences('2026-01-01', 'weekly', '2030-01-01')).toHaveLength(52)
})

test('until before start gives none', () => {
  expect(generateOccurrences('2026-10-10', 'weekly', '2026-10-01')).toEqual([])
})
