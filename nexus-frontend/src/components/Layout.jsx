import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <span className="font-semibold text-gray-900">Nexus</span>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
