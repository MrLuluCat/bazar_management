import { useQuery } from '@tanstack/react-query'
import { pb } from '../lib/pb'

export type EventProposal = {
  id: string
  kind: 'event'
  payload: { title: string; date: string; start_time: string; end_time: string; location: string; total_cost: number; contact: string; notes: string }
  contact_name: string
  valid: boolean
  errors: string[]
  reason: string
}
export type PaymentProposal = {
  id: string
  kind: 'payment'
  payload: { event: string; amount: number; paid_at: string; note: string }
  event_title: string
  valid: boolean
  errors: string[]
  reason: string
}
export type ContactProposal = {
  id: string
  kind: 'contact'
  payload: { name: string; phone: string; organization: string; notes: string }
  valid: boolean
  errors: string[]
  reason: string
}
export type Proposal = EventProposal | PaymentProposal | ContactProposal

export type AssistantStep = { tool: string; label: string; ok: boolean }
export type AssistantResult = { reply: string; proposals: Proposal[]; steps: AssistantStep[]; model: string; truncated: boolean }
export type ChatTurn = { role: 'user' | 'assistant'; text: string; images?: string[] }

/** Whether the server has an InferHub key. Hidden assistant when false or unknown. */
export function useAiStatus() {
  return useQuery({
    queryKey: ['ai-status'],
    queryFn: () => pb.send<{ enabled: boolean }>('/api/ai/status', {}).then((r) => r.enabled),
    staleTime: 10 * 60 * 1000,
    retry: 0,
  })
}

export class AssistantError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

/** One assistant turn. Images only on the last (user) message. Aborts after 190 s. */
export async function askAssistant(messages: ChatTurn[], signal: AbortSignal): Promise<AssistantResult> {
  const timeout = AbortSignal.timeout(190_000)
  let res: Response
  try {
    res = await fetch(pb.buildURL('/api/ai/assistant'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: pb.authStore.token },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.any([signal, timeout]),
    })
  } catch (e) {
    if (signal.aborted) throw new AssistantError('Dihentikan.', -1)
    if (timeout.aborted) throw new AssistantError('AI terlalu lama menjawab. Coba lagi.', 504)
    void e
    throw new AssistantError('Tidak ada koneksi ke server.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new AssistantError((data as { message?: string }).message || 'Asisten gagal menjawab. Coba lagi.', res.status)
  return data as AssistantResult
}
