import { useState, useSyncExternalStore } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { Toaster } from '../../components/ui/Toast'
import { adminApi, adminPb } from '../../lib/adminPb'
import { cn } from '../../lib/cn'

const subscribe = (cb: () => void) => adminPb.authStore.onChange(cb)

export function useAdminAuthed(): boolean {
  return useSyncExternalStore(subscribe, () => adminPb.authStore.isValid)
}

/** Admin pages: own query cache (never persisted to the device), auth guard, header with nav. */
export default function AdminShell() {
  const authed = useAdminAuthed()
  const navigate = useNavigate()
  const onBackup = useLocation().pathname.startsWith('/admin/backup')
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 0, refetchOnWindowFocus: true, gcTime: 0 } } }))
  if (!authed) return <Navigate to="/admin/login" replace />

  const tab = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-[44px] items-center border-b-2 px-1 text-sm font-medium transition-colors duration-150',
      isActive ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
    )

  return (
    <QueryClientProvider client={client}>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-20 border-b border-line bg-paper pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-2">
            <span className="text-base font-semibold">Panel admin</span>
            <button
              type="button"
              onClick={() => {
                adminApi.logout()
                client.clear()
                navigate('/admin/login', { replace: true })
              }}
              className="-mr-2 inline-flex min-h-[44px] items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-accent-wash hover:text-ink"
            >
              <LogOut size={18} strokeWidth={1.5} aria-hidden />
              Keluar
            </button>
          </div>
          <nav aria-label="Panel admin" className="mx-auto flex max-w-3xl gap-6 px-4">
            <NavLink to="/admin" className={() => tab({ isActive: !onBackup })} aria-current={onBackup ? undefined : 'page'}>
              Lapak
            </NavLink>
            <NavLink to="/admin/backup" className={tab}>
              Backup
            </NavLink>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  )
}
