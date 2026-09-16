import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filesApi } from '../api/endpoints/files'
import { useFilePreview } from '../hooks/useFilePreview'
import { FileKindIcon } from './files/icons'
import { FilePreviewModal } from './FilePreviewModal'

function PaperclipIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.375 12.739l-6.75 6.75a4.5 4.5 0 01-6.364-6.364l9-9a3 3 0 014.243 4.243l-8.91 8.909a1.5 1.5 0 01-2.122-2.12l7.593-7.594"
      />
    </svg>
  )
}

/**
 * Adjunto de un elemento, visible en su propia línea.
 *
 * Antes los adjuntos vivían dentro de un popover que había que abrir con el clip:
 * no se sabía qué tenía cada elemento sin ir abriéndolos uno a uno, y con varias
 * listas abiertas los popovers se tapaban entre ellos. Ahora se ven siempre.
 */
function AttachmentChip({ file, onOpen, onUnlink }) {
  return (
    <span className="group/chip inline-flex max-w-36 shrink-0 items-center border border-border bg-bg/40">
      <button
        type="button"
        onClick={() => onOpen(file.id)}
        title={file.filename}
        className="flex min-w-0 items-center gap-1 px-1.5 py-0.5 text-text-secondary transition-colors hover:text-accent"
      >
        <FileKindIcon filename={file.filename} contentType={file.content_type} className="h-3 w-2.5 shrink-0" />
        <span className="truncate text-[11px]">{file.filename}</span>
      </button>
      <button
        type="button"
        onClick={() => onUnlink(file.id)}
        aria-label={`Quitar ${file.filename}`}
        className="shrink-0 px-1 py-0.5 font-mono text-[10px] text-text-secondary transition-colors hover:text-danger sm:opacity-0 sm:group-hover/chip:opacity-100"
      >
        ✕
      </button>
    </span>
  )
}

