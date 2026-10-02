import { formatDateLabel } from '../lib/dates'
import { generateOccurrences, MAX_OCCURRENCES, type Frequency } from '../lib/recurrence'
import { DatePicker } from './ui/DatePicker'
import { Field } from './ui/Field'
import { Select } from './ui/Input'

export type RepeatValue = { enabled: boolean; freq: Frequency; until: string; excluded: string[] }

export const emptyRepeat: RepeatValue = { enabled: false, freq: 'weekly', until: '', excluded: [] }

/** Occurrences before the 52 cap is applied is not exposed; this is what gets saved. */
export function selectedDates(start: string, v: RepeatValue): string[] {
  if (!v.enabled || !v.until) return []
  return generateOccurrences(start, v.freq, v.until).filter((d) => !v.excluded.includes(d))
}

type Props = { startDate: string; value: RepeatValue; onChange: (v: RepeatValue) => void; error?: string }

export function RepeatFields({ startDate, value, onChange, error }: Props) {
  const all = value.enabled && value.until ? generateOccurrences(startDate, value.freq, value.until) : []
  const capped = all.length >= MAX_OCCURRENCES
  const toggle = (d: string) =>
    onChange({ ...value, excluded: value.excluded.includes(d) ? value.excluded.filter((x) => x !== d) : [...value.excluded, d] })

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-[44px] items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="h-5 w-5 accent-[var(--accent)]"
        />
        Ulangi
      </label>
      {value.enabled && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Frekuensi">
              <Select value={value.freq} onChange={(e) => onChange({ ...value, freq: e.target.value as Frequency, excluded: [] })}>
                <option value="weekly">Tiap minggu</option>
                <option value="biweekly">2 minggu sekali</option>
                <option value="monthly">Tiap bulan</option>
              </Select>
            </Field>
            <Field label="Sampai tanggal" error={error}>
              <DatePicker value={value.until} onChange={(until) => onChange({ ...value, until, excluded: [] })} />
            </Field>
          </div>
          {all.length > 0 && (
            <fieldset className="rounded-lg border border-line p-3">
              <legend className="px-1 text-sm font-medium">{selectedDates(startDate, value).length} tanggal akan dibuat</legend>
              <ul className="flex max-h-48 flex-col overflow-y-auto">
                {all.map((d) => (
                  <li key={d}>
                    <label className="num flex min-h-[44px] items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={!value.excluded.includes(d)}
                        onChange={() => toggle(d)}
                        className="h-5 w-5 accent-[var(--accent)]"
                      />
                      {formatDateLabel(d)}
                    </label>
                  </li>
                ))}
              </ul>
              {capped && <p className="pt-2 text-xs text-muted">Maksimal {MAX_OCCURRENCES} kali. Tanggal selanjutnya tidak dibuat.</p>}
            </fieldset>
          )}
        </>
      )}
    </div>
  )
}
