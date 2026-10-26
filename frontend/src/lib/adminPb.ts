import PocketBase, { LocalAuthStore } from 'pocketbase'

// Separate client + auth store for the admin panel, so an admin session never mixes with a lapak session.
export const adminPb = new PocketBase(import.meta.env.VITE_PB_URL || window.location.origin, new LocalAuthStore('pb_admin'))
adminPb.autoCancellation(false)

export type AdminLapak = { id: string; name: string; slug: string; created: string; events: number; contacts: number }
export type Backup = { name: string; size: number; modified: string }

/** Server error message (Indonesian, from the hooks) or a generic fallback. */
export function errorMessage(e: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  const err = e as { status?: number; response?: { message?: string } }
  if (err?.status === 0) return 'Tidak ada koneksi ke server.'
  if (err?.status === 429) return 'Terlalu banyak percobaan. Tunggu satu menit.'
  return err?.response?.message || fallback
}

export const adminApi = {
  setupNeeded: () => adminPb.send<{ needed: boolean }>('/api/admin/setup', {}),
  setup: (body: { token: string; email: string; password: string }) => adminPb.send('/api/admin/setup', { method: 'POST', body }),
  login: (email: string, password: string) => adminPb.collection('admins').authWithPassword(email, password),
  logout: () => adminPb.authStore.clear(),

  list: () => adminPb.send<{ items: AdminLapak[] }>('/api/admin/lapak', {}).then((r) => r.items),
  create: (body: { name: string; slug: string; passcode: string }) => adminPb.send<AdminLapak>('/api/admin/lapak', { method: 'POST', body }),
  rename: (id: string, name: string) => adminPb.send<AdminLapak>(`/api/admin/lapak/${id}`, { method: 'PATCH', body: { name } }),
  passcode: (id: string, passcode: string) => adminPb.send(`/api/admin/lapak/${id}/passcode`, { method: 'POST', body: { passcode } }),
  clear: (id: string, confirm: string) =>
    adminPb.send<AdminLapak & { backup: string }>(`/api/admin/lapak/${id}/clear`, { method: 'POST', body: { confirm } }),
  remove: (id: string, confirm: string) => adminPb.send<{ backup: string }>(`/api/admin/lapak/${id}`, { method: 'DELETE', body: { confirm } }),

  backups: () => adminPb.send<{ items: Backup[]; canRestore: boolean }>('/api/admin/backups', {}),
  createBackup: () => adminPb.send<{ name: string }>('/api/admin/backups', { method: 'POST' }),
  restore: (name: string) => adminPb.send(`/api/admin/backups/${encodeURIComponent(name)}/restore`, { method: 'POST', body: { confirm: 'pulihkan' } }),
}
