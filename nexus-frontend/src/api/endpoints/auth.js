import { apiClient } from '../client'

export const authApi = {
  register: (email, password) =>
    apiClient.post('/auth/register', { email, password }, { auth: false }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }, { auth: false }),
  me: () => apiClient.get('/auth/me'),
}
