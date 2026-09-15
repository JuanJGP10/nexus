// day: 1=Lunes 2=Martes 3=Miércoles 4=Jueves 5=Viernes — editar aquí si una celda está mal
export const SUBJECTS = {
  DWS: { name: 'Desarrollo Web en Entorno Servidor', teacher: 'Paco', color: '#3a7ca5' },
  DWC: { name: 'Desarrollo Web en Entorno Cliente', teacher: 'JuanAn', color: '#2a9d8f' },
  DIGI: { name: 'Digitalización aplicada al sistema productivo', teacher: 'Roca', color: '#8e5cd9' },
  DAP: { name: 'Despliegue de Aplicaciones', teacher: 'Alfonso', color: '#e07a3f' },
  DINT: { name: 'Diseño de Interfaces Web', teacher: 'Mª Ángeles', color: '#d9587a' },
  PROY: { name: 'Proyecto Intermodular 2', teacher: 'Juan Antonio', color: '#c9a227' },
  EIE: { name: 'Itinerario Empleabilidad II', teacher: 'Isabel', color: '#4caf6a' },
  OPT: { name: 'Python (optativa)', teacher: 'Daniel', color: '#6272c9' },
  SOSTE: { name: 'Sostenibilidad aplicada', teacher: 'Roca', color: '#7a8c3f' },
}

export const PERIODS = [
  { start: '08:00', end: '08:55' },
  { start: '08:55', end: '09:50' },
  { start: '09:50', end: '10:45' },
  { start: '10:45', end: '11:05', recreo: true },
  { start: '11:05', end: '12:00' },
  { start: '12:00', end: '12:55' },
  { start: '12:55', end: '13:50' },
]

// row = índice en PERIODS (el recreo, row 3, no lleva asignatura)
export const SCHEDULE = [
  // Lunes
  { day: 1, row: 0, subj: 'DWS' },
  { day: 1, row: 1, subj: 'DWS' },
  { day: 1, row: 2, subj: 'DIGI' },
  { day: 1, row: 4, subj: 'DINT' },
  { day: 1, row: 5, subj: 'DINT' },
  { day: 1, row: 6, subj: 'EIE' },
  // Martes
  { day: 2, row: 0, subj: 'DWC' },
  { day: 2, row: 1, subj: 'DWC' },
  { day: 2, row: 2, subj: 'DAP' },
  { day: 2, row: 4, subj: 'PROY' },
  { day: 2, row: 5, subj: 'PROY' },
  { day: 2, row: 6, subj: 'EIE' },
  // Miércoles
  { day: 3, row: 0, subj: 'DINT' },
  { day: 3, row: 1, subj: 'DINT' },
  { day: 3, row: 2, subj: 'DWS' },
  { day: 3, row: 4, subj: 'DWS' },
  { day: 3, row: 5, subj: 'OPT' },
  { day: 3, row: 6, subj: 'OPT' },
  // Jueves
  { day: 4, row: 0, subj: 'DWS' },
  { day: 4, row: 1, subj: 'DWS' },
  { day: 4, row: 2, subj: 'DWC' },
  { day: 4, row: 4, subj: 'DWC' },
  { day: 4, row: 5, subj: 'DAP' },
  { day: 4, row: 6, subj: 'DAP' },
  // Viernes
  { day: 5, row: 0, subj: 'SOSTE' },
  { day: 5, row: 1, subj: 'PROY' },
  { day: 5, row: 2, subj: 'DWC' },
  { day: 5, row: 4, subj: 'DWC' },
  { day: 5, row: 5, subj: 'EIE' },
  { day: 5, row: 6, subj: 'OPT' },
]

export const DAYS = [
  { n: 1, short: 'LUN', full: 'Lunes' },
  { n: 2, short: 'MAR', full: 'Martes' },
  { n: 3, short: 'MIÉ', full: 'Miércoles' },
  { n: 4, short: 'JUE', full: 'Jueves' },
  { n: 5, short: 'VIE', full: 'Viernes' },
]

export function findScheduleEntry(day, row) {
  return SCHEDULE.find((entry) => entry.day === day && entry.row === row)
}

/**
 * Agrupa filas consecutivas de PERIODS con la misma asignatura en un solo
 * bloque (los tramos de 2h del horario), para no listar la misma clase dos
 * veces seguidas en las vistas de "un día".
 */
export function buildDayBlocks(day) {
  const blocks = []
  let row = 0
  while (row < PERIODS.length) {
    const period = PERIODS[row]

    if (period.recreo) {
      blocks.push({ type: 'recreo', start: period.start, end: period.end, rowStart: row, rowEnd: row })
      row += 1
      continue
    }

    const entry = findScheduleEntry(day, row)
    if (!entry) {
      blocks.push({ type: 'empty', start: period.start, end: period.end, rowStart: row, rowEnd: row })
      row += 1
      continue
    }

    let end = period.end
    let nextRow = row + 1
    while (nextRow < PERIODS.length && !PERIODS[nextRow].recreo) {
      const nextEntry = findScheduleEntry(day, nextRow)
      if (!nextEntry || nextEntry.subj !== entry.subj) break
      end = PERIODS[nextRow].end
      nextRow += 1
    }

    blocks.push({ type: 'class', start: period.start, end, subj: entry.subj, rowStart: row, rowEnd: nextRow - 1 })
    row = nextRow
  }
  return blocks
}
