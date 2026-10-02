export type Frequency = 'weekly' | 'biweekly' | 'monthly'

export const MAX_OCCURRENCES = 52

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** Includes start; `until` inclusive; capped at 52. Monthly skips months lacking the start day (no rollover). */
export function generateOccurrences(start: string, freq: Frequency, until: string): string[] {
  const [y, m, d] = start.split('-').map(Number)
  const out: string[] = []
  if (start > until) return out

  if (freq === 'monthly') {
    for (let k = 0; out.length < MAX_OCCURRENCES && k < 12 * 10; k++) {
      const first = new Date(Date.UTC(y, m - 1 + k, 1))
      const dim = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
      if (d > dim) continue
      const s = iso(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), d)))
      if (s > until) break
      out.push(s)
    }
    return out
  }

  const step = freq === 'weekly' ? 7 : 14
  for (let k = 0; out.length < MAX_OCCURRENCES; k++) {
    const s = iso(new Date(Date.UTC(y, m - 1, d + k * step)))
    if (s > until) break
    out.push(s)
  }
  return out
}
