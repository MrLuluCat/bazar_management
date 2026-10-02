import { useEffect, useRef } from 'react'

/** Desktop keyboard shortcuts: n, ArrowLeft/Right, t, / … Ignored while typing, with modifiers, or with a dialog open. */
export function useShortcuts(handlers: Record<string, () => void>) {
  const ref = useRef(handlers)
  ref.current = handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      const fn = ref.current[e.key]
      if (!fn) return
      e.preventDefault()
      fn()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
