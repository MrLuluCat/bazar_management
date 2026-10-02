import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { del, get, set } from 'idb-keyval'

export const PERSIST_KEY = 'bazar-rq'
const DAY = 24 * 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 7 * DAY, retry: 1, refetchOnWindowFocus: false } },
})

/** Persists the query cache to IndexedDB so the last loaded months render instantly, even offline. */
export const persister = createAsyncStoragePersister({
  key: PERSIST_KEY,
  storage: {
    getItem: (k) => get<string>(k).then((v) => v ?? null),
    setItem: (k, v) => set(k, v),
    removeItem: (k) => del(k),
  },
})

export const MAX_AGE = 7 * DAY

/** Lock: contact phones must not linger on a shared device. */
export async function clearLocalData(): Promise<void> {
  await sweep()
  // Requests that were already in flight when the user locked can still land in the SW cache: sweep again.
  setTimeout(() => void sweep(), 1500)
}

async function sweep(): Promise<void> {
  await queryClient.cancelQueries()
  queryClient.clear()
  try {
    await del(PERSIST_KEY)
  } catch {
    /* IndexedDB unavailable */
  }
  try {
    if (typeof caches !== 'undefined') {
      await caches.delete('api-v1')
      await caches.delete('files-v1')
    }
  } catch {
    /* Cache API unavailable */
  }
}
