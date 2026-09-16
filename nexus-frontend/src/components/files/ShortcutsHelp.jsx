import { CloseIcon } from './icons'

const GROUPS = [
  {
    title: 'Navegación',
    shortcuts: [
      ['↑ ↓ ← →', 'Mover el cursor'],
      ['Enter', 'Abrir carpeta o archivo'],
      ['Retroceso', 'Subir un nivel'],
      ['Alt + ← / →', 'Atrás / adelante en el historial'],
      ['Inicio / Fin', 'Primer / último elemento'],
      ['Escribir letras', 'Saltar al primer nombre que empiece así'],
      ['F5', 'Recargar'],
    ],
  },
  {
    title: 'Selección',
    shortcuts: [
      ['Clic', 'Seleccionar'],
      ['Ctrl + clic', 'Añadir o quitar de la selección'],
      ['Mayús + clic', 'Seleccionar un rango'],
      ['Arrastrar en el hueco', 'Selección por recuadro'],
      ['Ctrl + A', 'Seleccionar todo'],
      ['Mayús + flechas', 'Extender la selección'],
      ['Escape', 'Limpiar la selección'],
    ],
  },
  {
    title: 'Acciones',
    shortcuts: [
      ['Ctrl + C / X / V', 'Copiar / cortar / pegar'],
      ['F2', 'Renombrar'],
      ['Supr', 'Enviar a la papelera'],
      ['Mayús + Supr', 'Eliminar definitivamente'],
      ['Ctrl + Mayús + N', 'Nueva carpeta'],
      ['Ctrl + F', 'Ir al buscador'],
      ['Arrastrar a una carpeta', 'Mover (con Ctrl, copiar)'],
    ],
  },
]

export function ShortcutsHelp({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Atajos de teclado"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
        className="hud-panel flex max-h-[85dvh] w-full max-w-2xl flex-col"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs tracking-[0.2em] text-text-secondary uppercase">Atajos de teclado</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-secondary transition-colors hover:text-accent"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="grid flex-1 gap-5 overflow-auto p-4 sm:grid-cols-3">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="mb-2 font-mono text-[10px] tracking-[0.2em] text-accent uppercase">{group.title}</h3>
              <dl className="space-y-1.5">
                {group.shortcuts.map(([keys, description]) => (
                  <div key={keys} className="flex flex-col gap-0.5">
                    <dt className="font-mono text-[11px] text-text-primary">{keys}</dt>
                    <dd className="text-xs text-text-secondary">{description}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
