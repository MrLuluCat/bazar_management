import { E2E, PANEL } from './constants'
// @ts-expect-error plain JS module without types
import { seed } from '../../backend/scripts/seed.js'
import { ADMIN, adminToken, startServer, type Server } from '../../backend/tests/helpers'
import { fakeInferhub } from '../../backend/tests/fakeInferhub'
// @ts-expect-error plain JS module without types
import { bootstrap } from '../../backend/scripts/bootstrap.js'

let srv: Server | undefined
let closeFake: (() => Promise<void>) | undefined

/** Fresh PocketBase on :8090 with the group user, a workspace and seed data. Rate limit off (E2E logs in a lot). */
export default async function globalSetup() {
  // Fake InferHub: a message mentioning "poster" gets an event proposal; anything else a plain reply.
  const fake = await fakeInferhub(8097, (body) => {
    const msgs = body.messages as { role: string; content: unknown }[]
    if (msgs.at(-1)?.role === 'tool') return { content: 'Saya siapkan usulan event dari poster itu.' }
    const last = JSON.stringify(msgs.at(-1)?.content ?? '')
    if (last.includes('poster')) {
      return { tool_calls: [{ name: 'propose_event', args: { title: 'Bazar Ramadhan', date: '2026-11-21', start_time: '15:00', end_time: '21:00', location: 'Lapangan Merdeka', total_cost: 250000, reason: 'Dari poster' } }] }
    }
    return { content: 'Sabtu ini ada CFD Mingguan.' }
  })
  closeFake = fake.close
  srv = await startServer(8090, { INFERHUB_API_KEY: 'e2e-key', INFERHUB_BASE_URL: fake.url })
  const token = await adminToken(srv.url)
  await fetch(srv.url + '/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ rateLimits: { enabled: false } }),
  })
  const b = await bootstrap({ url: srv.url, adminToken: token, groupEmail: E2E.email, groupPasscode: E2E.passcode, workspaceName: 'Bazar Saya' })
  await seed({ url: srv.url, adminToken: token, workspaceId: b.workspaceId })
  // Panel admin (normally created via the one-time setup link).
  await fetch(srv.url + '/api/collections/admins/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ email: PANEL.email, password: PANEL.password, passwordConfirm: PANEL.password, verified: true }),
  })
  void ADMIN
  return async () => {
    await srv?.stop()
    await closeFake?.()
  }
}
