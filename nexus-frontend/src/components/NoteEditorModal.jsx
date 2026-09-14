import { useEffect, useState } from 'react'
import { notesApi } from '../api/endpoints/notes'
import { formatDateTime } from '../lib/format'

export function NoteEditorModal({ noteId, onClose }) {
  const [note, setNote] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    notesApi
      .get(noteId)
      .then((data) => {
        setNote(data)
        setTitle(data.title)
        setContent(data.content)
      })
      .catch((err) => setError(err.message))
  }, [noteId])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function commitTitle() {
    const trimmed = title.trim() || 'Sin título'
    setTitle(trimmed)
    if (trimmed === note.title) return
    try {
      const updated = await notesApi.update(noteId, { title: trimmed })
      setNote(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  async function commitContent() {
    if (content === note.content) return
    try {
      const updated = await notesApi.update(noteId, { content })
      setNote(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    try {
      await notesApi.remove(noteId)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="hud-panel flex h-dvh w-full flex-col sm:h-[70vh] sm:max-w-2xl"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
            placeholder="Título…"
            className="w-full bg-transparent text-lg text-text-primary outline-none placeholder:text-text-secondary"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent sm:px-2 sm:py-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        {error && (
          <p className="border-b border-danger/40 bg-danger/10 px-4 py-2 font-mono text-xs text-danger">{error}</p>
        )}

        {!note ? (
          <p className="flex-1 p-4 font-mono text-xs text-text-secondary">Cargando…</p>
        ) : (
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onBlur={commitContent}
            placeholder="Escribe aquí…"
            className="flex-1 resize-none bg-transparent p-4 text-sm text-text-primary outline-none placeholder:text-text-secondary"
          />
        )}

        <footer className="flex items-center justify-between border-t border-border px-4 py-2">
          <span className="font-mono text-[11px] text-text-secondary">
            {note && `Editado ${formatDateTime(note.updated_at)}`}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            className="font-mono text-xs text-danger hover:underline"
          >
            Eliminar nota
          </button>
        </footer>
      </div>
    </div>
  )
}
