import { Navigate, Outlet, useLocation } from 'react-router'
import { Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useOverlay } from '../hooks/useOverlay'
import { useWorkspace } from '../api/workspace'
import { BottomNav } from './BottomNav'
import { ContactFormHost } from './ContactFormHost'
import { EventFormHost } from './EventFormHost'
import { SideRail } from './SideRail'
import { Button } from './ui/Button'
import { Toaster } from './ui/Toast'

const CAN_ADD = (path: string) => path === '/' || path.startsWith('/event/')

export function AppShell() {
  const { isAuthed } = useAuth()
  const ws = useWorkspace()
  const { pathname } = useLocation()
  const { params, open } = useOverlay()
  if (!isAuthed) return <Navigate to="/unlock" replace />
  const sel = params.get('sel')
  const add = () => open('new', 'event', sel && pathname === '/' ? { date: sel } : {})
  return (
    <div className="flex min-h-dvh">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-[52px] items-center justify-between gap-3 border-b border-line bg-paper px-4 pt-[env(safe-area-inset-top)]">
          <span className="truncate text-base font-semibold">{ws.data?.name ?? ' '}</span>
          {CAN_ADD(pathname) && (
            <Button variant="primary" onClick={add} className="hidden lg:inline-flex">
              <Plus size={18} strokeWidth={1.5} aria-hidden />
              Tambah event
            </Button>
          )}
        </header>
        <main className="flex-1 px-4 pb-28 pt-4 lg:pb-8">
          <Outlet />
        </main>
      </div>
      {CAN_ADD(pathname) && (
        <button
          type="button"
          aria-label="Tambah event"
          onClick={add}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-accent-ink lg:hidden"
          style={{ boxShadow: 'var(--shadow-sheet)' }}
        >
          <Plus size={26} strokeWidth={1.5} aria-hidden />
        </button>
      )}
      <BottomNav />
      <EventFormHost />
      <ContactFormHost />
      <Toaster />
    </div>
  )
}
