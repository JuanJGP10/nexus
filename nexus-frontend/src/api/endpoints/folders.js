import { apiClient } from '../client'

export const foldersApi = {
  list: (parentId) => apiClient.get('/folders', { query: { parent_id: parentId } }),
  get: (id) => apiClient.get(`/folders/${id}`),
  /** Ancestros de la carpeta, de la raíz hacia abajo. Para reconstruir las migas de pan. */
  path: (id) => apiClient.get(`/folders/${id}/path`),
  create: (data) => apiClient.post('/folders', data),
  update: (id, data) => apiClient.patch(`/folders/${id}`, data),
  /** Copia recursiva (subcarpetas + archivos) dentro de `parentId` (null = raíz). */
  copy: (id, parentId) => apiClient.post(`/folders/${id}/copy`, { parent_id: parentId ?? null }),
  remove: (id, { recursive = false } = {}) =>
    apiClient.delete(`/folders/${id}`, { query: { recursive: recursive ? 'true' : undefined } }),
}
