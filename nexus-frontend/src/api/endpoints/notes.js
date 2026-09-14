import { apiClient } from '../client'

export const notesApi = {
  list: () => apiClient.get('/notes'),
  get: (id) => apiClient.get(`/notes/${id}`),
  create: (data) => apiClient.post('/notes', data),
  update: (id, data) => apiClient.patch(`/notes/${id}`, data),
  remove: (id) => apiClient.delete(`/notes/${id}`),
}
