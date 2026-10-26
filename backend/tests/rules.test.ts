import { afterAll, beforeAll, describe, expect, test } from 'vitest'
// @ts-expect-error plain JS module without types
import { bootstrap } from '../scripts/bootstrap.js'
// @ts-expect-error plain JS module without types
import { seed } from '../scripts/seed.js'
import { makeClient, setupWorld, startServer, type Client, type Server } from './helpers'

let srv: Server
let w: Awaited<ReturnType<typeof setupWorld>>
let anon: Client

beforeAll(async () => {
  srv = await startServer(8091)
  w = await setupWorld(srv.url)
  anon = makeClient(srv.url)
})
afterAll(async () => srv.stop())

const COLLECTIONS = ['workspaces', 'memberships', 'contacts', 'events', 'payments']

describe('API rules', () => {
  test('anon cannot list or create on any collection', async () => {
    for (const c of COLLECTIONS) {
      const list = await anon.req('GET', `/api/collections/${c}/records`)
      expect([200, 403]).toContain(list.status)
      if (list.status === 200) expect(list.data.items).toHaveLength(0)
      const create = await anon.req('POST', `/api/collections/${c}/records`, { name: 'x' })
      expect([400, 403]).toContain(create.status)
    }
  })

  test('member has full CRUD on own workspace contacts, events, payments', async () => {
    const m = w.member
    const contact = await m.req('POST', '/api/collections/contacts/records', {
      workspace: w.a.workspaceId, name: 'Bu Rina', phone: '628123456789',
    })
    expect(contact.status).toBe(200)
    const ev = await m.req('POST', '/api/collections/events/records', {
      workspace: w.a.workspaceId, title: 'CFD', date: '2026-10-12', location: 'South City',
      contact: contact.data.id, total_cost: 150000, status: 'active',
    })
    expect(ev.status).toBe(200)
    const pay = await m.req('POST', '/api/collections/payments/records', {
      event: ev.data.id, amount: 50000, paid_at: '2026-10-01',
    })
    expect(pay.status).toBe(200)

    expect((await m.req('GET', `/api/collections/events/records/${ev.data.id}`)).status).toBe(200)
    expect((await m.req('PATCH', `/api/collections/events/records/${ev.data.id}`, { title: 'CFD 2' })).data.title).toBe('CFD 2')
    expect((await m.req('PATCH', `/api/collections/payments/records/${pay.data.id}`, { amount: 60000 })).status).toBe(200)
    expect((await m.req('PATCH', `/api/collections/contacts/records/${contact.data.id}`, { name: 'Bu R' })).status).toBe(200)
    expect((await m.req('DELETE', `/api/collections/payments/records/${pay.data.id}`)).status).toBe(204)
  })

  test('free event (total_cost 0) is accepted', async () => {
    const r = await w.member.req('POST', '/api/collections/events/records', {
      workspace: w.a.workspaceId, title: 'Gratis', date: '2026-10-13', location: 'X', total_cost: 0, status: 'active',
    })
    expect(r.status).toBe(200)
  })

  test('invalid date format rejected', async () => {
    const r = await w.member.req('POST', '/api/collections/events/records', {
      workspace: w.a.workspaceId, title: 'Bad', date: '12/10/2026', location: 'X', total_cost: 0, status: 'active',
    })
    expect(r.status).toBe(400)
  })

  test('outsider cannot read or write other workspace', async () => {
    const o = w.outsider
    const ev = await w.member.req('POST', '/api/collections/events/records', {
      workspace: w.a.workspaceId, title: 'Private', date: '2026-10-14', location: 'X', total_cost: 1, status: 'active',
    })
    const list = await o.req('GET', '/api/collections/events/records')
    expect(list.data.items.find((e: any) => e.id === ev.data.id)).toBeUndefined()
    expect((await o.req('GET', `/api/collections/events/records/${ev.data.id}`)).status).toBe(404)
    expect((await o.req('PATCH', `/api/collections/events/records/${ev.data.id}`, { title: 'hack' })).status).toBeGreaterThanOrEqual(403)
    expect((await o.req('DELETE', `/api/collections/events/records/${ev.data.id}`)).status).toBeGreaterThanOrEqual(403)
    const create = await o.req('POST', '/api/collections/events/records', {
      workspace: w.a.workspaceId, title: 'Inject', date: '2026-10-14', location: 'X', total_cost: 1, status: 'active',
    })
    expect(create.status).toBeGreaterThanOrEqual(400)
    const pay = await o.req('POST', '/api/collections/payments/records', { event: ev.data.id, amount: 1, paid_at: '2026-10-01' })
    expect(pay.status).toBeGreaterThanOrEqual(400)
  })

  test('outsider cannot move event to other workspace', async () => {
    const own = await w.outsider.req('POST', '/api/collections/events/records', {
      workspace: w.b.workspaceId, title: 'B event', date: '2026-10-15', location: 'X', total_cost: 1, status: 'active',
    })
    expect(own.status).toBe(200)
    const move = await w.outsider.req('PATCH', `/api/collections/events/records/${own.data.id}`, { workspace: w.a.workspaceId })
    expect(move.status).toBeGreaterThanOrEqual(400)
    const moveMember = await w.member.req('POST', '/api/collections/events/records', {
      workspace: w.a.workspaceId, title: 'A event', date: '2026-10-15', location: 'X', total_cost: 1, status: 'active',
    })
    const steal = await w.member.req('PATCH', `/api/collections/events/records/${moveMember.data.id}`, { workspace: w.b.workspaceId })
    expect(steal.status).toBeGreaterThanOrEqual(400)
  })

  test('payments cascade when event deleted', async () => {
    const ev = await w.member.req('POST', '/api/collections/events/records', {
      workspace: w.a.workspaceId, title: 'Cascade', date: '2026-10-16', location: 'X', total_cost: 100, status: 'active',
    })
    const pay = await w.member.req('POST', '/api/collections/payments/records', { event: ev.data.id, amount: 10, paid_at: '2026-10-01' })
    expect((await w.member.req('DELETE', `/api/collections/events/records/${ev.data.id}`)).status).toBe(204)
    expect((await w.admin.req('GET', `/api/collections/payments/records/${pay.data.id}`)).status).toBe(404)
  })

  test('contact delete nulls event.contact', async () => {
    const c = await w.member.req('POST', '/api/collections/contacts/records', { workspace: w.a.workspaceId, name: 'Del', phone: '628111111111' })
    const ev = await w.member.req('POST', '/api/collections/events/records', {
      workspace: w.a.workspaceId, title: 'Link', date: '2026-10-17', location: 'X', total_cost: 0, status: 'active', contact: c.data.id,
    })
    expect((await w.member.req('DELETE', `/api/collections/contacts/records/${c.data.id}`)).status).toBe(204)
    const after = await w.member.req('GET', `/api/collections/events/records/${ev.data.id}`)
    expect(after.data.contact).toBe('')
  })

  test('contact phone must be normalized 62 digits', async () => {
    const r = await w.member.req('POST', '/api/collections/contacts/records', { workspace: w.a.workspaceId, name: 'Bad', phone: '0812' })
    expect(r.status).toBe(400)
  })

  test('memberships are read-only for members; signup locked', async () => {
    const list = await w.member.req('GET', '/api/collections/memberships/records')
    expect(list.data.items).toHaveLength(1)
    const mk = await w.member.req('POST', '/api/collections/memberships/records', { workspace: w.b.workspaceId, user: w.member.id, role: 'member' })
    expect(mk.status).toBeGreaterThanOrEqual(400)
    const del = await w.member.req('DELETE', `/api/collections/memberships/records/${w.a.membershipId}`)
    expect(del.status).toBeGreaterThanOrEqual(400)
    const signup = await anon.req('POST', '/api/collections/users/records', {
      email: 'x@test.local', password: 'password123', passwordConfirm: 'password123',
    })
    expect(signup.status).toBeGreaterThanOrEqual(400)
  })

  test('members can rename own workspace, not create or delete one', async () => {
    expect((await w.member.req('PATCH', `/api/collections/workspaces/records/${w.a.workspaceId}`, { name: 'Lapak' })).status).toBe(200)
    expect((await w.member.req('POST', '/api/collections/workspaces/records', { name: 'new' })).status).toBeGreaterThanOrEqual(400)
    expect((await w.member.req('DELETE', `/api/collections/workspaces/records/${w.a.workspaceId}`)).status).toBeGreaterThanOrEqual(400)
    expect((await w.outsider.req('PATCH', `/api/collections/workspaces/records/${w.a.workspaceId}`, { name: 'hack' })).status).toBeGreaterThanOrEqual(400)
  })

  test('bootstrap is idempotent', async () => {
    const again = await bootstrap({ url: srv.url, adminToken: w.token, groupEmail: 'a@test.local', groupPasscode: 'passcode-a' })
    expect(again.workspaceId).toBe(w.a.workspaceId)
    const wss = await w.admin.req('GET', '/api/collections/workspaces/records')
    expect(wss.data.totalItems).toBe(2)
  })
})

describe('seed', () => {
  test('seed yields 3+ events on one date and a 6-event series', async () => {
    await seed({ url: srv.url, adminToken: w.token, workspaceId: w.b.workspaceId })
    const same = await w.outsider.req('GET', '/api/collections/events/records?filter=' + encodeURIComponent('date="2026-10-24"'))
    expect(same.data.items.length).toBeGreaterThanOrEqual(3) // 3 one-offs + weekly series occurrence
    const series = await w.outsider.req('GET', '/api/collections/events/records?filter=' + encodeURIComponent('series_id!=""'))
    expect(series.data.items).toHaveLength(6)
  })
})

describe('auth rate limit', () => {
  test('returns 429 after 5 attempts in 60s', async () => {
    const s2 = await startServer(8092)
    try {
      const c = makeClient(s2.url)
      const codes: number[] = []
      for (let i = 0; i < 7; i++) {
        const r = await c.req('POST', '/api/collections/users/auth-with-password', { identity: 'nobody@test.local', password: 'wrong-pass' })
        codes.push(r.status)
      }
      expect(codes.slice(0, 5).every((s) => s === 400)).toBe(true)
      expect(codes).toContain(429)
    } finally {
      await s2.stop()
    }
  })
})
