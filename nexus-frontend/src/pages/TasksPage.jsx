import { useEffect, useState } from 'react'
import { tasksApi } from '../api/endpoints/tasks'
import { Panel } from '../components/Panel'
import { TaskDetailModal } from '../components/TaskDetailModal'

const PRIORITY_DOT = {
  low: 'bg-text-secondary',
  medium: 'bg-accent',
  high: 'bg-danger',
}

const DAY_LABEL = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mié',
  thursday: 'Jue',
  friday: 'Vie',
  saturday: 'Sáb',
  sunday: 'Dom',
}

export function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openTaskId, setOpenTaskId] = useState(null)

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
    <div className="mx-auto max-w-2xl">
      <Panel title="Tareas">
        <form onSubmit={handleCreate} className="flex gap-2 border-b border-border p-3">
          <input
            type="text"
            placeholder="Nueva tarea…"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="flex-1 border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="bg-accent px-4 py-2 font-mono text-xs tracking-[0.1em] text-accent-contrast uppercase hover:bg-accent-hover"
          >
            Añadir
          </button>
        </form>

        {error && (
          <p className="border-b border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="px-3 py-4 font-mono text-xs text-text-secondary">Cargando…</p>
        ) : tasks.length === 0 ? (
          <p className="px-3 py-4 font-mono text-xs text-text-secondary">Sin tareas todavía.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleDone(task)}
                  className={`relative h-5 w-5 shrink-0 border before:absolute before:-inset-2 before:content-[''] ${
                    task.is_done ? 'border-success bg-success' : 'border-border'
                  }`}
                  aria-label="Marcar como hecha"
                />
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                <button
                  type="button"
                  onClick={() => setOpenTaskId(task.id)}
                  className={`-my-2 flex-1 truncate py-2 text-left hover:text-accent ${
                    task.is_done ? 'text-text-secondary line-through' : 'text-text-primary'
                  }`}
                >
                  {task.title}
                  {task.subtasks.length > 0 && (
                    <span className="ml-2 font-mono text-[11px] text-text-secondary">
                      {task.subtasks.filter((subtask) => subtask.is_done).length}/{task.subtasks.length}
                    </span>
                  )}
                </button>
                <span className="hidden font-mono text-[11px] tracking-[0.1em] text-text-secondary uppercase sm:inline">
                  {task.priority}
                </span>
                {task.day_of_week && (
                  <span className="hidden font-mono text-[11px] tracking-[0.1em] text-text-secondary uppercase sm:inline">
                    {DAY_LABEL[task.day_of_week]}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleTrash(task.id)}
                  className="-my-2 shrink-0 py-2 font-mono text-xs text-danger hover:underline"
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {openTaskId && (
        <TaskDetailModal
          taskId={openTaskId}
          onClose={() => {
            setOpenTaskId(null)
            loadTasks()
          }}
        />
      )}
    </div>
  )
}
