import { useNavigate, useSearchParams } from 'react-router'

/** URL-state overlays (?new=event, ?edit=:id) so the Back button closes them. */
export function useOverlay() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const open = (key: 'new' | 'edit' | 'editContact', value: string, extra: Record<string, string> = {}) => {
    const p = new URLSearchParams(params)
    p.set(key, value)
    for (const [k, v] of Object.entries(extra)) p.set(k, v)
    setParams(p)
  }

  /** Remove overlay params. Goes back when the overlay was pushed on top of this page; else replaces. */
  const close = () => {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
      return
    }
    const p = new URLSearchParams(params)
    for (const k of ['new', 'edit', 'editContact', 'date']) p.delete(k)
    setParams(p, { replace: true })
  }

  return { params, open, close }
}
