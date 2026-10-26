import PocketBase from 'pocketbase'
import { getLapak } from './lapak'
import { clearLocalData } from './queryClient'

// VITE_PB_URL = backend URL, only if the API lives on another host. Empty = same origin (PocketBase serves the app; dev proxies /api to :8090).
export const pb = new PocketBase(import.meta.env.VITE_PB_URL || window.location.origin)
pb.autoCancellation(false)

/** Passcode = password of the remembered lapak's group user. Throws on any failure (caller shows "Kode salah"). */
export async function unlock(passcode: string): Promise<void> {
  const lapak = getLapak()
  if (!lapak) throw new Error('no lapak')
  await pb.collection('users').authWithPassword(lapak.email, passcode)
}

export function lock(): void {
  pb.authStore.clear()
  void clearLocalData()
}

/** Refresh the stored token on app start. Returns whether the session is (still) valid. */
export async function refreshAuth(): Promise<boolean> {
  if (!pb.authStore.isValid) {
    pb.authStore.clear()
    return false
  }
  try {
    await pb.collection('users').authRefresh()
    return true
  } catch (e) {
    // Offline: keep the (locally valid) session so cached data stays readable.
    if ((e as { status?: number }).status === 0) return true
    pb.authStore.clear()
    return false
  }
}
