import { expect, test } from 'vitest'
import { plain } from './store'

test('plain() turns markdown replies into phone-friendly text', () => {
  const md = '## Oktober\n\n| Tanggal | Event | Sisa |\n|---|---|---|\n| Sab, 3 Okt | CFD | Rp 50.000 |\n\n\n\nTotal **Rp 450.000**.'
  expect(plain(md)).toBe('Oktober\n\n• Tanggal · Event · Sisa\n\n• Sab, 3 Okt · CFD · Rp 50.000\n\nTotal Rp 450.000.')
  expect(plain('Halo, siap.')).toBe('Halo, siap.')
})
