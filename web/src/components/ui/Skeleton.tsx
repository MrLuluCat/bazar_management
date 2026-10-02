import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton h-4', className)} />
}

/** List placeholder: rows shaped like EventRow, never a spinner. */
export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Memuat" className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-14 w-12" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="w-2/3" />
            <Skeleton className="w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
