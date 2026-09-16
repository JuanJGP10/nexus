import { useEffect, useRef } from 'react'
import { fileExtension } from '../../utils/files'
import { formatBytes, formatDate } from '../../utils/format'
import { CheckIcon, FileKindIcon, FolderIcon, LinkIcon } from './icons'

/** Campo de renombrado en línea. Se comporta como el de un gestor de escritorio. */
function RenameInput({ initialValue, isFolder, onSubmit, onCancel }) {
  const inputRef = useRef(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    const dot = initialValue.lastIndexOf('.')
    // Preseleccionar solo el nombre y no la extensión: escribir encima no se
    // come el ".pdf", que es el error clásico al renombrar.
    if (!isFolder && dot > 0) input.setSelectionRange(0, dot)
    else input.select()
  }, [initialValue, isFolder])

  function commit() {
    if (cancelledRef.current) return
    onSubmit(inputRef.current?.value ?? '')
  }

  return (
    <input
      ref={inputRef}
      defaultValue={initialValue}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          cancelledRef.current = true
          onCancel()
        }
      }}
      // Confirmar al perder el foco es lo que hace el explorador de Windows;
      // el guard evita confirmar cuando el que ha cerrado ha sido Escape.
      onBlur={commit}
      className="min-w-0 flex-1 border-b border-accent bg-transparent text-sm text-text-primary outline-none"
    />
  )
}

function ItemIcon({ item, className }) {
  if (item.type === 'folder') return <FolderIcon className={`${className} text-accent`} />
  return <FileKindIcon filename={item.data.filename} contentType={item.data.content_type} className={className} />
}

function selectionClasses({ selected, dropTarget }) {
  if (dropTarget) return 'bg-accent/25 outline outline-1 outline-accent'
  if (selected) return 'bg-accent/15 text-text-primary'
  return 'text-text-primary hover:bg-surface'
}

/** Fila del modo lista. `compact` es la variante del widget del panel. */
export function ExplorerRow({
  item,
  selected,
  cursor,
  cut,
  dropTarget,
  compact,
  showCheckbox,
  rename,
  domProps,
  elementRef,
}) {
  const isFolder = item.type === 'folder'
  const name = isFolder ? item.data.name : item.data.filename

  return (
    <div
      ref={elementRef}
      role="option"
      aria-selected={selected}
      {...domProps}
      className={`flex cursor-default items-center gap-2.5 px-3 text-sm select-none ${
        compact ? 'py-2.5 sm:py-1.5' : 'py-3 sm:py-2'
      } ${selectionClasses({ selected, dropTarget })} ${cut ? 'opacity-45' : ''} ${
        cursor ? 'ring-1 ring-accent/60 ring-inset' : ''
      }`}
    >
      {showCheckbox && (
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
            selected ? 'border-accent bg-accent/20 text-accent' : 'border-border text-transparent'
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      )}

      <ItemIcon item={item} className="h-4 w-4 shrink-0" />

      {rename ? (
        <RenameInput initialValue={name} isFolder={isFolder} onSubmit={rename.onSubmit} onCancel={rename.onCancel} />
      ) : (
        <span className="min-w-0 flex-1">
          <span className="block truncate">{name}</span>
          {/* En móvil no caben las columnas de tamaño y fecha, así que bajan a una
              segunda línea: sin esto un archivo no dice nada más que su nombre. */}
          <span className="block truncate font-mono text-[10px] text-text-secondary sm:hidden">
            {isFolder ? 'Carpeta' : `${formatBytes(item.data.size_bytes)} · ${formatDate(item.data.created_at)}`}
          </span>
        </span>
      )}

      {!isFolder && item.data.task_id && (
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-accent" aria-label="Vinculado a una tarea" />
      )}

      <span className="hidden w-16 shrink-0 text-right font-mono text-xs text-text-secondary sm:inline">
        {isFolder ? '—' : formatBytes(item.data.size_bytes)}
      </span>
      <span className="hidden w-20 shrink-0 text-right font-mono text-xs text-text-secondary sm:inline">
        {formatDate(item.data.created_at)}
      </span>
    </div>
  )
}

/** Celda del modo cuadrícula (iconos grandes). */
export function ExplorerTile({
  item,
  selected,
  cursor,
  cut,
  dropTarget,
  showCheckbox,
  rename,
  domProps,
  elementRef,
}) {
  const isFolder = item.type === 'folder'
  const name = isFolder ? item.data.name : item.data.filename
  const extension = isFolder ? '' : fileExtension(name)

  return (
    <div
      ref={elementRef}
      role="option"
      aria-selected={selected}
      {...domProps}
      className={`relative flex cursor-default flex-col items-center gap-2 border border-transparent p-2 text-center select-none ${selectionClasses(
        { selected, dropTarget },
      )} ${cut ? 'opacity-45' : ''} ${cursor ? 'ring-1 ring-accent/60 ring-inset' : ''}`}
    >
      {showCheckbox && (
        <span
          className={`absolute top-1 left-1 flex h-5 w-5 items-center justify-center border ${
            selected ? 'border-accent bg-accent/20 text-accent' : 'border-border text-transparent'
          }`}
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="relative flex h-12 w-12 items-center justify-center">
        <ItemIcon item={item} className="h-10 w-10" />
        {extension && (
          <span className="absolute -bottom-0.5 rounded-sm bg-surface px-1 font-mono text-[9px] tracking-wider text-text-secondary uppercase">
            {extension.slice(0, 4)}
          </span>
        )}
      </div>

      {rename ? (
        <RenameInput initialValue={name} isFolder={isFolder} onSubmit={rename.onSubmit} onCancel={rename.onCancel} />
      ) : (
        <span className="line-clamp-2 w-full text-xs break-words">{name}</span>
      )}

      <span className="font-mono text-[10px] text-text-secondary">
        {isFolder ? 'Carpeta' : formatBytes(item.data.size_bytes)}
      </span>
    </div>
  )
}

const COLUMNS = [
  { key: 'name', label: 'Nombre', className: 'flex-1 text-left' },
  { key: 'size', label: 'Tamaño', className: 'w-16 text-right' },
  { key: 'date', label: 'Fecha', className: 'w-20 text-right' },
]

/** Cabecera de columnas del modo lista: clic para ordenar, otra vez para invertir. */
export function ColumnHeader({ sort, onSort }) {
  return (
    <div className="hidden items-center gap-2.5 border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] text-text-secondary uppercase sm:flex">
      <span className="h-4 w-4 shrink-0" />
      {COLUMNS.map((column) => (
        <button
          key={column.key}
          type="button"
          onClick={() => onSort(column.key)}
          className={`shrink-0 transition-colors hover:text-accent ${column.className} ${
            sort.key === column.key ? 'text-accent' : ''
          }`}
        >
          {column.label}
          {sort.key === column.key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
        </button>
      ))}
    </div>
  )
}
