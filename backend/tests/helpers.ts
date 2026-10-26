import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
// @ts-expect-error plain JS module without types
import { adminLogin, bootstrap } from '../scripts/bootstrap.js'

const BACKEND = path.resolve(import.meta.dirname, '..')
const BIN = path.join(BACKEND, process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase')
export const ADMIN = { email: 'admin@test.local', password: 'admin-password-123' }

export type Server = { url: string; dir: string; proc: ChildProcess; log: () => string; stop(): Promise<void> }

export async function startServer(port: number): Promise<Server> {
  const dir = mkdtempSync(path.join(tmpdir(), 'bazar-pb-'))
  const migrationsDir = path.join(BACKEND, 'pb_migrations')
  const base = [`--dir=${dir}`, `--migrationsDir=${migrationsDir}`, `--hooksDir=${path.join(BACKEND, 'pb_hooks')}`]
  const up = spawnSync(BIN, ['superuser', 'upsert', ADMIN.email, ADMIN.password, ...base], { encoding: 'utf8' })
  if (up.status !== 0) throw new Error('superuser upsert failed: ' + up.stderr + up.stdout)
  const proc = spawn(BIN, ['serve', `--http=127.0.0.1:${port}`, ...base], { stdio: ['ignore', 'pipe', 'pipe'] })
  let out = ''
  proc.stdout!.on('data', (d) => (out += d))
  proc.stderr!.on('data', (d) => (out += d))
  const url = `http://127.0.0.1:${port}`
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url + '/api/health')).ok) break
    } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  return {
    url,
    dir,
    proc,
    log: () => out,
    async stop() {
      proc.kill()
      await new Promise((r) => setTimeout(r, 300))
      try { rmSync(dir, { recursive: true, force: true }) } catch {}
    },
  }
}

export type Client = {
  token: string
  id: string
  req(method: string, p: string, body?: unknown): Promise<{ status: number; data: any }>
}

export function makeClient(url: string, token = '', id = ''): Client {
  return {
    token,
    id,
    async req(method, p, body) {
      const res = await fetch(url + p, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json().catch(() => ({}))
      return { status: res.status, data }
    },
  }
}

export async function userLogin(url: string, email: string, password: string): Promise<Client> {
  const res = await fetch(url + '/api/collections/users/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  })
  const data: any = await res.json()
  if (!res.ok) throw new Error('login failed ' + JSON.stringify(data))
  return makeClient(url, data.token, data.record.id)
}

export async function adminToken(url: string) {
  return adminLogin(url, ADMIN.email, ADMIN.password) as Promise<string>
}

export async function setupWorld(url: string) {
  const token = await adminToken(url)
  const admin = makeClient(url, token)
  const a = await bootstrap({ url, adminToken: token, groupEmail: 'a@test.local', groupPasscode: 'passcode-a', workspaceName: 'A', workspaceSlug: 'ws-a' })
  const b = await bootstrap({ url, adminToken: token, groupEmail: 'b@test.local', groupPasscode: 'passcode-b', workspaceName: 'B', workspaceSlug: 'ws-b' })
  const member = await userLogin(url, 'a@test.local', 'passcode-a')
  const outsider = await userLogin(url, 'b@test.local', 'passcode-b')
  return { admin, member, outsider, a, b, token }
}

/** The one-time admin setup token printed by the server on start (no admin yet). */
export function setupToken(srv: Server): string {
  const m = srv.log().match(/\/admin\/setup\?token=([A-Za-z0-9]+)/g)
  if (!m) throw new Error('no setup token in log:\n' + srv.log())
  return m[m.length - 1].split('=')[1]
}
