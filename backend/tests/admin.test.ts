import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminToken, makeClient, setupToken, startServer, userLogin, type Client, type Server } from './helpers'

const PANEL = { email: 'owner@test.local', password: 'panel-password-123' }

let srv: Server
let anon: Client
let panel: Client

async function panelLogin(url: string) {
  const res = await fetch(url + '/api/collections/admins/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PANEL.email, password: PANEL.password }),
  })
  const data: any = await res.json()
  if (!res.ok) throw new Error('panel login failed ' + JSON.stringify(data))
  return makeClient(url, data.token, data.record.id)
}

beforeAll(async () => {
  srv = await startServer(8093)
  // The suite logs in and calls admin routes many times: lift those limits for this server only.
  const su = makeClient(srv.url, await adminToken(srv.url))
  const s = await su.req('GET', '/api/settings')
  const rules = s.data.rateLimits.rules.map((r: any) => (r.label === '/api/admin/' || r.label === '*:auth' ? { ...r, maxRequests: 1000 } : r))
  await su.req('PATCH', '/api/settings', { rateLimits: { ...s.data.rateLimits, rules } })
  anon = makeClient(srv.url)
}, 30_000)

afterAll(async () => {
  await srv?.stop()
})

describe('first admin setup', () => {
  it('reports setup needed', async () => {
    expect((await anon.req('GET', '/api/admin/setup')).data).toEqual({ needed: true })
  })

  it('rejects a wrong token and a short password', async () => {
    const bad = await anon.req('POST', '/api/admin/setup', { token: 'nope', ...PANEL })
    expect(bad.status).toBe(403)
    const short = await anon.req('POST', '/api/admin/setup', { token: setupToken(srv), email: PANEL.email, password: 'short' })
    expect(short.status).toBe(400)
  })

  it('creates the admin once; the token cannot be reused', async () => {
    const token = setupToken(srv)
    const ok = await anon.req('POST', '/api/admin/setup', { token, ...PANEL })
    expect(ok.status).toBe(201)
    const again = await anon.req('POST', '/api/admin/setup', { token, email: 'x@test.local', password: 'another-password-1' })
    expect(again.status).toBe(403)
    expect((await anon.req('GET', '/api/admin/setup')).data).toEqual({ needed: false })
    panel = await panelLogin(srv.url)
  })
})

