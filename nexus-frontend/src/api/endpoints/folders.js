import { apiClient } from '../client'

export const foldersApi = {
  list: (parentId) => apiClient.get('/folders', { query: { parent_id: parentId } }),
  get: (id) => apiClient.get(`/folders/${id}`),
  create: (data) => apiClient.post('/folders', data),
  update: (id, data) => apiClient.patch(`/folders/${id}`, data),
  remove: (id) => apiClient.delete(`/folders/${id}`),
}
