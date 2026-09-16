import { useEffect, useRef } from 'react'
import {
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  FolderUploadIcon,
  GridViewIcon,
  HelpIcon,
  HomeIcon,
  ListViewIcon,
  NewFolderIcon,
  PasteIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from './icons'

function ToolButton({ label, onClick, disabled, active, className = '', children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      // 40px de lado en móvil: por debajo de eso el dedo falla más de lo aceptable.
      className={`flex h-10 w-10 shrink-0 items-center justify-center border border-transparent transition-colors sm:h-7 sm:w-7 ${className} ${
        disabled
          ? 'cursor-not-allowed text-text-secondary/30'
          : active
            ? 'border-accent/60 bg-accent/15 text-accent'
            : 'text-text-secondary hover:border-border hover:text-accent'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Barra superior del explorador: navegación (atrás/adelante/subir), migas de pan,
 * búsqueda y acciones de carpeta.
 *
 * Las migas también son destino de arrastre: soltar encima de un ancestro mueve
 * lo arrastrado ahí, que es la forma rápida de sacar algo de una subcarpeta.
 */
export function ExplorerToolbar({
  path,
  canGoBack,
  canGoForward,
  canGoUp,
  onGoBack,
  onGoForward,
  onGoUp,
  onRefresh,
  onNavigateCrumb,
  crumbDropId,
  onCrumbDragOver,
  onCrumbDragLeave,
  onCrumbDrop,
  query,
  onQueryChange,
  onSearchSubmit,
  searchInputRef,
  isSearchResults,
  onExitSearch,
  view,
  onViewChange,
  mode,
  onToggleTrash,
  onNewFolder,
  onUpload,
  onUploadFolder,
  clipboard,
  onPaste,
  onShowHelp,
  compact,
}) {
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)

  useEffect(() => {
    // `webkitdirectory` no existe como atributo JSX, hay que ponerlo a mano.
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '')
      folderInputRef.current.setAttribute('directory', '')
    }
  }, [])

  const inTrash = mode === 'trash'

  return (
    <div className="shrink-0 border-b border-border">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <ToolButton label="Atrás (Alt+←)" onClick={onGoBack} disabled={!canGoBack}>
          <ChevronLeftIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Adelante (Alt+→)" onClick={onGoForward} disabled={!canGoForward}>
          <ChevronRightIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Subir un nivel (Retroceso)" onClick={onGoUp} disabled={!canGoUp}>
          <ArrowUpIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Recargar (F5)" onClick={onRefresh}>
          <RefreshIcon className="h-4 w-4" />
        </ToolButton>

        {/* Migas de pan */}
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 font-mono text-xs whitespace-nowrap text-text-secondary">
          {inTrash ? (
            <span className="flex items-center gap-1.5 text-accent">
              <TrashIcon className="h-3.5 w-3.5" />
              Papelera
            </span>
          ) : isSearchResults ? (
            <span className="flex items-center gap-1.5 text-accent">
              <SearchIcon className="h-3.5 w-3.5" />
              Resultados
              <button type="button" onClick={onExitSearch} className="text-text-secondary hover:text-accent">
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            path.map((crumb, index) => {
              const isLast = index === path.length - 1
              return (
                <span key={crumb.id ?? 'root'} className="flex shrink-0 items-center">
                  {index > 0 && <ChevronRightIcon className="h-3 w-3 text-border" />}
                  <button
                    type="button"
                    onClick={() => onNavigateCrumb(index)}
                    onDragOver={(event) => onCrumbDragOver(event, crumb.id)}
                    onDragLeave={onCrumbDragLeave}
                    onDrop={(event) => onCrumbDrop(event, crumb.id)}
                    className={`flex items-center gap-1 px-1.5 py-1 transition-colors ${
                      crumbDropId === crumb.id && crumbDropId !== undefined
                        ? 'bg-accent/25 text-accent'
                        : isLast
                          ? 'text-accent'
                          : 'hover:text-text-primary'
                    }`}
                  >
                    {index === 0 && <HomeIcon className="h-3.5 w-3.5" />}
                    {crumb.name}
                  </button>
                </span>
              )
            })
          )}
        </div>

        <ToolButton
          label={view === 'list' ? 'Ver en cuadrícula' : 'Ver en lista'}
          onClick={() => onViewChange(view === 'list' ? 'grid' : 'list')}
        >
          {view === 'list' ? <GridViewIcon className="h-4 w-4" /> : <ListViewIcon className="h-4 w-4" />}
        </ToolButton>
        {/* Los atajos de teclado no sirven de nada con el dedo: fuera en móvil. */}
        {!compact && (
          <ToolButton label="Atajos de teclado" onClick={onShowHelp} className="hidden sm:flex">
            <HelpIcon className="h-4 w-4" />
          </ToolButton>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSearchSubmit()
          }}
          title="Filtra la carpeta actual mientras escribes. Enter busca en todos los archivos."
          className="flex min-w-0 flex-1 items-center gap-1.5 border border-border px-2 py-1 focus-within:border-accent"
        >
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onQueryChange('')
                event.target.blur()
              }
            }}
            placeholder="Filtrar o buscar…"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Limpiar búsqueda"
              className="shrink-0 text-text-secondary hover:text-accent"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {!inTrash && (
          <>
            <ToolButton label="Nueva carpeta (Ctrl+Mayús+N)" onClick={onNewFolder}>
              <NewFolderIcon className="h-4 w-4" />
            </ToolButton>
            <ToolButton label="Subir archivos" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon className="h-4 w-4" />
            </ToolButton>
            {/* `webkitdirectory` no existe en los navegadores móviles: se oculta
                ahí en vez de dejar un botón que no hace nada. */}
            {!compact && (
              <ToolButton
                label="Subir una carpeta"
                onClick={() => folderInputRef.current?.click()}
                className="hidden sm:flex"
              >
                <FolderUploadIcon className="h-4 w-4" />
              </ToolButton>
            )}
            <ToolButton label="Pegar (Ctrl+V)" onClick={onPaste} disabled={!clipboard}>
              <PasteIcon className="h-4 w-4" />
            </ToolButton>
          </>
        )}

        <ToolButton label={inTrash ? 'Volver a los archivos' : 'Papelera'} onClick={onToggleTrash} active={inTrash}>
          <TrashIcon className="h-4 w-4" />
        </ToolButton>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            onUpload(event.target.files)
            event.target.value = ''
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            onUploadFolder(event.target.files)
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
