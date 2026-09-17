import { useEffect, useId, useRef, useState } from 'react'
import { tasksApi } from '../api/endpoints/tasks'
import { getDayOfWeekValue, getNextOccurrence, isSameDay, toDateKey } from '../utils/calendar'
import { useDayLists } from '../utils/useDayLists'
import { PERIODS } from '../data/schedule'
import { madridParts, toMinutes } from '../utils/schedule'
import { DaySubjects } from './DaySubjects'
import { ListGrid } from './ListGrid'
import { TaskDetailModal } from './TaskDetailModal'

const PRIORITY_DOT = {
  low: 'bg-text-secondary',
  medium: 'bg-accent',
  high: 'bg-danger',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Cabecera de sección: título, contador y la línea que llega hasta el borde. */
function SectionHeading({ title, count }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <h3 className="font-mono text-[11px] tracking-[0.2em] text-text-secondary uppercase">{title}</h3>
      {count > 0 && (
        <span className="font-mono text-[10px] tracking-[0.1em] text-accent tabular-nums">{count}</span>
      )}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export function DayListModal({ date, onClose }) {
  const key = toDateKey(date)
  const weekday = getDayOfWeekValue(date)
  const scheduleDay = date.getDay()
  const titleId = useId()
  const { lists, isLoading, error, addList, renameList, removeList, addItem, toggleItem, editItemText, removeItem } =
    useDayLists(key)

  const [tasks, setTasks] = useState([])
  const [tasksError, setTasksError] = useState(null)
  const [openTaskId, setOpenTaskId] = useState(null)

  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  // Cerrar al hacer clic fuera solo cuenta si el gesto empezó fuera: si no,
  // soltar el ratón fuera del modal tras seleccionar texto dentro lo cerraba.
  const pressStartedOnOverlay = useRef(false)

  const isToday = isSameDay(date, new Date())

  async function loadTasks() {
    try {
      const allTasksForWeekday = await tasksApi.list({ day_of_week: weekday })
      // day_of_week no lleva fecha propia: se ancla siempre al próximo día que
      // toque, no a todos los días de esa semana que aparezcan en el calendario.
      const nextOccurrenceKey = toDateKey(getNextOccurrence(weekday, new Date()))
      setTasks(nextOccurrenceKey === key ? allTasksForWeekday : [])
      setTasksError(null)
    } catch (err) {
      setTasksError(err.message)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [key, weekday])

  const activeRow = isToday
    ? PERIODS.findIndex((period) => {
        const minutes = madridParts(new Date()).minutes
        return minutes >= toMinutes(period.start) && minutes < toMinutes(period.end)
      })
    : -1

  async function toggleTaskDone(task) {
    try {
      await tasksApi.update(task.id, { is_done: !task.is_done })
      await loadTasks()
    } catch (err) {
      setTasksError(err.message)
    }
  }

  // Foco al abrir, devolverlo al cerrar y bloquear el scroll de la página de
  // detrás: sin esto la rueda del ratón movía el panel, no el modal.
  useEffect(() => {
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      // Con el modal de tarea abierto manda él: ni cierra este ni le roba el foco.
      if (openTaskId) return

      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE)
      if (!focusables?.length) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, openTaskId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm sm:p-6"
      onPointerDown={(event) => {
        pressStartedOnOverlay.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && pressStartedOnOverlay.current) onClose()
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="hud-panel flex h-dvh w-full flex-col sm:h-auto sm:max-h-[85vh] sm:max-w-4xl"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-baseline gap-3">
            {/* El día nunca se recorta; si falta sitio se recorta el mes. */}
            <h2 id={titleId} className="shrink-0 font-mono text-sm tracking-[0.2em] text-accent uppercase">
              {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
            </h2>
            <p className="min-w-0 truncate font-mono text-[11px] tracking-[0.15em] text-text-secondary uppercase">
              {date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
            {isToday && (
              <span className="shrink-0 border border-accent px-1.5 py-0.5 font-mono text-[10px] tracking-[0.15em] text-accent uppercase">
                Hoy
              </span>
            )}
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 border border-border p-2 text-text-secondary transition-colors hover:border-accent hover:text-accent sm:p-1.5"
            aria-label="Cerrar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        {error && (
          <p className="shrink-0 border-b border-danger/40 bg-danger/10 px-4 py-2 font-mono text-xs text-danger">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          <section className="mb-6">
            <SectionHeading title="Materias" />
            <DaySubjects day={scheduleDay} activeRow={activeRow} />
          </section>

          <section className="mb-6">
            <SectionHeading title="Tareas" count={tasks.length} />
            {tasksError && <p className="mb-2 font-mono text-xs text-danger">{tasksError}</p>}
            {tasks.length === 0 ? (
              <p className="font-mono text-xs text-text-secondary">Sin tareas para este día de la semana.</p>
            ) : (
              <ul className="hud-panel divide-y divide-border">
                <span className="hud-corner-bl" />
                <span className="hud-corner-br" />
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(task)}
                      className={`relative h-4 w-4 shrink-0 border before:absolute before:-inset-2 before:content-[''] ${
                        task.is_done ? 'border-success bg-success' : 'border-border'
                      }`}
                      aria-label={task.is_done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                      aria-pressed={task.is_done}
                    />
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                    <button
                      type="button"
                      onClick={() => setOpenTaskId(task.id)}
                      className={`-my-2 flex-1 truncate py-2 text-left text-sm hover:text-accent ${
                        task.is_done ? 'text-text-secondary line-through' : 'text-text-primary'
                      }`}
                    >
                      {task.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionHeading title="Listas" count={lists.length} />
            {isLoading ? (
              <p className="font-mono text-xs text-text-secondary">Cargando…</p>
            ) : (
              <ListGrid
                lists={lists}
                onAddList={addList}
                onRenameList={renameList}
                onAddItem={addItem}
                onToggleItem={toggleItem}
                onEditItemText={editItemText}
                onRemoveItem={removeItem}
                onRemoveList={removeList}
              />
            )}
          </section>
        </div>
      </div>

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
