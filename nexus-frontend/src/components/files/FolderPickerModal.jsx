import { useCallback, useEffect, useRef, useState } from 'react'
import { foldersApi } from '../../api/endpoints/folders'
import { ChevronRightIcon, CloseIcon, FolderIcon, NewFolderIcon } from './icons'

/**
 * Selector de carpeta destino para "Mover a…" / "Copiar a…".
 *
 * Existe sobre todo por el móvil: arrastrar y soltar no funciona con el dedo
 * (HTML5 drag & drop es solo de ratón), así que sin esto no habría forma de
 * mover nada desde el teléfono. En escritorio sirve además para mover a una
 * carpeta lejana sin tener que navegar hasta ella con el listado real.
 *
 * `excludedIds` son las carpetas que se están moviendo: no se puede meter una
 * carpeta dentro de sí misma, así que ni se dejan abrir ni se dejan elegir.
 */
export function FolderPickerModal({
  title,
  confirmLabel,
  initialPath,
  excludedIds = new Set(),
  onConfirm,
  onCancel,
}) {
  const [path, setPath] = useState(initialPath?.length ? initialPath : [{ id: null, name: 'Inicio' }])
  const [folders, setFolders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const newNameRef = useRef(null)

  const currentId = path[path.length - 1].id

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setFolders(await foldersApi.list(currentId ?? undefined))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [currentId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (creating) newNameRef.current?.focus()
  }, [creating])

  async function submitNewFolder(event) {
    event.preventDefault()
    const name = newName.trim()
    setCreating(false)
    setNewName('')
    if (!name) return
    try {
      await foldersApi.create({ name, parent_id: currentId ?? undefined })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const selectable = !excludedIds.has(currentId)

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-bg/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === 'Escape' && onCancel()}
        className="hud-panel flex h-[70dvh] w-full flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0 sm:h-[60vh] sm:max-w-md"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="font-mono text-xs tracking-[0.2em] text-text-secondary uppercase">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="text-text-secondary transition-colors hover:text-accent"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2 font-mono text-xs whitespace-nowrap text-text-secondary">
          {path.map((crumb, index) => (
            <span key={crumb.id ?? 'root'} className="flex shrink-0 items-center gap-1">
              {index > 0 && <ChevronRightIcon className="h-3 w-3 text-border" />}
              <button
                type="button"
                onClick={() => setPath((current) => current.slice(0, index + 1))}
                className={index === path.length - 1 ? 'text-accent' : 'hover:text-text-primary'}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>

        {error && (
          <p className="border-b border-danger/40 bg-danger/10 px-3 py-1.5 font-mono text-xs text-danger">{error}</p>
        )}

        <div className="flex-1 overflow-auto">
          {creating && (
            <form onSubmit={submitNewFolder} className="flex items-center gap-2 px-3 py-2">
              <FolderIcon className="h-4 w-4 shrink-0 text-accent" />
              <input
                ref={newNameRef}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onBlur={() => setCreating(false)}
                onKeyDown={(event) => event.key === 'Escape' && setCreating(false)}
                placeholder="Nombre de la carpeta…"
                className="flex-1 border-b border-accent bg-transparent text-sm text-text-primary outline-none"
              />
            </form>
          )}

          {isLoading ? (
            <p className="px-3 py-4 font-mono text-xs text-text-secondary">Cargando…</p>
          ) : folders.length === 0 && !creating ? (
            <p className="px-3 py-4 font-mono text-xs text-text-secondary">No hay subcarpetas aquí.</p>
          ) : (
            folders.map((folder) => {
              const blocked = excludedIds.has(folder.id)
              return (
                <button
                  key={folder.id}
                  type="button"
                  disabled={blocked}
                  onClick={() => setPath((current) => [...current, { id: folder.id, name: folder.name }])}
                  className={`flex w-full items-center gap-2.5 px-3 py-3 text-left text-sm transition-colors sm:py-2 ${
                    blocked ? 'cursor-not-allowed text-text-secondary/40' : 'text-text-primary hover:bg-accent/10'
                  }`}
                >
                  <FolderIcon className="h-4 w-5 shrink-0 text-accent" />
                  <span className="flex-1 truncate">{folder.name}</span>
                  {!blocked && <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-secondary" />}
                </button>
              )
            })
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-border px-3 py-3 font-mono text-xs tracking-[0.1em] uppercase">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-2 py-2 text-text-secondary transition-colors hover:text-accent"
          >
            <NewFolderIcon className="h-4 w-4" />
            Carpeta
          </button>
          <button
            type="button"
            disabled={!selectable}
            onClick={() => onConfirm(currentId)}
            className={`border px-3 py-2 transition-colors ${
              selectable
                ? 'border-accent text-accent hover:bg-accent/10'
                : 'cursor-not-allowed border-border text-text-secondary/40'
            }`}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}
