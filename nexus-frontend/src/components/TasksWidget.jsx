import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tasksApi } from '../api/endpoints/tasks'
import { Panel } from './Panel'
import { TaskDetailModal } from './TaskDetailModal'

const PRIORITY_DOT = {
  low: 'bg-text-secondary',
  medium: 'bg-accent',
  high: 'bg-danger',
}

export function TasksWidget() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [openTaskId, setOpenTaskId] = useState(null)

  async function loadTasks() {
    try {
      setTasks(await tasksApi.list({ is_done: false, sort_by: 'priority', order: 'desc' }))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function toggleDone(task) {
    setTasks((current) => current.filter((item) => item.id !== task.id))
    try {
      await tasksApi.update(task.id, { is_done: true })
    } catch {
      loadTasks()
    }
  }

  return (
    <Panel
      title="Tareas pendientes"
      className="max-h-80 shrink-0"
      action={
        <Link
          to="/tasks"
          className="font-mono text-[11px] tracking-[0.15em] text-accent uppercase hover:text-accent-hover"
        >
          Ver todas
        </Link>
      }
      bodyClassName="p-2"
    >
      {isLoading ? (
        <p className="p-3 font-mono text-xs text-text-secondary">Cargando…</p>
      ) : tasks.length === 0 ? (
        <p className="p-3 font-mono text-xs text-text-secondary">Sin pendientes. Todo despejado.</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-2 px-2 py-1.5 hover:bg-bg"
            >
              <button
                type="button"
                onClick={() => toggleDone(task)}
                className="h-3.5 w-3.5 shrink-0 border border-border transition-colors group-hover:border-accent"
                aria-label="Marcar como hecha"
              />
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
              <button
                type="button"
                onClick={() => setOpenTaskId(task.id)}
                className="flex-1 truncate text-left text-sm text-text-primary hover:text-accent"
              >
                {task.title}
              </button>
            </li>
          ))}
        </ul>
      )}

      {openTaskId && (
        <TaskDetailModal
          taskId={openTaskId}
          onClose={() => {
            setOpenTaskId(null)
            loadTasks()
          }}
        />
      )}
    </Panel>
  )
}
