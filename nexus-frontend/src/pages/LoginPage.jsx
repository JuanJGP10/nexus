import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
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
      navigate('/tasks')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Entrar</h1>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <label className="block text-sm">
          <span className="text-gray-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="text-gray-700">Contraseña</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-3 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-gray-600">
          ¿No tienes cuenta? <Link to="/register" className="text-gray-900 underline">Regístrate</Link>
        </p>
      </form>
    </div>
  )
}
