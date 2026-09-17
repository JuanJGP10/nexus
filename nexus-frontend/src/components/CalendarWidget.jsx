import { useEffect, useMemo, useState } from 'react'
import { dayListsApi } from '../api/endpoints/dayLists'
import { tasksApi } from '../api/endpoints/tasks'
import { WEEKDAY_LABELS, getMonthMatrix, getNextOccurrence, isSameDay, toDateKey } from '../utils/calendar'
import { DayListModal } from './DayListModal'
import { Panel } from './Panel'

export function CalendarWidget() {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [openDate, setOpenDate] = useState(null)
  const [daysWithLists, setDaysWithLists] = useState(new Set())
  const [datesWithTasks, setDatesWithTasks] = useState(new Set())

  async function loadDates() {
    try {
      setDaysWithLists(new Set(await dayListsApi.listDates()))
    } catch {
      // indicador no crítico, se ignora si falla
    }
  }

  async function loadTaskDates() {
    try {
      const tasks = await tasksApi.list()
      const weekdays = new Set(tasks.filter((task) => task.day_of_week).map((task) => task.day_of_week))
      const dates = [...weekdays].map((weekday) => toDateKey(getNextOccurrence(weekday, today)))
      setDatesWithTasks(new Set(dates))
    } catch {
      // indicador no crítico, se ignora si falla
    }
  }

  useEffect(() => {
    loadDates()
    loadTaskDates()
  }, [])

  const weeks = useMemo(() => {
    const days = getMonthMatrix(cursor.getFullYear(), cursor.getMonth())
    return Array.from({ length: 6 }, (_, week) => days.slice(week * 7, week * 7 + 7))
  }, [cursor])

  function changeMonth(delta) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  function closeModal() {
    setOpenDate(null)
    loadDates()
    loadTaskDates()
  }

  return (
    <Panel
      title="Calendario"
      className="min-h-0 lg:flex-1"
      action={
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="p-1.5 text-text-secondary hover:text-accent"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <span className="tracking-[0.1em] text-text-secondary uppercase">
            {cursor.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="p-1.5 text-text-secondary hover:text-accent"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
      }
      bodyClassName="flex flex-col p-2 lg:justify-center"
    >
      <div className="grid shrink-0 grid-cols-7 gap-0.5 font-mono text-[10px] text-text-secondary">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-center uppercase">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map(({ date, inMonth }) => {
          const key = toDateKey(date)
          const isToday = isSameDay(date, today)
          const hasLists = daysWithLists.has(key)
          const hasTasks = datesWithTasks.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpenDate(date)}
              className={`relative flex aspect-square items-center justify-center text-xs transition-colors ${
                inMonth ? 'text-text-primary' : 'text-text-secondary/40'
              } ${isToday ? 'border border-accent text-accent' : 'border border-transparent hover:border-border'}`}
            >
              {date.getDate()}
              {(hasLists || hasTasks) && (
                <span className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {hasLists && <span className="h-1 w-1 rounded-full bg-accent" />}
                  {hasTasks && <span className="h-1 w-1 rounded-full bg-success" />}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {openDate && <DayListModal date={openDate} onClose={closeModal} />}
    </Panel>
  )
}
