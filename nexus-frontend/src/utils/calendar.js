export const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** Valores del enum `day_of_week` del backend, en el mismo orden que WEEKDAY_LABELS (lunes primero). */
export const DAY_OF_WEEK_VALUES = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

/** `day_of_week` del backend correspondiente a una fecha (Date.getDay() es domingo=0, aquí lunes primero). */
export function getDayOfWeekValue(date) {
  return DAY_OF_WEEK_VALUES[(date.getDay() + 6) % 7]
}

/**
 * Próxima fecha (>= from, from incluido) que cae en ese `day_of_week`.
 * `day_of_week` no lleva fecha propia — es solo un día de la semana — así que
 * "la tarea del sábado" se ancla siempre al sábado más cercano a partir de
 * `from`, nunca a todos los sábados del calendario.
 */
export function getNextOccurrence(dayOfWeekValue, from) {
  const targetIndex = DAY_OF_WEEK_VALUES.indexOf(dayOfWeekValue)
  const fromIndex = (from.getDay() + 6) % 7
  const diffDays = (targetIndex - fromIndex + 7) % 7
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + diffDays)
}

export function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Matriz de 42 días (6 semanas, lunes primero) para pintar el mes, incluyendo relleno de meses vecinos. */
export function getMonthMatrix(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const mondayFirstOffset = (firstOfMonth.getDay() + 6) % 7
  const start = new Date(year, month, 1 - mondayFirstOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return { date, inMonth: date.getMonth() === month }
  })
}
