import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Panel', end: true },
  { to: '/tasks', label: 'Tareas', end: false },
  { to: '/lists', label: 'Listas', end: false },
]

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center gap-8">
          <span className="font-mono text-sm tracking-[0.35em] text-accent uppercase">Nexus</span>
          <nav className="flex items-center gap-1 font-mono text-xs tracking-[0.1em] uppercase">
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
        <div className="flex items-center gap-4 font-mono text-xs text-text-secondary">
          <span>{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="border border-border px-3 py-1 tracking-[0.1em] uppercase transition-colors hover:border-accent hover:text-accent"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
