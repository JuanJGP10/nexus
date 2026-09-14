import { apiClient } from '../client'

export const authApi = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }, { auth: false }),
  me: () => apiClient.get('/auth/me'),
}
