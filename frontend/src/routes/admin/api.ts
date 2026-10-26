import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../lib/adminPb'

export const useLapakList = () => useQuery({ queryKey: ['admin', 'lapak'], queryFn: adminApi.list })
export const useBackups = () => useQuery({ queryKey: ['admin', 'backups'], queryFn: adminApi.backups })

/** "Lapak Rina!" -> "lapak-rina" (same rule as the server). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Readable random passcode, e.g. "kopi-mangga-4821" (~20 bits; login is rate-limited to 5 tries a minute). */
export function randomPasscode(): string {
  const words = ['kopi', 'kue', 'teh', 'roti', 'sate', 'jamu', 'bakso', 'donat', 'pisang', 'mangga']
  const n = crypto.getRandomValues(new Uint32Array(3))
  return `${words[n[0] % words.length]}-${words[n[1] % words.length]}-${String(1000 + (n[2] % 9000))}`
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Message an admin can paste into WhatsApp for the lapak's members. */
export function shareText(name: string, url: string, passcode?: string): string {
  return [`${name}`, `Buka: ${url}`, passcode ? `Kode akses: ${passcode}` : ''].filter(Boolean).join('\n')
}
