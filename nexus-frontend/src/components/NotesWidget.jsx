import { useEffect, useState } from 'react'
import { notesApi } from '../api/endpoints/notes'
import { NoteEditorModal } from './NoteEditorModal'
import { Panel } from './Panel'

export function NotesWidget() {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [openNoteId, setOpenNoteId] = useState(null)
  const [error, setError] = useState(null)

  async function loadNotes() {
    try {
      setNotes(await notesApi.list())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [])

  async function createNote() {
    try {
      const note = await notesApi.create({ title: 'Nueva nota' })
      setOpenNoteId(note.id)
      await loadNotes()
    } catch (err) {
      setError(err.message)
    }
  }

  function closeEditor() {
    setOpenNoteId(null)
    loadNotes()
  }

  return (
    <Panel
      title="Notas"
      className="max-h-80 min-h-0 flex-1"
      action={
        <button
          type="button"
          onClick={createNote}
          className="font-mono text-[11px] tracking-[0.15em] text-accent uppercase hover:text-accent-hover"
        >
          + Nueva
        </button>
      }
      bodyClassName="p-2"
    >
      {error && <p className="p-2 font-mono text-xs text-danger">{error}</p>}

      {isLoading ? (
        <p className="p-3 font-mono text-xs text-text-secondary">Cargando…</p>
      ) : notes.length === 0 ? (
        <p className="p-3 font-mono text-xs text-text-secondary">Sin notas todavía.</p>
      ) : (
        <ul className="space-y-1">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => setOpenNoteId(note.id)}
                className="block w-full px-2 py-1.5 text-left hover:bg-bg"
              >
                <p className="truncate text-sm text-text-primary">{note.title}</p>
                {note.content && (
                  <p className="truncate font-mono text-xs text-text-secondary">{note.content}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {openNoteId && <NoteEditorModal noteId={openNoteId} onClose={closeEditor} />}
    </Panel>
  )
}
