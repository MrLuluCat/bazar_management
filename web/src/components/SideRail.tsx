import { NavLink } from 'react-router'
import { cn } from '../lib/cn'
import { NAV } from './BottomNav'

export function SideRail() {
  return (
    <nav aria-label="Utama" className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col gap-1 border-r border-line px-3 py-4 lg:flex">
      <span className="px-3 pb-4 text-xl font-semibold">Bazar</span>
      {NAV.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn('flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-medium', isActive ? 'bg-accent-wash text-accent' : 'text-ink hover:bg-accent-wash')
          }
        >
          <Icon size={20} strokeWidth={1.5} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
