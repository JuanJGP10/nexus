import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { authApi } from '../api/endpoints/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!apiClient.getToken()) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      setUser(await authApi.me())
    } catch {
      apiClient.clearToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    apiClient.onUnauthorized = () => setUser(null)
    loadUser()
    return () => {
      apiClient.onUnauthorized = null
    }
  }, [loadUser])

  const login = useCallback(
    async (email, password) => {
      const { access_token: accessToken } = await authApi.login(email, password)
      apiClient.setToken(accessToken)
      await loadUser()
    },
    [loadUser],
  )

  const logout = useCallback(() => {
    apiClient.clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