describe('admin routes', () => {
  let rina: any
  let budi: any

  it('reject anonymous callers and lapak users', async () => {
    expect((await anon.req('GET', '/api/admin/lapak')).status).toBe(401)
    rina = (await panel.req('POST', '/api/admin/lapak', { name: 'Lapak Rina', slug: 'lapak-rina', passcode: 'rina-123' })).data
    const user = await userLogin(srv.url, 'lapak-lapak-rina@bazar.local', 'rina-123')
    expect((await user.req('GET', '/api/admin/lapak')).status).toBe(403)
  })

  it('validate input and refuse a duplicate slug', async () => {
    expect((await panel.req('POST', '/api/admin/lapak', { name: 'X', slug: 'Bad Slug', passcode: 'abcdef' })).status).toBe(400)
    expect((await panel.req('POST', '/api/admin/lapak', { name: 'X', slug: 'xyz', passcode: '123' })).status).toBe(400)
    expect((await panel.req('POST', '/api/admin/lapak', { name: 'X', slug: 'lapak-rina', passcode: 'abcdef' })).status).toBe(400)
  })

  it('public lapak list shows names and links only', async () => {
    const r = await anon.req('GET', '/api/lapak')
    expect(r.data.items).toEqual([{ name: 'Lapak Rina', slug: 'lapak-rina' }])
  })

  it('lapak lookup by slug returns name and login email; unknown is 404', async () => {
    const r = await anon.req('GET', '/api/lapak/lapak-rina')
    expect(r.data).toEqual({ name: 'Lapak Rina', slug: 'lapak-rina', email: 'lapak-lapak-rina@bazar.local' })
    expect((await anon.req('GET', '/api/lapak/tidak-ada')).status).toBe(404)
  })

  it('lists lapak with counts; data stays per lapak', async () => {
    budi = (await panel.req('POST', '/api/admin/lapak', { name: 'Budi', slug: 'budi', passcode: 'budi-123' })).data
    const user = await userLogin(srv.url, 'lapak-lapak-rina@bazar.local', 'rina-123')
    const c = await user.req('POST', '/api/collections/contacts/records', { workspace: rina.id, name: 'Pak Ahmad', phone: '6281234567890' })
    await user.req('POST', '/api/collections/events/records', {
      workspace: rina.id, title: 'CFD', date: '2026-11-01', location: 'Taman', status: 'active', contact: c.data.id,
    })
    const list = (await panel.req('GET', '/api/admin/lapak')).data.items
    expect(list.find((l: any) => l.slug === 'lapak-rina')).toMatchObject({ events: 1, contacts: 1 })
    expect(list.find((l: any) => l.slug === 'budi')).toMatchObject({ events: 0, contacts: 0 })
  })

  it('renames and changes the passcode (old sessions end)', async () => {
    expect((await panel.req('PATCH', `/api/admin/lapak/${rina.id}`, { name: 'Rina Kue' })).data.name).toBe('Rina Kue')
    const old = await userLogin(srv.url, 'lapak-lapak-rina@bazar.local', 'rina-123')
    expect((await panel.req('POST', `/api/admin/lapak/${rina.id}/passcode`, { passcode: 'rina-baru' })).status).toBe(200)
    expect((await old.req('POST', '/api/collections/users/auth-refresh')).status).toBe(401)
    await expect(userLogin(srv.url, 'lapak-lapak-rina@bazar.local', 'rina-123')).rejects.toThrow()
    await userLogin(srv.url, 'lapak-lapak-rina@bazar.local', 'rina-baru')
  })

  it('clear needs the slug, backs up first, keeps the lapak', async () => {
    expect((await panel.req('POST', `/api/admin/lapak/${rina.id}/clear`, { confirm: 'salah' })).status).toBe(403)
    const r = await panel.req('POST', `/api/admin/lapak/${rina.id}/clear`, { confirm: 'lapak-rina' })
    expect(r.status).toBe(200)
    expect(r.data).toMatchObject({ events: 0, contacts: 0, slug: 'lapak-rina' })
    expect(r.data.backup).toMatch(/^pre-clear-.*\.zip$/)
    const backups = (await panel.req('GET', '/api/admin/backups')).data.items.map((b: any) => b.name)
    expect(backups).toContain(r.data.backup)
    await userLogin(srv.url, 'lapak-lapak-rina@bazar.local', 'rina-baru')
  })

  it('delete needs the slug and removes the lapak and its user only', async () => {
    expect((await panel.req('DELETE', `/api/admin/lapak/${budi.id}`, { confirm: 'x' })).status).toBe(403)
    expect((await panel.req('DELETE', `/api/admin/lapak/${budi.id}`, { confirm: 'budi' })).status).toBe(200)
    expect((await anon.req('GET', '/api/lapak/budi')).status).toBe(404)
    await expect(userLogin(srv.url, 'lapak-budi@bazar.local', 'budi-123')).rejects.toThrow()
    const slugs = (await panel.req('GET', '/api/admin/lapak')).data.items.map((l: any) => l.slug)
    expect(slugs).toEqual(['lapak-rina'])
  })

  it('creates a manual backup; restore needs the name', async () => {
    const b = await panel.req('POST', '/api/admin/backups')
    expect(b.status).toBe(201)
    const r = await panel.req('POST', `/api/admin/backups/${b.data.name}/restore`, { confirm: 'x' })
    expect(r.status).toBe(403)
  })

  it('admins cannot be created through the collection API', async () => {
    const r = await anon.req('POST', '/api/collections/admins/records', { email: 'evil@test.local', password: 'evil-password-1', passwordConfirm: 'evil-password-1' })
    expect(r.status).toBe(403)
  })
})
