import { useState } from 'react'

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
          className="shrink-0 font-mono text-xs text-text-secondary hover:text-danger"
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
        <li key={item.id} className="group flex items-center gap-2 px-1 py-1">
          <button
            type="button"
            onClick={() => onToggleItem(item)}
            className={`h-3.5 w-3.5 shrink-0 border ${item.is_done ? 'border-success bg-success' : 'border-border'}`}
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
          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            className="shrink-0 font-mono text-xs text-text-secondary opacity-0 hover:text-danger group-hover:opacity-100"
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
