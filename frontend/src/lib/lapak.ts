// The lapak this device logs into, remembered from its link (/l/:slug). Not secret: name + internal login email.

export type Lapak = { slug: string; name: string; email: string }

const KEY = 'bazar.lapak'

export function getLapak(): Lapak | null {
  try {
    const raw = localStorage.getItem(KEY)
    const v = raw ? (JSON.parse(raw) as Lapak) : null
    return v && v.slug && v.email ? v : null
  } catch {
    return null
  }
}

export function setLapak(l: Lapak): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(l))
  } catch {
    /* storage blocked: the link must be opened again next time */
  }
}

/** Looks up a lapak by its link slug. Returns null when it does not exist. */
export async function fetchLapak(slug: string): Promise<Lapak | null> {
  const base = import.meta.env.VITE_PB_URL || ''
  const res = await fetch(`${base}/api/lapak/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(String(res.status))
  return (await res.json()) as Lapak
}

/** All lapak for the start-screen picker (name + link slug). */
export async function fetchLapakList(): Promise<Pick<Lapak, 'name' | 'slug'>[]> {
  const base = import.meta.env.VITE_PB_URL || ''
  const res = await fetch(`${base}/api/lapak`)
  if (!res.ok) throw new Error(String(res.status))
  return ((await res.json()) as { items: Pick<Lapak, 'name' | 'slug'>[] }).items
}

export function forgetLapak(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage blocked */
  }
}

export function lapakUrl(slug: string): string {
  return `${window.location.origin}/l/${slug}`
}
