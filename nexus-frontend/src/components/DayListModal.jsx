import { useEffect } from 'react'
import { toDateKey } from '../utils/calendar'
import { useDayLists } from '../utils/useDayLists'
import { ListGrid } from './ListGrid'

export function DayListModal({ date, onClose }) {
  const key = toDateKey(date)
  const { lists, isLoading, error, addList, renameList, removeList, addItem, toggleItem, editItemText, removeItem } =
    useDayLists(key)

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
    </div>
  )
}
