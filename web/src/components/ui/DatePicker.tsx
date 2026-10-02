import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { controlClass } from './Input'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string
  onChange: (v: string) => void
}

/** 'YYYY-MM-DD' text value. Native picker keeps the phone's own calendar sheet. */
export function DatePicker({ value, onChange, className, ...rest }: Props) {
  return <input {...rest} type="date" value={value} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, 'num', className)} />
}
