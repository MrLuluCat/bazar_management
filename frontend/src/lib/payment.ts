export type PaymentStatus = 'gratis' | 'belum' | 'dp' | 'lunas'

type Amounted = { amount: number }
type Summarizable = { status: string; total_cost: number; payments: Amounted[] }

export const paid = (payments: Amounted[]): number => payments.reduce((s, p) => s + p.amount, 0)

export const remaining = (total: number, payments: Amounted[]): number => Math.max(total - paid(payments), 0)

export function paymentStatus(total: number, payments: Amounted[]): { status: PaymentStatus; overpaid: number } {
  const p = paid(payments)
  if (total === 0) return { status: 'gratis', overpaid: 0 }
  if (p === 0) return { status: 'belum', overpaid: 0 }
  if (p < total) return { status: 'dp', overpaid: 0 }
  return { status: 'lunas', overpaid: p - total }
}

/** Active events only. */
export function monthSummary(events: Summarizable[]) {
  const active = events.filter((e) => e.status !== 'cancelled')
  return {
    count: active.length,
    totalCost: active.reduce((s, e) => s + e.total_cost, 0),
    totalRemaining: active.reduce((s, e) => s + remaining(e.total_cost, e.payments), 0),
  }
}
