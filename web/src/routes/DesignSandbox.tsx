import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Field } from '../components/ui/Field'
import { Input, Select, Textarea } from '../components/ui/Input'
import { RupiahInput } from '../components/ui/RupiahInput'
import { TimeInput } from '../components/ui/TimeInput'
import { DatePicker } from '../components/ui/DatePicker'
import { MultiDatePicker } from '../components/ui/MultiDatePicker'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Sheet } from '../components/ui/Sheet'
import { Dialog } from '../components/ui/Dialog'
import { SkeletonRows } from '../components/ui/Skeleton'
import { Toaster, toast } from '../components/ui/Toast'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line py-5">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  )
}

/** Dev-only primitives page (/_sandbox). Removed or gated in Task 13. */
export default function DesignSandbox() {
  const [cost, setCost] = useState(150000)
  const [time, setTime] = useState('08:00')
  const [date, setDate] = useState('2026-10-24')
  const [dates, setDates] = useState<string[]>(['2026-10-10', '2026-10-17'])
  const [view, setView] = useState<'agenda' | 'kalender'>('agenda')
  const [sheet, setSheet] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [theme, setTheme] = useState<'auto' | 'light' | 'dark'>('auto')

  const applyTheme = (t: typeof theme) => {
    setTheme(t)
    if (t === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', t)
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <header className="flex items-center justify-between gap-3 pb-4">
        <h1 className="text-3xl">Bazar</h1>
        <SegmentedControl
          label="Tema"
          value={theme}
          onChange={applyTheme}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'light', label: 'Terang' },
            { value: 'dark', label: 'Gelap' },
          ]}
        />
      </header>

      <Section title="Agenda — tanda tangan visual">
        <div className="flex gap-3">
          <div className="flex w-14 shrink-0 flex-col items-center pt-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Sab</span>
            <span className="num text-3xl font-semibold leading-none">24</span>
            <span className="text-xs text-muted">Okt</span>
          </div>
          <div className="flex-1 border-l border-dashed border-line-strong pl-4">
            {[
              { t: 'CFD South City', time: '06:00–10:00', loc: 'South City', kind: 'dp' as const, rest: 100000, paid: 0.33 },
              { t: 'Bazar Sekolah', time: '08:00–14:00', loc: 'SD Harapan', kind: 'lunas' as const, rest: 0, paid: 1 },
            ].map((e) => (
              <article key={e.t} className="border-b border-line py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base">{e.t}</h3>
                    <p className="num text-sm text-muted">
                      {e.time} · {e.loc}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge kind={e.kind} />
                    {e.rest > 0 && <span className="num text-sm font-medium">Rp {e.rest.toLocaleString('id-ID')}</span>}
                  </div>
                </div>
                <div className="mt-2 h-1 w-full rounded-sm bg-line" aria-hidden>
                  <div className="h-1 rounded-sm" style={{ width: `${e.paid * 100}%`, background: e.kind === 'lunas' ? 'var(--paid)' : 'var(--partial)' }} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Badge status">
        <div className="flex flex-wrap gap-2">
          <Badge kind="belum" />
          <Badge kind="dp" />
          <Badge kind="lunas" />
          <Badge kind="gratis" />
          <Badge kind="batal" />
        </div>
      </Section>

      <Section title="Tombol">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Simpan</Button>
          <Button>Batal</Button>
          <Button variant="danger">Hapus</Button>
          <Button variant="ghost">Lainnya</Button>
          <Button variant="primary" loading>
            Menyimpan
          </Button>
          <Button disabled disabledReason="Offline">
            Tambah event
          </Button>
        </div>
      </Section>

      <Section title="Formulir">
        <Field label="Judul" hint="Nama bazar atau acara">
          <Input placeholder="CFD South City" />
        </Field>
        <Field label="Lokasi" error="Lokasi wajib diisi">
          <Input />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal">
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label="Mulai">
            <TimeInput value={time} onChange={setTime} />
          </Field>
        </div>
        <Field label="Biaya booth">
          <RupiahInput value={cost} onChange={setCost} />
        </Field>
        <Field label="Status">
          <Select defaultValue="active">
            <option value="active">Aktif</option>
            <option value="cancelled">Batal</option>
          </Select>
        </Field>
        <Field label="Catatan">
          <Textarea />
        </Field>
      </Section>

      <Section title="Pilih beberapa tanggal">
        <MultiDatePicker value={dates} onChange={setDates} initialMonth="2026-10" />
      </Section>

      <Section title="Segmented, sheet, dialog, toast">
        <SegmentedControl
          label="Tampilan"
          value={view}
          onChange={setView}
          options={[
            { value: 'agenda', label: 'Agenda' },
            { value: 'kalender', label: 'Kalender' },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSheet(true)}>Buka sheet</Button>
          <Button onClick={() => setDialog(true)}>Buka dialog</Button>
          <Button onClick={() => toast.show('Event ditambahkan')}>Toast</Button>
          <Button onClick={() => toast.show("Event dihapus", { action: { label: 'Urungkan', onClick: () => {} }, ms: 5000 })}>Toast + undo</Button>
        </div>
      </Section>

      <Section title="Memuat">
        <SkeletonRows count={3} />
      </Section>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Tambah event" footer={<Button variant="primary" className="w-full" onClick={() => setSheet(false)}>Simpan</Button>}>
        <div className="flex flex-col gap-3">
          <Field label="Judul">
            <Input data-autofocus />
          </Field>
          <Field label="Biaya booth">
            <RupiahInput value={cost} onChange={setCost} />
          </Field>
        </div>
      </Sheet>
      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Hapus event?"
        message="Hapus 'CFD South City' 24 Okt? Pembayaran ikut terhapus."
        confirmLabel="Hapus"
        danger
        onConfirm={() => setDialog(false)}
      />
      <Toaster />
    </main>
  )
}
