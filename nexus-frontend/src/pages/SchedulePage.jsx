import { Fragment, useEffect, useMemo, useState } from 'react'
import { Panel } from '../components/Panel'
import { DAYS, PERIODS, SUBJECTS, findScheduleEntry } from '../data/schedule'
import { madridParts, toMinutes } from '../utils/schedule'

export function SchedulePage() {
  const [now, setNow] = useState(() => madridParts(new Date()))

  useEffect(() => {
    const id = setInterval(() => setNow(madridParts(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  const isWeekday = now.day >= 1 && now.day <= 5

  const activeRow = useMemo(
    () => PERIODS.findIndex((period) => now.minutes >= toMinutes(period.start) && now.minutes < toMinutes(period.end)),
    [now.minutes],
  )
  const activePeriod = isWeekday && activeRow >= 0 ? PERIODS[activeRow] : null
  const activeEntry = activePeriod && !activePeriod.recreo ? findScheduleEntry(now.day, activeRow) : null
  const activeSubject = activeEntry ? SUBJECTS[activeEntry.subj] : null

  let statusText
  if (!isWeekday) {
    statusText = 'Fin de semana — sin clase. Vuelve el lunes a las 08:00.'
  } else if (activePeriod?.recreo) {
    statusText = 'Recreo — siguiente clase a las 11:05.'
  } else if (activeSubject) {
    const remaining = toMinutes(activePeriod.end) - now.minutes
    statusText = `Ahora: ${activeSubject.name} con ${activeSubject.teacher} · termina a las ${activePeriod.end} (quedan ${remaining} min)`
  } else {
    statusText = 'Sin clase ahora mismo.'
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Panel
        title="Horario"
        action={<span className="font-mono text-xs text-text-secondary">{now.hms} · Madrid</span>}
        bodyClassName="flex flex-col"
      >
        <p className="border-b border-border bg-surface px-4 py-2 font-mono text-xs text-text-secondary">
          <span className="text-success">// </span>
          {statusText}
        </p>

        <div className="grid grid-cols-[32px_repeat(5,1fr)] sm:grid-cols-[64px_repeat(5,1fr)]">
          <div className="border-b border-border bg-surface" />
          {DAYS.map((d) => (
            <button
              key={d.n}
              type="button"
              onClick={() => setOpenDay(d)}
              className={`border-b border-l border-border px-0.5 py-1.5 text-center font-mono text-[10px] uppercase transition-colors hover:bg-accent/10 sm:px-2 sm:py-2 sm:text-xs ${
                isWeekday && d.n === now.day ? 'bg-success/10 text-success' : 'text-text-secondary'
              }`}
            >
              {d.short}
              <span
                className={`mt-0.5 hidden font-sans text-[11px] normal-case sm:block ${
                  isWeekday && d.n === now.day ? 'text-success' : 'text-text-primary'
                }`}
              >
                {d.full}
              </span>
            </button>
          ))}

          {PERIODS.map((period, row) => {
            const isNowRow = isWeekday && row === activeRow

            if (period.recreo) {
              return (
                <Fragment key={row}>
                  <div
                    className={`border-b border-border px-0.5 py-1 text-center font-mono text-[8px] sm:px-1 sm:text-[10px] ${
                      isNowRow ? 'font-semibold text-success' : 'text-text-secondary'
                    }`}
                  >
                    {period.start}
                  </div>
                  <div className="col-span-5 border-b border-l border-border bg-accent/5 px-1 py-1 text-center font-mono text-[9px] tracking-[0.1em] text-text-secondary uppercase sm:px-2 sm:text-[10px] sm:tracking-[0.15em]">
                    Recreo
                  </div>
                </Fragment>
              )
            }

            return (
              <Fragment key={row}>
                <div
                  className={`flex flex-col items-center justify-center gap-0.5 border-b border-border px-0.5 py-1.5 font-mono text-[8px] sm:px-1 sm:py-2 sm:text-[10px] ${
                    isNowRow ? 'font-semibold text-success' : 'text-text-secondary'
                  }`}
                >
                  <span>{period.start}</span>
                  <span>{period.end}</span>
                </div>
                {DAYS.map((d) => {
                  const entry = findScheduleEntry(d.n, row)
                  const isActive = isNowRow && d.n === now.day && entry

                  if (!entry) {
                    return (
                      <button
                        key={d.n}
                        type="button"
                        onClick={() => setOpenDay(d)}
                        aria-label={`Ver horario de ${d.full}`}
                        className="border-b border-l border-border py-1.5 hover:bg-accent/5 sm:py-2"
                      />
                    )
                  }

                  const subj = SUBJECTS[entry.subj]
                  return (
                    <button
                      key={d.n}
                      type="button"
                      onClick={() => setOpenDay(d)}
                      className={`relative flex min-w-0 flex-col justify-center gap-0.5 border-b border-l border-border px-0.5 py-1.5 text-left transition-colors hover:bg-accent/5 sm:px-2 sm:py-2 ${
                        isActive ? 'bg-success/10' : ''
                      }`}
                      style={isActive ? { boxShadow: 'inset 3px 0 0 var(--color-success)' } : undefined}
                    >
                      <span
                        className="block truncate text-center text-[9px] font-bold sm:hidden"
                        style={{ color: subj.color }}
                      >
                        {entry.subj}
                      </span>
                      <span
                        className="hidden truncate text-xs font-semibold sm:block"
                        style={{ color: subj.color }}
                      >
                        {subj.name}
                      </span>
                      <span className="hidden truncate font-mono text-[10px] text-text-secondary sm:block">
                        {subj.teacher}
                      </span>
                      {isActive && (
                        <span className="absolute top-0.5 right-0.5 font-mono text-[8px] text-success sm:top-1.5 sm:right-1.5 sm:text-[9px]">
                          ▶
                        </span>
                      )}
                    </button>
                  )
                })}
              </Fragment>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border px-4 py-3 font-mono text-[11px] text-text-secondary">
          {Object.entries(SUBJECTS).map(([code, subj]) => (
            <span key={code}>
              <b style={{ color: subj.color }}>{code}</b> · {subj.teacher}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  )
}
