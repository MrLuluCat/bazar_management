/** Normalize Indonesian numbers to digits starting with 62, or null if invalid. */
export function normalizePhone(raw: string): string | null {
  const s = raw.trim().replace(/[\s\-.()]/g, '')
  if (!/^\+?\d+$/.test(s)) return null
  let d = s.replace(/^\+/, '')
  if (d.startsWith('0062')) d = d.slice(2)
  else if (d.startsWith('0')) d = '62' + d.slice(1)
  else if (!d.startsWith('62')) d = '62' + d
  const national = d.slice(2)
  if (national.length < 8 || national.length > 13) return null
  return d
}

/** "6281234567890" -> "0812-3456-7890". */
export function formatPhone(normalized: string): string {
  const local = '0' + normalized.replace(/^62/, '')
  const parts = [local.slice(0, 4), local.slice(4, 8), local.slice(8)].filter(Boolean)
  return parts.join('-')
}

export const waLink = (normalized: string) => `https://wa.me/${normalized}`
export const telLink = (normalized: string) => `tel:+${normalized}`
