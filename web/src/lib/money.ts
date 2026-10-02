export function formatRupiah(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}Rp ${Math.abs(Math.trunc(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

/** Digits-only parse: "Rp 1.250.000" -> 1250000. Anything non-numeric -> 0. */
export function parseRupiah(s: string): number {
  const digits = s.replace(/\D/g, '')
  return digits ? parseInt(digits, 10) : 0
}
