import { Link } from 'react-router'
import type { EventWithPayments } from '../api/types'
import { cn } from '../lib/cn'
import { formatTimeRange } from '../lib/dates'
import { formatRupiah } from '../lib/money'
import { remaining } from '../lib/payment'
import { PaymentBar } from './PaymentBar'
import { StatusBadge } from './StatusBadge'

export function EventRow({ event: e }: { event: EventWithPayments }) {
  const cancelled = e.status === 'cancelled'
  const left = remaining(e.total_cost, e.payments)
  const time = formatTimeRange(e.start_time, e.end_time)
  const meta = [time, e.location].filter(Boolean).join(' · ')
  return (
    <Link
      to={`/event/${e.id}`}
      className={cn('block min-h-[44px] border-b border-line py-3 text-ink no-underline last:border-b-0', cancelled && 'text-muted')}
    >
      {/* Title gets the full width; the amount still owed sits right. Status leads the second line. */}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={cn('min-w-0 truncate text-base', cancelled && 'line-through')}>{e.title}</h3>
        {!cancelled && left > 0 && <span className="num shrink-0 text-sm font-medium">{formatRupiah(left)}</span>}
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <StatusBadge total={e.total_cost} payments={e.payments} cancelled={cancelled} />
        {meta && <p className="num min-w-0 truncate text-sm text-muted">{meta}</p>}
      </div>
      {!cancelled && (
        <div className="mt-2">
          <PaymentBar total={e.total_cost} payments={e.payments} />
        </div>
      )}
    </Link>
  )
}
