import { NavLink } from 'react-router'
import { CalendarDays, Settings, Users } from 'lucide-react'
import { cn } from '../lib/cn'

export const NAV = [
  { to: '/', label: 'Agenda', Icon: CalendarDays, end: true },
  { to: '/contacts', label: 'Kontak', Icon: Users, end: false },
  { to: '/settings', label: 'Pengaturan', Icon: Settings, end: false },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Utama"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {NAV.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn('flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium', isActive ? 'text-accent' : 'text-muted')
          }
        >
          <Icon size={22} strokeWidth={1.5} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
