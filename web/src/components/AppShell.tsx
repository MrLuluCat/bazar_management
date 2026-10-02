import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useWorkspace } from '../api/workspace'
import { BottomNav } from './BottomNav'
import { SideRail } from './SideRail'
import { Toaster } from './ui/Toast'

export function AppShell() {
  const { isAuthed } = useAuth()
  const ws = useWorkspace()
  if (!isAuthed) return <Navigate to="/unlock" replace />
  return (
    <div className="flex min-h-dvh">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-[52px] items-center justify-between gap-3 border-b border-line bg-paper px-4 pt-[env(safe-area-inset-top)]">
          <span className="truncate text-base font-semibold">{ws.data?.name ?? ' '}</span>
        </header>
        <main className="flex-1 px-4 pb-28 pt-4 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <Toaster />
    </div>
  )
}
