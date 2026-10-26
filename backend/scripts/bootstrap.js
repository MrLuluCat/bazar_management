// One-time, idempotent: group user + workspace + owner membership. See PRD §4 Bootstrap.
// CLI: ADMIN_EMAIL=… ADMIN_PASSWORD=… GROUP_EMAIL=… GROUP_PASSCODE=… [WORKSPACE_NAME=…] [WORKSPACE_SLUG=…] [PB_URL=…] node scripts/bootstrap.js
// The admin panel (/admin) does the same for new lapak; this script is for local setup and tests.
// Uses REST only (no dependencies).

async function api(url, path, { method = 'GET', token, body } = {}) {
  const res = await fetch(url + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`)
  return data
}

export async function adminLogin(url, email, password) {
  const r = await api(url, '/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    body: { identity: email, password },
  })
  return r.token
}

/** "Bazar Saya" -> "bazar-saya" (same rule as migration 3). */
export function slugify(name) {
  const s = String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  return s.length >= 3 ? s : 'lapak'
}

async function findOne(url, token, collection, filter) {
  const q = new URLSearchParams({ filter, perPage: '1' })
  const r = await api(url, `/api/collections/${collection}/records?${q}`, { token })
  return r.items[0] ?? null
}

/** Creates the user/workspace/membership if missing. Returns their ids. */
export async function bootstrap({ url, adminToken, groupEmail, groupPasscode, workspaceName = 'Bazar Saya', workspaceSlug }) {
  if (!groupPasscode || groupPasscode.length < 6) throw new Error('passcode must be at least 6 characters')

  let user = await findOne(url, adminToken, 'users', `email="${groupEmail}"`)
  if (!user) {
    user = await api(url, '/api/collections/users/records', {
      method: 'POST',
      token: adminToken,
      body: { email: groupEmail, password: groupPasscode, passwordConfirm: groupPasscode, emailVisibility: false, verified: true, name: 'Grup' },
    })
  }

  const existing = await findOne(url, adminToken, 'memberships', `user="${user.id}"`)
  if (existing) {
    const ws = await api(url, `/api/collections/workspaces/records/${existing.workspace}`, { token: adminToken })
    return { userId: user.id, workspaceId: existing.workspace, membershipId: existing.id, slug: ws.slug }
  }

  const workspace = await api(url, '/api/collections/workspaces/records', {
    method: 'POST',
    token: adminToken,
    body: { name: workspaceName, slug: workspaceSlug || slugify(workspaceName) },
  })
  const membership = await api(url, '/api/collections/memberships/records', {
    method: 'POST',
    token: adminToken,
    body: { workspace: workspace.id, user: user.id, role: 'owner' },
  })
  return { userId: user.id, workspaceId: workspace.id, membershipId: membership.id, slug: workspace.slug }
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('bootstrap.js')) {
  const env = process.env
  const url = env.PB_URL ?? 'http://127.0.0.1:8090'
  const adminToken = await adminLogin(url, env.ADMIN_EMAIL, env.ADMIN_PASSWORD)
  const out = await bootstrap({
    url,
    adminToken,
    groupEmail: env.GROUP_EMAIL,
    groupPasscode: env.GROUP_PASSCODE,
    workspaceName: env.WORKSPACE_NAME,
    workspaceSlug: env.WORKSPACE_SLUG,
  })
  console.log('bootstrap ok', out)
}
