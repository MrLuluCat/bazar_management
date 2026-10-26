import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { cn } from '../../lib/cn'
import { monthRange } from '../../lib/dates'

type Props = { value: string[]; onChange: (dates: string[]) => void; initialMonth?: string }

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const pad = (n: number) => String(n).padStart(2, '0')

/** Pick several 'YYYY-MM-DD' dates across months. Month grid is Monday-first. */
export function MultiDatePicker({ value, onChange, initialMonth }: Props) {
  const [ym, setYm] = useState(initialMonth ?? new Date().toISOString().slice(0, 7))
  const [y, m] = ym.split('-').map(Number)
  const { end } = monthRange(ym)
  const days = Number(end.slice(8))
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const shift = (d: number) => {
    const n = new Date(y, m - 1 + d, 1)
    setYm(`${n.getFullYear()}-${pad(n.getMonth() + 1)}`)
  }
  const toggle = (date: string) =>
    onChange(value.includes(date) ? value.filter((v) => v !== date) : [...value, date].sort())

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Bulan sebelumnya" onClick={() => shift(-1)} className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent-wash">
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
        </button>
        <span className="text-sm font-semibold" aria-live="polite">
          {format(new Date(y, m - 1, 1), 'LLLL yyyy', { locale: idLocale })}
        </span>
        <button type="button" aria-label="Bulan berikutnya" onClick={() => shift(1)} className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent-wash">
          <ChevronRight size={20} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {DAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${ym}-${pad(i + 1)}`
          const on = value.includes(date)
          return (
            <button
              key={date}
              type="button"
              aria-pressed={on}
              aria-label={format(new Date(y, m - 1, i + 1), 'EEEE d MMMM', { locale: idLocale })}
              onClick={() => toggle(date)}
              className={cn(
                'num mx-auto flex h-11 w-11 items-center justify-center rounded-md text-sm transition-colors duration-150',
                on ? 'bg-accent font-semibold text-accent-ink' : 'hover:bg-accent-wash',
              )}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{value.length} tanggal dipilih</p>
    </div>
  )
}
