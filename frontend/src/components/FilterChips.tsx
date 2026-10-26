import type { Chip } from '../lib/agenda'
import { cn } from '../lib/cn'

const CHIPS: { value: Chip; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'akan', label: 'Akan datang' },
  { value: 'belum', label: 'Belum lunas' },
]

export function FilterChips({ value, onChange }: { value: Chip; onChange: (c: Chip) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
      {CHIPS.map((c) => (
        <button
          key={c.value}
          type="button"
          aria-pressed={value === c.value}
          onClick={() => onChange(c.value)}
          className={cn(
            'min-h-[44px] rounded-md border px-3 text-sm font-medium transition-colors duration-150',
            value === c.value ? 'border-accent bg-accent-wash text-accent' : 'border-line-strong text-ink hover:bg-accent-wash',
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}
