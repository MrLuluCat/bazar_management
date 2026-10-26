import { E2E } from './constants'
// @ts-expect-error plain JS module without types
import { seed } from '../../backend/scripts/seed.js'
import { ADMIN, adminToken, startServer, type Server } from '../../backend/tests/helpers'
// @ts-expect-error plain JS module without types
import { bootstrap } from '../../backend/scripts/bootstrap.js'

let srv: Server | undefined

/** Fresh PocketBase on :8090 with the group user, a workspace and seed data. Rate limit off (E2E logs in a lot). */
export default async function globalSetup() {
  srv = await startServer(8090)
  const token = await adminToken(srv.url)
  await fetch(srv.url + '/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ rateLimits: { enabled: false } }),
  })
  const b = await bootstrap({ url: srv.url, adminToken: token, groupEmail: E2E.email, groupPasscode: E2E.passcode, workspaceName: 'Bazar Saya' })
  await seed({ url: srv.url, adminToken: token, workspaceId: b.workspaceId })
  void ADMIN
  return async () => {
    await srv?.stop()
  }
}
