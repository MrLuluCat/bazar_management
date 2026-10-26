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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn('truncate text-base', cancelled && 'line-through')}>{e.title}</h3>
          <p className="num truncate text-sm text-muted">{meta}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge total={e.total_cost} payments={e.payments} cancelled={cancelled} />
          {!cancelled && left > 0 && <span className="num text-sm font-medium">{formatRupiah(left)}</span>}
        </div>
      </div>
      {!cancelled && (
        <div className="mt-2">
          <PaymentBar total={e.total_cost} payments={e.payments} />
        </div>
      )}
    </Link>
  )
}
