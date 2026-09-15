import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ThemeSwitcher } from './ThemeSwitcher'

const NAV_ITEMS = [
  { to: '/', label: 'Panel', end: true, icon: PanelIcon },
  { to: '/tasks', label: 'Tareas', end: false, icon: TasksIcon },
  { to: '/lists', label: 'Listas', end: false, icon: ListsIcon },
  { to: '/schedule', label: 'Horario', end: false, icon: ScheduleIcon },
]

function PanelIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="2.5" width="6" height="15" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="11.5" y="2.5" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function TasksIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3.5 5h13M3.5 10h13M3.5 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="3.5" cy="5" r="0" fill="none" />
    </svg>
  )
}

function ListsIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function ScheduleIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="3.5" width="15" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 7.5h15M6.5 2v3M13.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6 11h2M10 11h2M6 14h2M10 14h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <span className="font-mono text-sm tracking-[0.35em] text-accent uppercase">Nexus</span>
          <nav className="hidden items-center gap-1 font-mono text-xs tracking-[0.1em] uppercase sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 transition-colors ${
                    isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-text-secondary sm:gap-4">
          <span className="hidden max-w-40 truncate sm:inline">{user?.email}</span>
          <ThemeSwitcher />
          <button
            type="button"
            onClick={logout}
            className="border border-border px-3 py-1.5 tracking-[0.1em] uppercase transition-colors hover:border-accent hover:text-accent"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto p-3 pb-20 sm:p-6 sm:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
