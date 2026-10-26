import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fakeInferhub } from './fakeInferhub'
import { adminToken, makeClient, setupWorld, startServer, type Client, type Server } from './helpers'

let srv: Server
let off: Server
let fake: Awaited<ReturnType<typeof fakeInferhub>>
let member: Client
let outsider: Client
let wsA: string
let eventA: string
let eventB: string

const ask = (c: Client, text: string, extra: Record<string, unknown> = {}) =>
  c.req('POST', '/api/ai/assistant', { messages: [{ role: 'user', text, ...extra }] })

beforeAll(async () => {
  fake = await fakeInferhub(8096)
  srv = await startServer(8094, { INFERHUB_API_KEY: 'test-key', INFERHUB_BASE_URL: fake.url, INFERHUB_MODEL: 'test-model' })
  off = await startServer(8095)
  const su = makeClient(srv.url, await adminToken(srv.url))
  await su.req('PATCH', '/api/settings', { rateLimits: { enabled: false } })
  const w = await setupWorld(srv.url)
  member = w.member
  outsider = w.outsider
  wsA = w.a.workspaceId
  eventA = (await member.req('POST', '/api/collections/events/records', { workspace: wsA, title: 'CFD Taman Kota', date: '2026-11-07', location: 'Taman Kota', status: 'active', total_cost: 150000 })).data.id
  eventB = (await outsider.req('POST', '/api/collections/events/records', { workspace: w.b.workspaceId, title: 'Rahasia B', date: '2026-11-07', location: 'X', status: 'active' })).data.id
}, 60_000)

afterAll(async () => {
  await srv?.stop()
  await off?.stop()
  await fake?.close()
})

describe('AI assistant', () => {
  it('status and calls need a lapak login; disabled server says so', async () => {
    expect((await makeClient(srv.url).req('GET', '/api/ai/status')).status).toBe(401)
    expect((await member.req('GET', '/api/ai/status')).data).toEqual({ enabled: true })
    const w = await setupWorld(off.url)
    expect((await w.member.req('GET', '/api/ai/status')).data).toEqual({ enabled: false })
    expect((await ask(w.member, 'halo')).status).toBe(503)
  })

  it('validates the conversation before calling the model', async () => {
    fake.script([])
    expect((await member.req('POST', '/api/ai/assistant', { messages: [] })).status).toBe(400)
    expect((await member.req('POST', '/api/ai/assistant', { messages: [{ role: 'assistant', text: 'x' }] })).status).toBe(400)
    expect((await ask(member, 'x'.repeat(4001))).status).toBe(400)
    expect((await ask(member, 'lihat', { images: ['data:text/html;base64,AAAA'] })).status).toBe(400)
    expect(fake.requests).toHaveLength(0)
  })

  it('sends the key only in the Authorization header and uses the env model', async () => {
    fake.script([{ content: 'Halo!' }])
    const r = await ask(member, 'halo')
    expect(r.status).toBe(200)
    expect(r.data).toMatchObject({ reply: 'Halo!', proposals: [], steps: [], model: 'fake-model', truncated: false })
    expect(fake.requests[0].auth).toBe('Bearer test-key')
    expect(fake.requests[0].body.model).toBe('test-model')
    expect(JSON.stringify(fake.requests[0].body)).not.toContain('test-key')
    expect(fake.requests[0].body.messages[0].content).toContain('lapak "A"') // system prompt names the lapak
  })

  it('reads only its own lapak through tools', async () => {
    fake.script([{ tool_calls: [{ name: 'get_agenda', args: { month: '2026-11' } }] }, { content: 'Ada 1 event.' }])
    const r = await ask(member, 'November ada apa?')
    expect(r.data.reply).toBe('Ada 1 event.')
    expect(r.data.steps).toEqual([{ tool: 'get_agenda', label: 'Membaca agenda', ok: true }])
    const toolMsg = fake.requests[1].body.messages.find((m: any) => m.role === 'tool')
    const result = JSON.parse(toolMsg.content)
    expect(result.events.map((e: any) => e.title)).toEqual(['CFD Taman Kota'])
    expect(result.events[0]).toMatchObject({ total_cost: 150000, paid: 0, remaining: 150000 })
  })

  it('turns propose_* calls into validated proposals and never writes', async () => {
    fake.script([
      {
        tool_calls: [
          { name: 'propose_event', args: { title: 'Bazar Sekolah', date: '2026-11-14', start_time: '08:00', location: 'SD Harapan', total_cost: 200000, reason: 'poster' } },
          { name: 'propose_contact', args: { name: 'Bu Sari', phone: '0812-3456-7890' } },
          { name: 'propose_payment', args: { event_id: eventA, amount: 50000, paid_at: '2026-10-26' } },
          { name: 'propose_payment', args: { event_id: eventB, amount: 50000, paid_at: '2026-10-26' } },
          { name: 'propose_event', args: { title: 'Rusak', date: 'besok', location: '' } },
        ],
      },
      { content: 'Saya siapkan usulannya.' },
    ])
    const before = (await member.req('GET', '/api/collections/events/records')).data.totalItems
    const r = await ask(member, 'catat ini')
    const [ev, contact, pay, foreign, bad] = r.data.proposals
    expect(ev).toMatchObject({ kind: 'event', valid: true, payload: { title: 'Bazar Sekolah', date: '2026-11-14', start_time: '08:00', total_cost: 200000 } })
    expect(contact).toMatchObject({ kind: 'contact', valid: true, payload: { phone: '6281234567890' } })
    expect(pay).toMatchObject({ kind: 'payment', valid: true, event_title: 'CFD Taman Kota · 2026-11-07' })
    expect(foreign).toMatchObject({ kind: 'payment', valid: false }) // other lapak's event is invisible
    expect(bad.valid).toBe(false)
    expect(bad.errors.length).toBe(2)
    expect((await member.req('GET', '/api/collections/events/records')).data.totalItems).toBe(before)
  })

  it('passes photos to the model as image parts', async () => {
    fake.script([{ content: 'Foto terbaca.' }])
    const img = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    await ask(member, 'ini poster', { images: [img] })
    const last = fake.requests[0].body.messages.at(-1)
    expect(last.content[1]).toEqual({ type: 'image_url', image_url: { url: img } })
  })

  it('maps upstream errors to readable messages', async () => {
    fake.script([{ status: 429 }])
    const r = await ask(member, 'halo')
    expect(r.status).toBe(429)
    expect(r.data.message).toMatch(/sibuk/)
  })
})
