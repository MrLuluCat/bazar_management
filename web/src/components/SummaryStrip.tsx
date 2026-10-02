import { formatRupiah } from '../lib/money'

type Props = { count: number; totalCost: number; totalRemaining: number }

export function SummaryStrip({ count, totalCost, totalRemaining }: Props) {
  const cell = (label: string, value: string) => (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="text-xs text-muted">{label}</span>
      <span className="num truncate text-base font-semibold">{value}</span>
    </div>
  )
  return (
    <div role="group" aria-label="Ringkasan bulan" className="flex gap-4 border-y border-line py-2">
      {cell('Event', String(count))}
      {cell('Total biaya', formatRupiah(totalCost))}
      {cell('Sisa', formatRupiah(totalRemaining))}
    </div>
  )
}
