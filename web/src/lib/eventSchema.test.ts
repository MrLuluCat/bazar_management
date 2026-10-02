import { eventSchema } from './eventSchema'

const valid = {
  title: 'CFD', date: '2026-10-12', start_time: '', end_time: '', location: 'South City', total_cost: 0, notes: '', status: 'active' as const,
}
const errors = (v: object) => {
  const r = eventSchema.safeParse(v)
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))
}

test('valid event passes', () => expect(eventSchema.safeParse(valid).success).toBe(true))

test('missing judul, lokasi, tanggal give plain Indonesian messages', () => {
  expect(errors({ ...valid, title: ' ' }).title).toBe('Judul wajib diisi')
  expect(errors({ ...valid, location: '' }).location).toBe('Lokasi wajib diisi')
  expect(errors({ ...valid, date: '' }).date).toBe('Tanggal wajib diisi')
})

test('end before start is rejected on end_time; either alone is fine', () => {
  expect(errors({ ...valid, start_time: '10:00', end_time: '09:00' }).end_time).toBe('Jam selesai harus setelah jam mulai')
  expect(eventSchema.safeParse({ ...valid, start_time: '10:00', end_time: '10:00' }).success).toBe(true)
  expect(eventSchema.safeParse({ ...valid, start_time: '10:00' }).success).toBe(true)
  expect(eventSchema.safeParse({ ...valid, end_time: '09:00' }).success).toBe(true)
})

test('total_cost must be a non-negative integer', () => {
  expect(errors({ ...valid, total_cost: -1 }).total_cost).toBe('Biaya tidak boleh negatif')
  expect(errors({ ...valid, total_cost: 1.5 }).total_cost).toBeDefined()
})
