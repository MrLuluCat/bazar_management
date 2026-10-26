import { useSyncExternalStore } from 'react'
import { askAssistant, AssistantError, type ChatTurn, type Proposal } from '../../api/ai'
import { pb } from '../../lib/pb'

// Conversation lives in memory only: cleared on lock / logout, never persisted to the device.

export type ProposalState = 'open' | 'saved' | 'discarded'
export type Bubble =
  | { id: number; role: 'user'; text: string; images: string[] }
  | { id: number; role: 'assistant'; text: string; proposals: Proposal[]; states: Record<string, ProposalState> }
  | { id: number; role: 'error'; text: string; retry: boolean }

type State = { open: boolean; bubbles: Bubble[]; pending: boolean }

let state: State = { open: false, bubbles: [], pending: false }
let nextId = 1
let controller: AbortController | null = null
const listeners = new Set<() => void>()
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

pb.authStore.onChange(() => {
  if (!pb.authStore.isValid) assistant.reset()
})

/** Chat history for the API: text turns only; photos go with the newest user message. */
function history(): ChatTurn[] {
  const turns: ChatTurn[] = []
  for (const b of state.bubbles) {
    if (b.role === 'user') turns.push({ role: 'user', text: b.text })
    if (b.role === 'assistant') turns.push({ role: 'assistant', text: b.text })
  }
  const last = [...state.bubbles].reverse().find((b) => b.role === 'user')
  if (last && last.role === 'user' && last.images.length) turns[turns.length - 1] = { role: 'user', text: last.text, images: last.images }
  return turns.slice(-20)
}

/** The prompt asks for plain text; drop markdown the model still sends (bold, headings, table rules). */
export function plain(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\|?\s*:?-{3,}.*$/gm, '')
    .replace(/^\|\s*(.*?)\s*\|$/gm, (_, row: string) => '• ' + row.split('|').map((c) => c.trim()).filter(Boolean).join(' · '))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function run() {
  controller = new AbortController()
  set({ pending: true })
  try {
    const r = await askAssistant(history(), controller.signal)
    const states = Object.fromEntries(r.proposals.map((p) => [p.id, 'open' as ProposalState]))
    set({ bubbles: [...state.bubbles, { id: nextId++, role: 'assistant', text: plain(r.reply), proposals: r.proposals, states }] })
  } catch (e) {
    const err = e as AssistantError
    if (err.status !== -1) set({ bubbles: [...state.bubbles, { id: nextId++, role: 'error', text: err.message, retry: err.status !== 400 }] })
  } finally {
    controller = null
    set({ pending: false })
  }
}

export const assistant = {
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
  send(text: string, images: string[]) {
    if (state.pending) return
    const bubbles = state.bubbles.filter((b) => b.role !== 'error')
    set({ bubbles: [...bubbles, { id: nextId++, role: 'user', text, images }] })
    void run()
  },
  retry() {
    if (state.pending) return
    set({ bubbles: state.bubbles.filter((b) => b.role !== 'error') })
    void run()
  },
  stop: () => controller?.abort(),
  mark(bubbleId: number, proposalId: string, s: ProposalState) {
    set({
      bubbles: state.bubbles.map((b) => (b.id === bubbleId && b.role === 'assistant' ? { ...b, states: { ...b.states, [proposalId]: s } } : b)),
    })
  },
  reset() {
    controller?.abort()
    set({ open: false, bubbles: [], pending: false })
  },
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => void listeners.delete(cb)
}

export function useAssistant(): State {
  return useSyncExternalStore(subscribe, () => state)
}
