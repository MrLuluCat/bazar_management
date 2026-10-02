export type View = 'agenda' | 'kalender'
const KEY = 'bazar.view'

export function getView(): View {
  try {
    return localStorage.getItem(KEY) === 'kalender' ? 'kalender' : 'agenda'
  } catch {
    return 'agenda'
  }
}

export function setView(v: View) {
  try {
    localStorage.setItem(KEY, v)
  } catch {
    /* storage may be blocked */
  }
}
