import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink border-transparent hover:brightness-110',
  secondary: 'bg-surface text-ink border-line-strong hover:bg-accent-wash',
  danger: 'bg-surface text-unpaid border-unpaid hover:bg-unpaid hover:text-paper',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-accent-wash',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  /** Why the button is disabled (shown as tooltip), e.g. offline. */
  disabledReason?: string
}

export function Button({ variant = 'secondary', loading, disabled, disabledReason, className, children, title, ...rest }: ButtonProps) {
  const off = disabled || loading
  return (
    <button
      type="button"
      {...rest}
      disabled={off}
      aria-busy={loading || undefined}
      title={off && disabledReason ? disabledReason : title}
      className={cn(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}
