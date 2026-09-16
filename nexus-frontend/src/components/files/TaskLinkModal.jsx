import { useEffect, useState } from 'react'
import { tasksApi } from '../../api/endpoints/tasks'
import { CheckIcon, CloseIcon } from './icons'

/**
 * Vincular un archivo a una tarea abierta.
 *
 * Antes esto era un `<select>` suelto en la cabecera del explorador que solo
 * aparecía al seleccionar un archivo. Como modal cabe la lista entera, se puede
 * buscar y no roba sitio a la barra de herramientas.
 */
export function TaskLinkModal({ file, onClose, onLinked }) {
  const [tasks, setTasks] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    tasksApi
      .list({ is_done: false })
      .then(setTasks)
      .catch((err) => setError(err.message))
  }, [])

  const visible = tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-bg/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vincular a una tarea"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
        className="hud-panel flex h-[70dvh] w-full flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0 sm:h-[55vh] sm:max-w-md"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="truncate font-mono text-xs tracking-[0.2em] text-text-secondary uppercase">
            Vincular «{file.filename}»
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 text-text-secondary transition-colors hover:text-accent"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b border-border px-3 py-2">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar tarea…"
            className="w-full border border-border bg-transparent px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
          />
        </div>

        {error && (
          <p className="border-b border-danger/40 bg-danger/10 px-3 py-1.5 font-mono text-xs text-danger">{error}</p>
        )}

        <div className="flex-1 overflow-auto">
          <button
            type="button"
            onClick={() => onLinked(null)}
            className="flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm text-text-secondary transition-colors hover:bg-accent/10 sm:py-2"
          >
            <span className="h-4 w-4 shrink-0">{file.task_id ? null : <CheckIcon className="h-4 w-4 text-accent" />}</span>
            Sin tarea
          </button>
          {visible.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onLinked(task.id)}
              className="flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm text-text-primary transition-colors hover:bg-accent/10 sm:py-2"
            >
              <span className="h-4 w-4 shrink-0">
                {file.task_id === task.id && <CheckIcon className="h-4 w-4 text-accent" />}
              </span>
              <span className="flex-1 truncate">{task.title}</span>
            </button>
          ))}
          {visible.length === 0 && (
            <p className="px-3 py-4 font-mono text-xs text-text-secondary">No hay tareas abiertas que coincidan.</p>
          )}
        </div>
      </div>
    </div>
  )
}
