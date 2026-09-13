import { apiClient } from '../client'

export const filesApi = {
  list: (params) => apiClient.get('/files', { query: params }),
  listTrash: () => apiClient.get('/files/trash'),
  search: (q, includeTrashed = false) =>
    apiClient.get('/files/search', { query: { q, include_trashed: includeTrashed } }),
  get: (id) => apiClient.get(`/files/${id}`),
  upload: (file, { folderId, taskId } = {}) => {
    const formData = new FormData()
    formData.append('upload', file)
    if (folderId) formData.append('folder_id', folderId)
    if (taskId) formData.append('task_id', taskId)
    return apiClient.upload('/files', formData)
  },
  update: (id, data) => apiClient.patch(`/files/${id}`, data),
  trash: (id) => apiClient.delete(`/files/${id}`),
  restore: (id) => apiClient.post(`/files/${id}/restore`),
  remove: (id) => apiClient.delete(`/files/${id}/permanent`),
  download: (id) => apiClient.download(`/files/${id}/download`),
}
