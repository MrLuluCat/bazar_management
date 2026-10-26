import { afterEach, vi } from 'vitest'
import { formatDateLabel, groupByDate, monthRange, todayJakarta, weekdayShort } from './dates'

afterEach(() => vi.useRealTimers())

test('weekdayShort in id locale', () => {
  expect(weekdayShort('2026-10-12')).toBe('Sen')
  expect(weekdayShort('2026-10-17')).toBe('Sab')
  expect(weekdayShort('2026-10-18')).toBe('Min')
})

test('formatDateLabel', () => expect(formatDateLabel('2026-10-17')).toBe('Sab, 17 Okt'))

test('monthRange', () => {
  expect(monthRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  expect(monthRange('2028-02').end).toBe('2028-02-29')
  expect(monthRange('2026-12')).toEqual({ start: '2026-12-01', end: '2026-12-31' })
})

test('groupByDate sorts dates ascending, keeps item order inside a day', () => {
  const g = groupByDate([
    { date: '2026-10-24', id: 'b' },
    { date: '2026-10-03', id: 'a' },
    { date: '2026-10-24', id: 'c' },
  ])
  expect(g.map((x) => x.date)).toEqual(['2026-10-03', '2026-10-24'])
  expect(g[1].items.map((i) => i.id)).toEqual(['b', 'c'])
})

test('todayJakarta rolls over at 00:00 WIB, not UTC', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-01T17:30:00Z')) // 00:30 WIB on 2 Oct
  expect(todayJakarta()).toBe('2026-10-02')
  vi.setSystemTime(new Date('2026-10-01T16:30:00Z')) // 23:30 WIB on 1 Oct
  expect(todayJakarta()).toBe('2026-10-01')
})
