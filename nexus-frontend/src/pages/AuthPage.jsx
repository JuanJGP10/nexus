import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AuthPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-mono text-xs tracking-[0.4em] text-accent uppercase">Nexus</p>
          <p className="mt-1 font-mono text-[11px] tracking-[0.2em] text-text-secondary uppercase">
            Panel de acceso
          </p>
        </div>

        <div className="hud-panel">
          <span className="hud-corner-bl" />
          <span className="hud-corner-br" />

          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
                {error}
              </p>
            )}

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.15em] text-text-secondary uppercase">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>

            <label className="block">
              <span className="font-mono text-[11px] tracking-[0.15em] text-text-secondary uppercase">
                Contraseña
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent px-3 py-2 font-mono text-xs tracking-[0.15em] text-accent-contrast uppercase transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isSubmitting ? 'Procesando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
