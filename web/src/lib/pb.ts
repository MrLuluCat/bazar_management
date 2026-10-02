import PocketBase from 'pocketbase'

export const pb = new PocketBase(window.location.origin)
pb.autoCancellation(false)

const GROUP_EMAIL = import.meta.env.VITE_GROUP_EMAIL

/** Passcode = password of the group user. Throws on any failure (caller shows "Kode salah"). */
export async function unlock(passcode: string): Promise<void> {
  await pb.collection('users').authWithPassword(GROUP_EMAIL, passcode)
}

export function lock(): void {
  pb.authStore.clear()
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
