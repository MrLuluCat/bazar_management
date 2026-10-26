import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeKind = 'gratis' | 'belum' | 'dp' | 'lunas' | 'batal'

const label: Record<BadgeKind, string> = { gratis: 'Gratis', belum: 'Belum bayar', dp: 'DP', lunas: 'Lunas', batal: 'Batal' }
const tone: Record<BadgeKind, string> = {
  gratis: 'text-muted border-line-strong',
  belum: 'text-unpaid border-unpaid',
  dp: 'text-partial border-partial',
  lunas: 'text-paid border-paid',
  batal: 'text-muted border-line-strong',
}

/** Shape icons so status never relies on color alone: ○ belum, ◐ dp, ● lunas, — gratis, × batal. */
function Shape({ kind }: { kind: BadgeKind }): ReactNode {
  const p = { width: 12, height: 12, viewBox: '0 0 12 12', 'aria-hidden': true as const, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
  switch (kind) {
    case 'belum':
      return <svg {...p}><circle cx="6" cy="6" r="4.25" /></svg>
    case 'dp':
      return (
        <svg {...p}>
          <circle cx="6" cy="6" r="4.25" />
          <path d="M6 1.75a4.25 4.25 0 0 1 0 8.5Z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'lunas':
      return <svg {...p}><circle cx="6" cy="6" r="4.25" fill="currentColor" /></svg>
    case 'gratis':
      return <svg {...p}><path d="M2.5 6h7" /></svg>
    case 'batal':
      return <svg {...p}><path d="M3 3l6 6M9 3L3 9" /></svg>
  }
}

export function Badge({ kind, children, className }: { kind: BadgeKind; children?: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium', tone[kind], className)}>
      <Shape kind={kind} />
      {children ?? label[kind]}
    </span>
  )
}
