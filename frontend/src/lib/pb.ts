import PocketBase from 'pocketbase'
import { clearLocalData } from './queryClient'

// VITE_PB_URL = backend URL, only if the API lives on another host. Empty = same origin (PocketBase serves the app; dev proxies /api to :8090).
export const pb = new PocketBase(import.meta.env.VITE_PB_URL || window.location.origin)
pb.autoCancellation(false)

const GROUP_EMAIL = import.meta.env.VITE_GROUP_EMAIL

/** Passcode = password of the group user. Throws on any failure (caller shows "Kode salah"). */
export async function unlock(passcode: string): Promise<void> {
  await pb.collection('users').authWithPassword(GROUP_EMAIL, passcode)
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
