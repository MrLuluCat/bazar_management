import { useEffect, useState } from 'react'

type ToastItem = { id: number; msg: string; action?: { label: string; onClick: () => void }; ms: number }
type Opts = { action?: { label: string; onClick: () => void }; ms?: number }

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export const toast = {
  show(msg: string, opts: Opts = {}) {
    const item: ToastItem = { id: nextId++, msg, action: opts.action, ms: opts.ms ?? 4000 }
    items = [...items, item]
    emit()
    return item.id
  },
  dismiss(id: number) {
    items = items.filter((t) => t.id !== id)
    emit()
  },
}

function Item({ t }: { t: ToastItem }) {
  useEffect(() => {
    const timer = setTimeout(() => toast.dismiss(t.id), t.ms)
    return () => clearTimeout(timer)
  }, [t.id, t.ms])
  return (
    <div className="sheet-in pointer-events-auto flex items-center gap-3 rounded-md border border-line-strong bg-ink px-4 py-2.5 text-sm text-paper" style={{ boxShadow: 'var(--shadow-sheet)' }}>
      <span>{t.msg}</span>
      {t.action && (
        <button
          type="button"
          className="min-h-[44px] rounded-sm px-2 font-semibold underline underline-offset-4"
          onClick={() => {
            t.action!.onClick()
            toast.dismiss(t.id)
          }}
        >
          {t.action.label}
        </button>
      )}
    </div>
  )
}

/** Mount once near the root. aria-live so screen readers announce new toasts. */
export function Toaster() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => void listeners.delete(l)
  }, [])
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6"
    >
      {items.map((t) => (
        <Item key={t.id} t={t} />
      ))}
    </div>
  )
}
