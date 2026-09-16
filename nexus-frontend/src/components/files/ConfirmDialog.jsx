import { useEffect, useRef } from 'react'

/**
 * Confirmación de una acción destructiva.
 *
 * No usamos `window.confirm` a propósito: bloquea el hilo del navegador, no se
 * puede tematizar y en móvil sale del flujo visual de la app.
 */
export function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', danger = true, onConfirm, onCancel }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="hud-panel w-full max-w-sm"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs tracking-[0.2em] text-text-secondary uppercase">{title}</h2>
        </header>

        <p className="px-4 py-4 text-sm break-words text-text-primary">{message}</p>

        <footer className="flex justify-end gap-2 border-t border-border px-4 py-3 font-mono text-xs tracking-[0.1em] uppercase">
          <button
            type="button"
            onClick={onCancel}
            className="border border-border px-3 py-2 text-text-secondary transition-colors hover:text-text-primary"
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`border px-3 py-2 transition-colors ${
              danger
                ? 'border-danger text-danger hover:bg-danger/10'
                : 'border-accent text-accent hover:bg-accent/10'
            }`}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}
