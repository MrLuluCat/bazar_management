import { useSyncExternalStore } from 'react'
import { pb } from '../lib/pb'

const subscribe = (cb: () => void) => pb.authStore.onChange(cb)

export function useAuth(): { isAuthed: boolean } {
  const isAuthed = useSyncExternalStore(subscribe, () => pb.authStore.isValid)
  return { isAuthed }
}
