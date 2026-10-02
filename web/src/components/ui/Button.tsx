import type { ButtonHTMLAttributes } from 'react'
import { useOnline } from '../../hooks/useOnline'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink border-transparent hover:brightness-110',
  secondary: 'bg-surface text-ink border-line-strong hover:bg-accent-wash',
  danger: 'bg-surface text-unpaid border-unpaid hover:bg-unpaid hover:text-paper',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-accent-wash',
}

export const buttonClass = (variant: Variant = 'secondary', extra?: string) =>
  cn(
    'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium no-underline transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-50',
    styles[variant],
    extra,
  )

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  /** Why the button is disabled (shown as tooltip), e.g. offline. */
  disabledReason?: string
  /** Writes need network: disabled with a tooltip while offline. */
  write?: boolean
}

export function Button({ variant = 'secondary', loading, disabled, disabledReason, write, className, children, title, ...rest }: ButtonProps) {
  const online = useOnline()
  const offline = !!write && !online
  const off = disabled || loading || offline
  return (
    <button
      type="button"
      {...rest}
      disabled={off}
      aria-busy={loading || undefined}
      title={offline ? 'Butuh koneksi internet' : off && disabledReason ? disabledReason : title}
      className={buttonClass(variant, className)}
    >
      {children}
    </button>
  )
}
