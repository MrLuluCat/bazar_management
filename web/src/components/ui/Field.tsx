import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = { label: string; error?: string; hint?: string; children: ReactElement<Record<string, unknown>>; className?: string }

/** Label above the control, error below in plain Indonesian. Wires id / aria-describedby into the child. */
export function Field({ label, error, hint, children, className }: Props) {
  const id = useId()
  const msgId = `${id}-msg`
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? msgId : undefined,
      })
    : (children as ReactNode)
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {control}
      {(error || hint) && (
        <p id={msgId} className={cn('text-xs', error ? 'text-unpaid' : 'text-muted')} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
