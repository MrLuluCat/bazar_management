import { paid } from '../lib/payment'

/** Thin ledger bar: filled share = paid share. Decorative; the badge carries the status text. */
export function PaymentBar({ total, payments }: { total: number; payments: { amount: number }[] }) {
  if (total === 0) return null
  const share = Math.min(paid(payments) / total, 1)
  const color = share >= 1 ? 'var(--paid)' : share > 0 ? 'var(--partial)' : 'transparent'
  return (
    <div aria-hidden className="h-1 w-full rounded-sm bg-line">
      <div className="h-1 rounded-sm" style={{ width: `${share * 100}%`, background: color }} />
    </div>
  )
}
