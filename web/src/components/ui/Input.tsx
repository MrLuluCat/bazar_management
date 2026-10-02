import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export const controlClass =
  'w-full min-h-[44px] rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted ' +
  'transition-colors duration-150 focus-visible:border-accent disabled:opacity-50 aria-[invalid=true]:border-unpaid'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn(controlClass, className)} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...rest} className={cn(controlClass, 'py-2', className)} />
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={cn(controlClass, className)} />
}
