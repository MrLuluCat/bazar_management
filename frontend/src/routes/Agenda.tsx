import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import { useMonthEvents } from '../api/events'
import type { EventWithPayments } from '../api/types'
import { CalendarGrid } from '../components/CalendarGrid'
import { Sheet } from '../components/ui/Sheet'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { useShortcuts } from '../hooks/useShortcuts'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useOverlay } from '../hooks/useOverlay'
import { getView, setView as storeView, type View } from '../lib/viewPref'
import { DateStub } from '../components/DateStub'
import { EventRow } from '../components/EventRow'
import { FilterChips } from '../components/FilterChips'
import { MonthHeader, shiftMonth } from '../components/MonthHeader'
import { SummaryStrip } from '../components/SummaryStrip'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { SkeletonRows } from '../components/ui/Skeleton'
import { filterEvents, type Chip } from '../lib/agenda'
import { cn } from '../lib/cn'
import { formatDayMonth, groupByDate, todayJakarta } from '../lib/dates'
import { monthSummary } from '../lib/payment'

export default function Agenda() {
  const [params, setParams] = useSearchParams()
  const today = todayJakarta()
  const ym = params.get('m') ?? today.slice(0, 7)
  const [chip, setChip] = useState<Chip>('semua')
  const [q, setQ] = useState('')
  const [scrollToToday, setScrollToToday] = useState(0)
  const { data, isLoading, isError, refetch } = useMonthEvents(ym)
  const [view, setViewState] = useState<View>(getView)
  const desktop = useMediaQuery('(min-width: 1024px)')
  const { open } = useOverlay()
  const sel = params.get('sel')
  const changeView = (v: View) => {
    setViewState(v)
    storeView(v)
  }
  const select = (date: string) => {
    const p = new URLSearchParams(params)
    p.set('sel', date)
    setParams(p, { replace: true })
  }
  const clearSel = () => {
    const p = new URLSearchParams(params)
    p.delete('sel')
    setParams(p, { replace: true })
  }

  const setMonth = (next: string) => {
    const p = new URLSearchParams(params)
    p.set('m', next)
    p.delete('sel')
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
  const searchRef = useRef<HTMLInputElement>(null)
  useShortcuts({
    ArrowLeft: () => setMonth(shiftMonth(ym, -1)),
    ArrowRight: () => setMonth(shiftMonth(ym, 1)),
    t: goToday,
    '/': () => searchRef.current?.focus(),
  })

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <MonthHeader ym={ym} onChange={setMonth} onToday={goToday} />
      <SummaryStrip count={summary.count} totalCost={summary.totalCost} totalRemaining={summary.totalRemaining} />
      <SegmentedControl
        label="Tampilan"
        value={view}
        onChange={changeView}
        options={[
          { value: 'agenda', label: 'Agenda' },
          { value: 'kalender', label: 'Kalender' },
        ]}
      />
      {view === 'kalender' && (
        <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-6">
          <CalendarGrid ym={ym} events={events} selectedDate={sel} onSelect={select} />
          {desktop && (
            <section role="region" aria-label={sel ? `Event ${formatDayMonth(sel)}` : 'Event hari terpilih'} className="rounded-lg border border-line p-3">
              <DayEvents date={sel} events={events} onAdd={(d) => open('new', 'event', { date: d })} />
            </section>
          )}
        </div>
      )}
      {view === 'kalender' && !desktop && (
        <Sheet open={!!sel} onClose={clearSel} title={sel ? `Event ${formatDayMonth(sel)}` : 'Event'}>
          <DayEvents date={sel} events={events} onAdd={(d) => open('new', 'event', { date: d })} />
        </Sheet>
      )}
      {view === 'agenda' && (<>
      <div className="flex flex-col gap-3">
        <FilterChips value={chip} onChange={setChip} />
        <div className="relative">
          <Search aria-hidden size={18} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input ref={searchRef} type="search" aria-label="Cari" placeholder="Cari judul, lokasi, kontak" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
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
          <Button variant="primary" write onClick={openNew}>
            Tambah event
          </Button>
        </div>
      )}

      {!isLoading && !isError && events.length > 0 && groups.length === 0 && <p className="py-6 text-sm text-muted">Tidak ada event yang cocok.</p>}

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <section key={g.date} id={`d-${g.date}`} className="flex gap-3 scroll-mt-16">
            <DateStub date={g.date} today={g.date === today} past={g.date < today} />
            <div className="min-w-0 flex-1 border-l border-dashed border-line-strong pl-4">
              {g.items.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          </section>
        ))}
      </div>
      </>)}
    </div>
  )
}

function DayEvents({ date, events, onAdd }: { date: string | null; events: EventWithPayments[]; onAdd: (date: string) => void }) {
  if (!date) return <p className="text-sm text-muted">Pilih tanggal untuk melihat event.</p>
  const list = events.filter((e) => e.date === date)
  return (
    <div className="flex flex-col gap-2">
      {list.length === 0 && <p className="text-sm text-muted">Tidak ada event.</p>}
      <div>
        {list.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
      <Button onClick={() => onAdd(date)} className="self-start">
        Tambah event di tanggal ini
      </Button>
    </div>
  )
}
