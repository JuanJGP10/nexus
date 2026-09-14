import { useEffect, useState } from 'react'
import { dayListsApi } from '../api/endpoints/dayLists'

/** Estado + mutaciones de listas contra la API, opcionalmente ancladas a una fecha. */
export function useDayLists(dateKey) {
  const [lists, setLists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setIsLoading(true)
    try {
      setLists(await dayListsApi.list(dateKey))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey])

  async function addList() {
    try {
      const created = await dayListsApi.create(dateKey, 'Nueva lista')
      setLists((current) => [...current, created])
    } catch (err) {
      setError(err.message)
    }
  }

  async function renameList(listId, title) {
    try {
      const updated = await dayListsApi.update(listId, { title })
      setLists((current) => current.map((list) => (list.id === listId ? updated : list)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeList(listId) {
    try {
      await dayListsApi.remove(listId)
      setLists((current) => current.filter((list) => list.id !== listId))
    } catch (err) {
      setError(err.message)
    }
  }

  async function addItem(listId, text) {
    try {
      const item = await dayListsApi.addItem(listId, text)
      setLists((current) =>
        current.map((list) => (list.id === listId ? { ...list, items: [...list.items, item] } : list)),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateItem(listId, itemId, fields) {
    try {
      const updated = await dayListsApi.updateItem(listId, itemId, fields)
      setLists((current) =>
        current.map((list) =>
          list.id === listId
            ? { ...list, items: list.items.map((item) => (item.id === itemId ? updated : item)) }
            : list,
        ),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeItem(listId, itemId) {
    try {
      await dayListsApi.removeItem(listId, itemId)
      setLists((current) =>
        current.map((list) =>
          list.id === listId ? { ...list, items: list.items.filter((item) => item.id !== itemId) } : list,
        ),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  return {
    lists,
    isLoading,
    error,
    addList,
    renameList,
    removeList,
    addItem,
    toggleItem: (listId, item) => updateItem(listId, item.id, { is_done: !item.is_done }),
    editItemText: (listId, itemId, text) => updateItem(listId, itemId, { text }),
    removeItem,
  }
}