function ItemList({ items, attachmentsByItem, onToggleItem, onEditItemText, onRemoveItem, onAttach, onOpenFile, onUnlinkFile }) {
  const [editingId, setEditingId] = useState(null)
  const [draftText, setDraftText] = useState('')

  function startEdit(item) {
    setEditingId(item.id)
    setDraftText(item.text)
  }

  function commitEdit(item) {
    setEditingId(null)
    const text = draftText.trim()
    if (text && text !== item.text) onEditItemText(item.id, text)
  }

  return (
    <ul className="flex-1 space-y-0.5 overflow-auto p-2">
      {items.length === 0 && <li className="px-1 py-1 font-mono text-xs text-text-secondary">Sin elementos.</li>}
      {items.map((item) => {
        const files = attachmentsByItem.get(item.id) ?? []
        return (
          <li key={item.id} className="group flex items-start gap-2 px-1 py-1">
            <button
              type="button"
              onClick={() => onToggleItem(item)}
              className={`relative mt-1 h-3.5 w-3.5 shrink-0 border before:absolute before:-inset-2 before:content-[''] ${
                item.is_done ? 'border-success bg-success' : 'border-border'
              }`}
              aria-label="Marcar como hecho"
            />

            {/* El texto encoge y los adjuntos no: con un archivo todo cabe en la
                misma línea, y solo cuando hay varios pasan a la siguiente. */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                  onBlur={() => commitEdit(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur()
                    if (event.key === 'Escape') setEditingId(null)
                  }}
                  className="w-full border-b border-accent bg-transparent text-sm text-text-primary outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className={`min-w-0 shrink truncate text-left text-sm ${
                    item.is_done ? 'text-text-secondary line-through' : 'text-text-primary'
                  }`}
                >
                  {item.text}
                </button>
              )}

              {files.map((file) => (
                <AttachmentChip key={file.id} file={file} onOpen={onOpenFile} onUnlink={onUnlinkFile} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onAttach(item.id)}
              className="relative mt-0.5 shrink-0 p-1 text-text-secondary before:absolute before:-inset-2 before:content-[''] hover:text-accent"
              aria-label="Adjuntar archivo"
              title="Adjuntar archivo"
            >
              <PaperclipIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemoveItem(item.id)}
              className="relative mt-0.5 shrink-0 p-1 font-mono text-xs text-text-secondary opacity-100 before:absolute before:-inset-2 before:content-[''] hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Eliminar elemento"
            >
              ✕
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function ListCard({
  list,
  onRenameTitle,
  onAddItem,
  onToggleItem,
  onEditItemText,
  onRemoveItem,
  onRemoveList,
  onOpenFile,
  onError,
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(list.title)
  const [newItemText, setNewItemText] = useState('')
  const [attachments, setAttachments] = useState([])

  const fileInputRef = useRef(null)
  const uploadTargetRef = useRef(null)

  // Una sola petición por lista: pedir los adjuntos elemento a elemento serían
  // tantas llamadas como elementos tenga, y aquí se pintan todos a la vez.
  const loadAttachments = useCallback(async () => {
    try {
      setAttachments(await filesApi.list({ day_list_id: list.id }))
    } catch (err) {
      onError(err.message)
    }
  }, [list.id, onError])

  useEffect(() => {
    loadAttachments()
  }, [loadAttachments])

  const attachmentsByItem = useMemo(() => {
    const grouped = new Map()
    for (const file of attachments) {
      const current = grouped.get(file.day_list_item_id)
      if (current) current.push(file)
      else grouped.set(file.day_list_item_id, [file])
    }
    return grouped
  }, [attachments])

  function commitTitle() {
    setEditingTitle(false)
    const title = draftTitle.trim()
    if (title && title !== list.title) onRenameTitle(title)
    else setDraftTitle(list.title)
  }

  function addItem(event) {
    event.preventDefault()
    const text = newItemText.trim()
    if (!text) return
    onAddItem(text)
    setNewItemText('')
  }

  /** Un único `<input type=file>` por lista; el clip pulsado deja su id aquí. */
  function requestAttach(itemId) {
    uploadTargetRef.current = itemId
    fileInputRef.current?.click()
  }

  async function handleUpload(event) {
    const uploaded = Array.from(event.target.files ?? [])
    event.target.value = ''
    const itemId = uploadTargetRef.current
    uploadTargetRef.current = null
    if (!itemId || uploaded.length === 0) return
    try {
      for (const file of uploaded) await filesApi.upload(file, { dayListItemId: itemId })
      await loadAttachments()
    } catch (err) {
      onError(err.message)
    }
  }

  async function unlinkFile(fileId) {
    try {
      await filesApi.update(fileId, { day_list_item_id: null })
      await loadAttachments()
    } catch (err) {
      onError(err.message)
    }
  }

  return (
    <div className="hud-panel flex h-64 flex-col">
      <span className="hud-corner-bl" />
      <span className="hud-corner-br" />

      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        {editingTitle ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'Escape') {
                setDraftTitle(list.title)
                setEditingTitle(false)
              }
            }}
            className="w-full border-b border-accent bg-transparent text-sm text-text-primary outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="truncate text-left text-sm text-text-primary hover:text-accent"
          >
            {list.title}
          </button>
        )}
        <button
          type="button"
          onClick={onRemoveList}
          className="relative shrink-0 p-1 font-mono text-xs text-text-secondary before:absolute before:-inset-2 before:content-[''] hover:text-danger"
          aria-label="Eliminar lista"
        >
          ✕
        </button>
      </header>

      <ItemList
        items={list.items}
        attachmentsByItem={attachmentsByItem}
        onToggleItem={onToggleItem}
        onEditItemText={onEditItemText}
        onRemoveItem={onRemoveItem}
        onAttach={requestAttach}
        onOpenFile={onOpenFile}
        onUnlinkFile={unlinkFile}
      />

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />

      <form onSubmit={addItem} className="border-t border-border px-3 py-1.5">
        <input
          value={newItemText}
          onChange={(event) => setNewItemText(event.target.value)}
          placeholder="+ elemento…"
          className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
        />
      </form>
    </div>
  )
}

/** Grid de listas tipo checklist, sin drag ni resize: se van colocando en orden de creación. */
export function ListGrid({
  lists,
  onAddList,
  onRenameList,
  onAddItem,
  onToggleItem,
  onEditItemText,
  onRemoveItem,
  onRemoveList,
}) {
  const [error, setError] = useState(null)
  const { preview, openFile, closePreview } = useFilePreview()

  // Un solo modal de preview para todo el grid: antes cada elemento montaba el suyo.
  const openFileSafe = useCallback(
    async (fileId) => {
      try {
        await openFile(fileId)
      } catch (err) {
        setError(err.message)
      }
    },
    [openFile],
  )

  return (
    <>
      {error && (
        <p className="mb-3 flex items-start gap-2 border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
          <span className="flex-1 break-words">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Descartar el error">
            ✕
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            onRenameTitle={(title) => onRenameList(list.id, title)}
            onAddItem={(text) => onAddItem(list.id, text)}
            onToggleItem={(item) => onToggleItem(list.id, item)}
            onEditItemText={(itemId, text) => onEditItemText(list.id, itemId, text)}
            onRemoveItem={(itemId) => onRemoveItem(list.id, itemId)}
            onRemoveList={() => onRemoveList(list.id)}
            onOpenFile={openFileSafe}
            onError={setError}
          />
        ))}

        <button
          type="button"
          onClick={onAddList}
          className="flex h-64 flex-col items-center justify-center gap-1 border border-dashed border-border text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="font-mono text-xs tracking-[0.1em] uppercase">Nueva lista</span>
        </button>
      </div>

      <FilePreviewModal preview={preview} onClose={closePreview} />
    </>
  )
}
