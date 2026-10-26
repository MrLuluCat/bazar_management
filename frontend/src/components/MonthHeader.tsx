import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Button } from './ui/Button'

const pad = (n: number) => String(n).padStart(2, '0')

export const shiftMonth = (ym: string, delta: number) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

type Props = { ym: string; onChange: (ym: string) => void; onToday: () => void }

export function MonthHeader({ ym, onChange, onToday }: Props) {
  const [y, m] = ym.split('-').map(Number)
  const arrow = 'flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent-wash'
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center">
        <button type="button" aria-label="Bulan sebelumnya" className={arrow} onClick={() => onChange(shiftMonth(ym, -1))}>
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
        </button>
        <h1 className="whitespace-nowrap px-1 text-center text-lg sm:min-w-36 sm:text-xl" aria-live="polite">
          {format(new Date(y, m - 1, 1), 'LLLL yyyy', { locale: id })}
        </h1>
        <button type="button" aria-label="Bulan berikutnya" className={arrow} onClick={() => onChange(shiftMonth(ym, 1))}>
          <ChevronRight size={20} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      <Button onClick={onToday} className="shrink-0 whitespace-nowrap px-3">
        Hari ini
      </Button>
    </div>
  )
}
