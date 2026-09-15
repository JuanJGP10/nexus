import { SUBJECTS, buildDayBlocks } from '../data/schedule'

/** Lista de asignaturas de un día (day: 0=Domingo…6=Sábado, JS Date.getDay()). Sin clase en fin de semana. */
export function DaySubjects({ day, activeRow = -1 }) {
  const isSchoolDay = day >= 1 && day <= 5

  if (!isSchoolDay) {
    return (
      <div className="hud-panel px-3 py-2.5">
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />
        <p className="text-sm text-text-secondary">Fin de semana, sin clase.</p>
      </div>
    )
  }

  const blocks = buildDayBlocks(day)

  return (
    <ul className="hud-panel divide-y divide-border">
      <span className="hud-corner-bl" />
      <span className="hud-corner-br" />
      {blocks.map((block) => {
        if (block.type === 'recreo') {
          return (
            <li
              key={block.rowStart}
              className="px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] text-text-secondary uppercase"
            >
              {block.start}–{block.end} · Recreo
            </li>
          )
        }
        if (block.type === 'empty') {
          return (
            <li key={block.rowStart} className="flex items-center gap-3 px-3 py-1.5">
              <span className="w-20 shrink-0 font-mono text-xs text-text-secondary">
                {block.start}–{block.end}
              </span>
              <span className="text-sm text-text-secondary">Sin clase.</span>
            </li>
          )
        }
        const subj = SUBJECTS[block.subj]
        const isActive = activeRow >= block.rowStart && activeRow <= block.rowEnd
        return (
          <li key={block.rowStart} className={`flex items-center gap-3 px-3 py-1.5 ${isActive ? 'bg-success/10' : ''}`}>
            <span className="w-20 shrink-0 font-mono text-xs text-text-secondary">
              {block.start}–{block.end}
            </span>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: subj.color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-primary">{subj.name}</p>
              <p className="font-mono text-[11px] text-text-secondary">
                {subj.teacher} · {block.subj}
              </p>
            </div>
            {isActive && (
              <span className="shrink-0 font-mono text-[10px] tracking-[0.1em] text-success uppercase">Ahora</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
