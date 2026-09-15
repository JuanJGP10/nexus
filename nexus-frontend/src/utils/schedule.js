const WEEKDAY_MAP = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }

/** Hora/día actuales en Europe/Madrid — el cambio de horario de invierno/verano lo resuelve Intl solo. */
export function madridParts(date) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    day: WEEKDAY_MAP[parts.weekday],
    hms: `${parts.hour}:${parts.minute}:${parts.second}`,
    minutes: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10),
  }
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
