import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { controlClass } from './Input'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string
  onChange: (v: string) => void
}

/** HH:mm text value; empty string = not set. */
export function TimeInput({ value, onChange, className, ...rest }: Props) {
  return <input {...rest} type="time" value={value} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, 'num', className)} />
}
