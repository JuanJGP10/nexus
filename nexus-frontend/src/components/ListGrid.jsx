import { useEffect, useRef, useState } from 'react'
import { filesApi } from '../api/endpoints/files'
import { useFilePreview } from '../hooks/useFilePreview'
import { FilePreviewModal } from './FilePreviewModal'

function ListCard({ list, onRenameTitle, onAddItem, onToggleItem, onEditItemText, onRemoveItem, onRemoveList }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(list.title)
  const [newItemText, setNewItemText] = useState('')

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

      <ItemList items={list.items} onToggleItem={onToggleItem} onEditItemText={onEditItemText} onRemoveItem={onRemoveItem} />

      <form onSubmit={addItem} className="border-t border-border px-3 py-1.5">
        <input
          value={newItemText}
          onChange={(event) => setNewItemText(event.target.value)}
          placeholder="+ elemento…"
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none"
        />
      </form>
    </div>
  )
}

function ItemAttachments({ itemId }) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const containerRef = useRef(null)

  async function loadFiles() {
    try {
      setFiles(await filesApi.list({ day_list_item_id: itemId }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next) await loadFiles()
  }

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleUpload(event) {
    const uploaded = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (uploaded.length === 0) return
    try {
      for (const file of uploaded) {
        await filesApi.upload(file, { dayListItemId: itemId })
      }
      await loadFiles()
    } catch (err) {
      setError(err.message)
    }
  }

  async function unlink(fileId) {
    try {
      await filesApi.update(fileId, { day_list_item_id: null })
      await loadFiles()
    } catch (err) {
      setError(err.message)
    }
  }

  const { preview, openFile, closePreview } = useFilePreview()

  async function openFileItem(fileId) {
    try {
      await openFile(fileId)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        className={`relative p-1 before:absolute before:-inset-2 before:content-[''] ${
          open ? 'text-accent' : 'text-text-secondary hover:text-accent'
        }`}
        aria-label="Adjuntos"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.375 12.739l-6.75 6.75a4.5 4.5 0 01-6.364-6.364l9-9a3 3 0 014.243 4.243l-8.91 8.909a1.5 1.5 0 01-2.122-2.12l7.593-7.594"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-60 border border-border bg-surface px-2 py-2">
          {error && <p className="mb-1 font-mono text-[11px] text-danger">{error}</p>}
          <ul className="space-y-0.5">
            {files.length === 0 && <li className="font-mono text-xs text-text-secondary">Sin adjuntos.</li>}
            {files.map((file) => (
              <li key={file.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openFileItem(file.id)}
                  className="flex-1 truncate text-left text-xs text-text-primary hover:text-accent"
                >
                  {file.filename}
                </button>
                <button
                  type="button"
                  onClick={() => unlink(file.id)}
                  className="shrink-0 font-mono text-xs text-text-secondary hover:text-danger"
                  aria-label="Desvincular archivo"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
          <div className="mt-1.5 border-t border-border pt-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-mono text-[11px] tracking-[0.1em] text-accent uppercase hover:text-accent-hover"
            >
              + Adjuntar
            </button>
          </div>
        </div>
      )}
      <FilePreviewModal preview={preview} onClose={closePreview} />
    </div>
  )
}

function ItemList({ items, onToggleItem, onEditItemText, onRemoveItem }) {
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
      {items.length === 0 && (
        <li className="px-1 py-1 font-mono text-xs text-text-secondary">Sin elementos.</li>
      )}
      {items.map((item) => (
        <li key={item.id} className="group relative flex items-center gap-2 px-1 py-1">
          <button
            type="button"
            onClick={() => onToggleItem(item)}
            className={`relative h-3.5 w-3.5 shrink-0 border before:absolute before:-inset-2 before:content-[''] ${item.is_done ? 'border-success bg-success' : 'border-border'}`}
            aria-label="Marcar como hecho"
          />
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
              className="flex-1 border-b border-accent bg-transparent text-sm text-text-primary outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => startEdit(item)}
              className={`flex-1 truncate text-left text-sm ${
                item.is_done ? 'text-text-secondary line-through' : 'text-text-primary'
              }`}
            >
              {item.text}
            </button>
          )}
          <ItemAttachments itemId={item.id} />
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="relative shrink-0 p-1 font-mono text-xs text-text-secondary opacity-100 before:absolute before:-inset-2 before:content-[''] hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Eliminar elemento"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Grid de listas tipo checklist, sin drag ni resize: se van colocando en orden de creación. */
export function ListGrid({ lists, onAddList, onRenameList, onAddItem, onToggleItem, onEditItemText, onRemoveItem, onRemoveList }) {
  return (
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
  )
}
