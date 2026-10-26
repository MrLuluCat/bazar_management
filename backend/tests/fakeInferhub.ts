import { createServer, type Server } from 'node:http'

export type ChatMessage = { role: string; content?: unknown; tool_calls?: unknown[]; tool_call_id?: string }
export type Reply = { content?: string; tool_calls?: { name: string; args: Record<string, unknown> }[] } | { status: number }

/** Minimal OpenAI-style /chat/completions stand-in. Each request gets the next scripted reply. */
export async function fakeInferhub(port: number, responder?: (body: any) => Reply) {
  const requests: { auth: string | undefined; body: any }[] = []
  let script: Reply[] = []
  let n = 0
  const server: Server = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      requests.push({ auth: req.headers.authorization, body: JSON.parse(raw || '{}') })
      const body = requests[requests.length - 1].body
      const r = script.shift() ?? responder?.(body) ?? { content: 'selesai' }
      if ('status' in r) {
        res.writeHead(r.status, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: { code: 'x' } }))
      }
      const message: any = { role: 'assistant', content: r.content ?? '' }
      if (r.tool_calls) {
        message.tool_calls = r.tool_calls.map((c) => ({ id: `call_${++n}`, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args) } }))
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ id: `cmpl_${n}`, model: 'fake-model', choices: [{ index: 0, message }] }))
    })
  })
  await new Promise<void>((r) => server.listen(port, '127.0.0.1', () => r()))
  return {
    url: `http://127.0.0.1:${port}/v1`,
    requests,
    script(replies: Reply[]) {
      script = replies
      requests.length = 0
    },
    close: () => new Promise<void>((r) => server.close(() => r())),
  }
}
