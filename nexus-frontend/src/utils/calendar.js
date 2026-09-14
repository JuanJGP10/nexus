export const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

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
