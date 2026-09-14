import { apiClient } from '../client'

export const dayListsApi = {
  /** Sin `date`, devuelve las listas sueltas (sección "Listas"); con `date`, las del calendario. */
  list: (date) => apiClient.get('/day-lists', { query: { date } }),
  listDates: () => apiClient.get('/day-lists/dates'),
  create: (date, title) => apiClient.post('/day-lists', { date, title }),
  update: (id, data) => apiClient.patch(`/day-lists/${id}`, data),
  remove: (id) => apiClient.delete(`/day-lists/${id}`),

  addItem: (listId, text) => apiClient.post(`/day-lists/${listId}/items`, { text }),
  updateItem: (listId, itemId, data) => apiClient.patch(`/day-lists/${listId}/items/${itemId}`, data),
  removeItem: (listId, itemId) => apiClient.delete(`/day-lists/${listId}/items/${itemId}`),
}
