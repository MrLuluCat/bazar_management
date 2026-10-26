import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** 'sheet' = bottom sheet on mobile, modal ≥768px. 'center' = always a centered dialog. */
  variant?: 'sheet' | 'center'
  footer?: ReactNode
}

// Sheets can stack (a dialog over a form): #root stays inert until the last one closes.
let openSheets = 0

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function Sheet({ open, onClose, title, children, variant = 'sheet', footer }: Props) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const [dragY, setDragY] = useState(0)
  const dragStart = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    const scroll = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // The page behind the sheet is out of reach for pointer, keyboard and screen readers.
    const root = document.getElementById('root')
    openSheets++
    root?.setAttribute('inert', '')
    return () => {
      if (--openSheets === 0) root?.removeAttribute('inert')
      document.body.style.overflow = scroll
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panel.current) return
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const center = variant === 'center'

  return createPortal(
    <div className={cn('fixed inset-0 z-50 flex justify-center', center ? 'items-center p-4' : 'items-end md:items-center md:p-4')} onKeyDown={onKeyDown}>
      <div className="fade-in absolute inset-0" style={{ background: 'var(--overlay)' }} onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'sheet-in relative flex max-h-[92dvh] w-full flex-col border border-line bg-surface',
          center ? 'max-w-sm rounded-lg' : 'max-w-lg rounded-t-lg md:rounded-lg',
        )}
        style={{ boxShadow: 'var(--shadow-sheet)', transform: dragY ? `translateY(${dragY}px)` : undefined }}
      >
        {!center && (
          <div
            className="flex touch-none justify-center pt-2 md:hidden"
            onPointerDown={(e) => {
              dragStart.current = e.clientY
              ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (dragStart.current !== null) setDragY(Math.max(0, e.clientY - dragStart.current))
            }}
            onPointerUp={() => {
              const closing = dragY > 90
              dragStart.current = null
              setDragY(0)
              if (closing) onClose()
            }}
          >
            <span aria-hidden className="h-1 w-10 rounded-sm bg-line-strong" />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent-wash">
            <X size={20} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
        {footer && <div className="border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
