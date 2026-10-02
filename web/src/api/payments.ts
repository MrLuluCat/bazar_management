import { useMutation, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query'
import { pb } from '../lib/pb'
import { toast } from '../components/ui/Toast'
import type { EventWithPayments, PaymentRecord } from './types'

export type PaymentInput = {
  amount: number
  paid_at: string
  note: string
  proof?: File | null
  removeProof?: boolean
}

function body(input: PaymentInput, eventId?: string): FormData | Record<string, unknown> {
  if (input.proof) {
    const fd = new FormData()
    if (eventId) fd.set('event', eventId)
    fd.set('amount', String(input.amount))
    fd.set('paid_at', input.paid_at)
    fd.set('note', input.note)
    fd.set('proof', input.proof)
    return fd
  }
  const plain: Record<string, unknown> = { amount: input.amount, paid_at: input.paid_at, note: input.note }
  if (eventId) plain.event = eventId
  if (input.removeProof) plain.proof = null
  return plain
}

type Snapshot = [QueryKey, unknown][]

/** Apply `fn` to one event's payments in every cached event / month query. Returns a rollback snapshot. */
function patchPayments(qc: QueryClient, eventId: string, fn: (p: PaymentRecord[]) => PaymentRecord[]): Snapshot {
  const snap: Snapshot = [...qc.getQueriesData({ queryKey: ['event'] }), ...qc.getQueriesData({ queryKey: ['events'] })]
  qc.setQueriesData<EventWithPayments>({ queryKey: ['event', eventId] }, (d) => (d ? { ...d, payments: fn(d.payments) } : d))
  qc.setQueriesData<EventWithPayments[]>({ queryKey: ['events'] }, (d) =>
    Array.isArray(d) ? d.map((e) => (e.id === eventId ? { ...e, payments: fn(e.payments) } : e)) : d,
  )
  return snap
}

function rollback(qc: QueryClient, snap?: Snapshot) {
  snap?.forEach(([key, data]) => qc.setQueryData(key, data))
}

function useMutationBase<V>(eventId: string, optimistic: (v: V) => (p: PaymentRecord[]) => PaymentRecord[], run: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation<unknown, Error, V, { snap: Snapshot }>({
    mutationFn: run,
    onMutate: async (v) => {
      await Promise.all([qc.cancelQueries({ queryKey: ['event'] }), qc.cancelQueries({ queryKey: ['events'] })])
      return { snap: patchPayments(qc, eventId, optimistic(v)) }
    },
    onError: (_e, _v, ctx) => {
      rollback(qc, ctx?.snap)
      toast.show('Gagal menyimpan pembayaran. Perubahan dibatalkan.')
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['event'] })
      void qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

let tmp = 0

export function useCreatePayment(eventId: string) {
  return useMutationBase<PaymentInput>(
    eventId,
    (v) => (p) => [...p, { id: `tmp-${++tmp}`, event: eventId, amount: v.amount, paid_at: v.paid_at, note: v.note, proof: '' }],
    (v) => pb.collection('payments').create(body(v, eventId) as never),
  )
}

export function useUpdatePayment(eventId: string) {
  return useMutationBase<{ id: string; input: PaymentInput }>(
    eventId,
    ({ id, input }) => (p) => p.map((x) => (x.id === id ? { ...x, amount: input.amount, paid_at: input.paid_at, note: input.note } : x)),
    ({ id, input }) => pb.collection('payments').update(id, body(input) as never),
  )
}

export function useDeletePayment(eventId: string) {
  return useMutationBase<string>(
    eventId,
    (id) => (p) => p.filter((x) => x.id !== id),
    (id) => pb.collection('payments').delete(id),
  )
}
