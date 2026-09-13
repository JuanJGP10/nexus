import { apiClient } from '../client'

export const tasksApi = {
  list: (params) => apiClient.get('/tasks', { query: params }),
  listTrash: () => apiClient.get('/tasks/trash'),
  get: (id) => apiClient.get(`/tasks/${id}`),
  create: (data) => apiClient.post('/tasks', data),
  update: (id, data) => apiClient.patch(`/tasks/${id}`, data),
  trash: (id) => apiClient.delete(`/tasks/${id}`),
  restore: (id) => apiClient.post(`/tasks/${id}/restore`),
  remove: (id) => apiClient.delete(`/tasks/${id}/permanent`),

  addSubtask: (taskId, title) => apiClient.post(`/tasks/${taskId}/subtasks`, { title }),
  updateSubtask: (taskId, subtaskId, data) =>
    apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
  removeSubtask: (taskId, subtaskId) =>
    apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
}
