// Dev/E2E seed: 2 months of events, overlapping days, one weekly series, mixed payments.
// CLI: ADMIN_EMAIL=… ADMIN_PASSWORD=… GROUP_EMAIL=… [PB_URL=…] node scripts/seed.js
import { adminLogin } from './bootstrap.js'

async function post(url, token, collection, body) {
  const res = await fetch(`${url}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`seed ${collection}: ${res.status} ${JSON.stringify(data)}`)
  return data
}

export async function seed({ url, adminToken, workspaceId }) {
  const ws = workspaceId
  const c = {}
  for (const [key, name, phone, org] of [
    ['rina', 'Bu Rina', '628123456789', 'SD Harapan'],
    ['budi', 'Pak Budi', '628571112233', 'Event Organizer Budi'],
    ['sari', 'Sari', '628990001122', 'CFD South City'],
    ['dewi', 'Dewi', '628221234567', ''],
  ]) {
    c[key] = (await post(url, adminToken, 'contacts', { workspace: ws, name, phone, organization: org })).id
  }

  const mk = (title, date, extra = {}) =>
    post(url, adminToken, 'events', {
      workspace: ws, title, date, location: 'Lokasi', total_cost: 0, status: 'active', ...extra,
    })

  const events = []
  // Three events on the same day.
  events.push(await mk('CFD South City', '2026-10-24', { location: 'South City', start_time: '06:00', end_time: '10:00', contact: c.sari, total_cost: 150000 }))
  events.push(await mk('Bazar Sekolah', '2026-10-24', { location: 'SD Harapan', start_time: '08:00', end_time: '14:00', contact: c.rina, total_cost: 200000 }))
  events.push(await mk('Open House', '2026-10-24', { location: 'Kampus A', total_cost: 0 }))
  events.push(await mk('Pasar Minggu', '2026-10-11', { location: 'Alun-alun', start_time: '07:00', contact: c.budi, total_cost: 100000 }))
  events.push(await mk('Dibatalkan', '2026-10-18', { status: 'cancelled', total_cost: 75000, contact: c.dewi }))
  events.push(await mk('Bazar Desember', '2026-11-14', { total_cost: 300000, contact: c.budi }))

  // Weekly series of 6 Saturdays from 2026-10-03.
  const seriesId = '11111111-2222-4333-8444-555555555555'
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(2026, 9, 3 + i * 7)).toISOString().slice(0, 10)
    events.push(await mk('CFD Mingguan', d, { series_id: seriesId, location: 'Taman Kota', start_time: '05:30', end_time: '09:00', contact: c.sari, total_cost: 50000 }))
  }

  // Payments: DP on first, full on second, none on rest.
  await post(url, adminToken, 'payments', { event: events[0].id, amount: 50000, paid_at: '2026-10-01' })
  await post(url, adminToken, 'payments', { event: events[1].id, amount: 100000, paid_at: '2026-10-01' })
  await post(url, adminToken, 'payments', { event: events[1].id, amount: 100000, paid_at: '2026-10-10', note: 'Pelunasan' })
  return { contacts: c, events, seriesId }
}

if (process.argv[1]?.endsWith('seed.js')) {
  const env = process.env
  const url = env.PB_URL ?? 'http://127.0.0.1:8090'
  const adminToken = await adminLogin(url, env.ADMIN_EMAIL, env.ADMIN_PASSWORD)
  const q = new URLSearchParams({ perPage: '1' })
  const ws = await (await fetch(`${url}/api/collections/workspaces/records?${q}`, { headers: { Authorization: adminToken } })).json()
  const out = await seed({ url, adminToken, workspaceId: ws.items[0].id })
  console.log('seeded', out.events.length, 'events')
}
