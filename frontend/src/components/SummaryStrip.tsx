import { formatRupiah } from '../lib/money'

type Props = { count: number; totalCost: number; totalRemaining: number }

export function SummaryStrip({ count, totalCost, totalRemaining }: Props) {
  // Money never truncates: the count column stays narrow so both amounts fit at 320 px.
  const cell = (label: string, value: string, grow = true) => (
    <div className={grow ? 'flex min-w-0 flex-1 flex-col' : 'flex shrink-0 flex-col'}>
      <span className="text-xs text-muted">{label}</span>
      <span className="num whitespace-nowrap text-base font-semibold">{value}</span>
    </div>
  )
  return (
    <div role="group" aria-label="Ringkasan bulan" className="flex gap-4 border-y border-line py-2">
      {cell('Event', String(count), false)}
      {cell('Total biaya', formatRupiah(totalCost))}
      {cell('Sisa', formatRupiah(totalRemaining))}
    </div>
  )
}
