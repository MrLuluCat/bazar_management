import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { parseRupiah } from '../../lib/money'
import { controlClass } from './Input'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'inputMode'> & {
  value: number
  onChange: (n: number) => void
}

const group = (n: number) => (n === 0 ? '' : n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'))

/** Integer rupiah field with live thousands separators. Pass `id` via <Field>. */
export function RupiahInput({ value, onChange, className, ...rest }: Props) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
        Rp
      </span>
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={group(value)}
        onChange={(e) => onChange(parseRupiah(e.target.value))}
        className={cn(controlClass, 'num pl-9 text-right', className)}
      />
    </div>
  )
}
