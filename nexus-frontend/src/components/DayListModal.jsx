import { useEffect, useState } from 'react'
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

export function DayListModal({ date, onClose }) {
  const key = toDateKey(date)
  const weekday = getDayOfWeekValue(date)
  const scheduleDay = date.getDay()
  const { lists, isLoading, error, addList, renameList, removeList, addItem, toggleItem, editItemText, removeItem } =
    useDayLists(key)

  const [tasks, setTasks] = useState([])
  const [tasksError, setTasksError] = useState(null)
  const [openTaskId, setOpenTaskId] = useState(null)

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

  const activeRow = isSameDay(date, new Date())
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

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="hud-panel flex h-dvh w-full flex-col sm:h-auto sm:max-h-[85vh] sm:max-w-4xl"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">
            {date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent sm:px-2 sm:py-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        {error && (
          <p className="border-b border-danger/40 bg-danger/10 px-4 py-2 font-mono text-xs text-danger">{error}</p>
        )}

        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4">
            <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-text-secondary uppercase">Materias</p>
            <DaySubjects day={scheduleDay} activeRow={activeRow} />
          </div>

          <div className="mb-4">
            <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-text-secondary uppercase">Tareas</p>
            {tasksError && (
              <p className="mb-2 font-mono text-xs text-danger">{tasksError}</p>
            )}
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
                      aria-label="Marcar como hecha"
                    />
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                    <button
                      type="button"
                      onClick={() => setOpenTaskId(task.id)}
                      className={`flex-1 truncate text-left text-sm hover:text-accent ${
                        task.is_done ? 'text-text-secondary line-through' : 'text-text-primary'
                      }`}
                    >
                      {task.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-text-secondary uppercase">Listas</p>
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
