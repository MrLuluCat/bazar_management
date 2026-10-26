import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { cn } from '../lib/cn'
import { formatDateLabel, weekdayShort } from '../lib/dates'

/** Ticket stub: small-caps weekday over a big tabular day number. Used on the agenda and the detail header. */
export function DateStub({ date, today, past, as: Tag = 'h2' }: { date: string; today?: boolean; past?: boolean; as?: 'h2' | 'div' }) {
  const [y, m, d] = date.split('-').map(Number)
  return (
    <Tag aria-label={formatDateLabel(date)} role={Tag === "div" ? "group" : undefined} className="flex w-14 shrink-0 flex-col items-center pt-1 font-normal tracking-normal">
      <span aria-hidden className="text-xs font-semibold uppercase tracking-wide text-muted">
        {weekdayShort(date)}
      </span>
      <span
        aria-hidden
        className={cn('num flex h-10 min-w-10 items-center justify-center rounded-md text-3xl font-semibold leading-none', today && 'bg-accent text-accent-ink', past && 'text-muted')}
      >
        {d}
      </span>
      <span aria-hidden className="text-xs text-muted">
        {format(new Date(y, m - 1, d), 'MMM', { locale: id })}
      </span>
    </Tag>
  )
}
