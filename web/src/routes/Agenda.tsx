import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { useMonthEvents } from '../api/events'
import { DateStub } from '../components/DateStub'
import { EventRow } from '../components/EventRow'
import { FilterChips } from '../components/FilterChips'
import { MonthHeader } from '../components/MonthHeader'
import { SummaryStrip } from '../components/SummaryStrip'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SkeletonRows } from '../components/ui/Skeleton'
import { filterEvents, type Chip } from '../lib/agenda'
import { cn } from '../lib/cn'
import { groupByDate, todayJakarta } from '../lib/dates'
import { monthSummary } from '../lib/payment'

export default function Agenda() {
  const [params, setParams] = useSearchParams()
  const today = todayJakarta()
  const ym = params.get('m') ?? today.slice(0, 7)
  const [chip, setChip] = useState<Chip>('semua')
  const [q, setQ] = useState('')
  const [scrollToToday, setScrollToToday] = useState(0)
  const { data, isLoading, isError, refetch } = useMonthEvents(ym)

  const setMonth = (next: string) => {
    const p = new URLSearchParams(params)
    p.set('m', next)
    setParams(p, { replace: true })
  }
  const openNew = () => {
    const p = new URLSearchParams(params)
    p.set('new', 'event')
    setParams(p)
  }

  const events = data ?? []
  const summary = useMemo(() => monthSummary(events), [events])
  const groups = useMemo(() => groupByDate(filterEvents(events, { chip, q, today })), [events, chip, q, today])

  // "Hari ini": scroll to today's header, or the next date that has events.
  useEffect(() => {
    if (!scrollToToday || !data) return
    const target = groups.find((g) => g.date >= today) ?? groups[groups.length - 1]
    if (target) document.getElementById(`d-${target.date}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [scrollToToday, data, groups, today])

  // After saving an event: ?f=<date> scrolls to that date, then clears itself.
  const focus = params.get('f')
  useEffect(() => {
    if (!focus || !data) return
    document.getElementById(`d-${focus}`)?.scrollIntoView({ block: 'start' })
    const p = new URLSearchParams(params)
    p.delete('f')
    setParams(p, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, data])

  const goToday = () => {
    setMonth(today.slice(0, 7))
    setScrollToToday((n) => n + 1)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <MonthHeader ym={ym} onChange={setMonth} onToday={goToday} />
      <SummaryStrip count={summary.count} totalCost={summary.totalCost} totalRemaining={summary.totalRemaining} />
      <div className="flex flex-col gap-3">
        <FilterChips value={chip} onChange={setChip} />
        <div className="relative">
          <Search aria-hidden size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input type="search" aria-label="Cari" placeholder="Cari judul, lokasi, kontak" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
      </div>

      {isLoading && <SkeletonRows />}

      {isError && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-unpaid">Gagal memuat event.</p>
          <Button onClick={() => void refetch()}>Coba lagi</Button>
        </div>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <div className="flex flex-col items-start gap-3 py-6">
          <p className="text-sm text-muted">Belum ada event bulan ini.</p>
          <Button variant="primary" onClick={openNew}>
            Tambah event
          </Button>
        </div>
      )}

      {!isLoading && !isError && events.length > 0 && groups.length === 0 && <p className="py-6 text-sm text-muted">Tidak ada event yang cocok.</p>}

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <section key={g.date} id={`d-${g.date}`} className={cn('flex gap-3 scroll-mt-16', g.date < today && 'opacity-75')}>
            <DateStub date={g.date} today={g.date === today} />
            <div className="min-w-0 flex-1 border-l border-dashed border-line-strong pl-4">
              {g.items.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
