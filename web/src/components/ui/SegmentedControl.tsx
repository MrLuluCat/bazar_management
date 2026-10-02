import { cn } from '../../lib/cn'

type Option<T extends string> = { value: T; label: string }

export function SegmentedControl<T extends string>({
  value, onChange, options, label,
}: { value: T; onChange: (v: T) => void; options: Option<T>[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit self-start rounded-md border border-line-strong bg-surface p-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-[40px] min-w-[44px] rounded-sm px-3 text-sm font-medium transition-colors duration-150',
              on ? 'bg-accent text-accent-ink' : 'text-ink hover:bg-accent-wash',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
