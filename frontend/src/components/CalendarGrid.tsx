import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { EventWithPayments } from '../api/types'
import { buildMonthGrid, dayMarker } from '../lib/calendar'
import { cn } from '../lib/cn'
import { todayJakarta } from '../lib/dates'

const HEAD = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

type Props = { ym: string; events: EventWithPayments[]; selectedDate: string | null; onSelect: (date: string) => void }

export function CalendarGrid({ ym, events, selectedDate, onSelect }: Props) {
  const [y, m] = ym.split('-').map(Number)
  const monthName = format(new Date(y, m - 1, 1), 'LLLL', { locale: idLocale })
  const cells = buildMonthGrid(ym)
  const today = todayJakarta()
  const byDate = new Map<string, EventWithPayments[]>()
  for (const e of events) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e])
  const rows = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))

  return (
    <div role="grid" aria-label={`${monthName} ${y}`} className="w-full">
      <div role="row" className="grid grid-cols-7 text-center text-xs text-muted">
        {HEAD.map((h) => (
          <span key={h} role="columnheader" className="py-1">
            {h}
          </span>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div role="row" key={ri} className="grid grid-cols-7 border-t border-line">
          {row.map((date, ci) => {
            if (!date) return <span key={ci} role="gridcell" aria-hidden className="min-h-[56px]" />
            const day = Number(date.slice(8))
            const mk = dayMarker(byDate.get(date) ?? [])
            const selected = date === selectedDate
            return (
              <button
                key={date}
                type="button"
                role="gridcell"
                aria-selected={selected}
                aria-label={`${day} ${monthName}${mk.count ? `, ${mk.count} event` : ''}`}
                onClick={() => onSelect(date)}
                className={cn(
                  'flex min-h-[56px] flex-col items-center gap-0.5 py-1.5 transition-colors duration-150 hover:bg-accent-wash',
                  selected && 'bg-accent-wash',
                )}
              >
                <span
                  className={cn(
                    'num flex h-7 min-w-7 items-center justify-center rounded-md text-sm',
                    date === today && 'bg-accent font-semibold text-accent-ink',
                  )}
                >
                  {day}
                </span>
                <span
                  data-unpaid={mk.unpaid ? 'true' : undefined}
                  aria-hidden
                  className={cn('num h-4 text-xs leading-4', mk.unpaid ? 'font-semibold text-accent' : 'text-muted')}
                >
                  {mk.label}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
