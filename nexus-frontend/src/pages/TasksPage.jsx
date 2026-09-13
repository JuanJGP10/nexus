import { useEffect, useState } from 'react'
import { tasksApi } from '../api/endpoints/tasks'

export function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadTasks() {
    setIsLoading(true)
    try {
      setTasks(await tasksApi.list())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    if (!title.trim()) return
    try {
      await tasksApi.create({ title })
      setTitle('')
      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleDone(task) {
    try {
      await tasksApi.update(task.id, { is_done: !task.is_done })
      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleTrash(taskId) {
    try {
      await tasksApi.trash(taskId)
      await loadTasks()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Tareas</h1>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          placeholder="Nueva tarea…"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
        />
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800">
          Añadir
        </button>
      </form>

      {isLoading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500">Sin tareas todavía.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 px-4 py-3">
              <input type="checkbox" checked={task.is_done} onChange={() => toggleDone(task)} />
              <span className={`flex-1 ${task.is_done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {task.title}
              </span>
              <span className="text-xs uppercase text-gray-400">{task.priority}</span>
              <button
                type="button"
                onClick={() => handleTrash(task.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Borrar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
