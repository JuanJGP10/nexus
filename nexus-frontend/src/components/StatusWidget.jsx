import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Panel } from './Panel'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

export function StatusWidget() {
  const { user } = useAuth()
  const now = useClock()

  return (
    <Panel title="Sistema">
      <div className="space-y-4 p-4">
        <div>
          <p className="font-mono text-3xl tabular-nums text-accent">
            {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="font-mono text-xs tracking-[0.1em] text-text-secondary uppercase">
            {now.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>

        <div className="border-t border-border pt-3">
          <p className="font-mono text-[11px] tracking-[0.15em] text-text-secondary uppercase">Operador</p>
          <p className="mt-1 truncate text-sm text-text-primary">{user?.email}</p>
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="font-mono text-[11px] tracking-[0.15em] text-text-secondary uppercase">
            Conexión estable
          </span>
        </div>
      </div>
    </Panel>
  )
}
