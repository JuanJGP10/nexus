import { apiClient } from '../client'

export const filesApi = {
  list: (params) => apiClient.get('/files', { query: params }),
  listTrash: () => apiClient.get('/files/trash'),
  search: (q, includeTrashed = false) =>
    apiClient.get('/files/search', { query: { q, include_trashed: includeTrashed } }),
  get: (id) => apiClient.get(`/files/${id}`),
  upload: (file, { folderId, taskId, dayListItemId } = {}) => {
    const formData = new FormData()
    formData.append('upload', file)
    if (folderId) formData.append('folder_id', folderId)
    if (taskId) formData.append('task_id', taskId)
    if (dayListItemId) formData.append('day_list_item_id', dayListItemId)
    return apiClient.upload('/files', formData)
  },
  update: (id, data) => apiClient.patch(`/files/${id}`, data),
  /** Duplica el archivo dentro de `folderId` (null = raíz). El backend renombra si choca. */
  copy: (id, folderId) => apiClient.post(`/files/${id}/copy`, { folder_id: folderId ?? null }),
  trash: (id) => apiClient.delete(`/files/${id}`),
  restore: (id) => apiClient.post(`/files/${id}/restore`),
  remove: (id) => apiClient.delete(`/files/${id}/permanent`),
  emptyTrash: () => apiClient.delete('/files/trash'),
  download: (id) => apiClient.download(`/files/${id}/download`),
}
