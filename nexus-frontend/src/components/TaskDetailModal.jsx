import { useEffect, useRef, useState } from 'react'
import { filesApi } from '../api/endpoints/files'
import { tasksApi } from '../api/endpoints/tasks'
import { formatBytes } from '../lib/format'

const PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
]

export function TaskDetailModal({ taskId, onClose }) {
  const [task, setTask] = useState(null)
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [description, setDescription] = useState('')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState(null)
  const [draftSubtaskTitle, setDraftSubtaskTitle] = useState('')

  const fileInputRef = useRef(null)

  async function loadTask() {
    try {
      const data = await tasksApi.get(taskId)
      setTask(data)
      setDescription(data.description ?? '')
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadFiles() {
    try {
      setFiles(await filesApi.list({ task_id: taskId }))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadTask()
    loadFiles()
  }, [taskId])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function updateTask(fields) {
    try {
      const updated = await tasksApi.update(taskId, fields)
      setTask(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  function commitTitle() {
    setEditingTitle(false)
    const title = draftTitle.trim()
    if (title && title !== task.title) updateTask({ title })
  }

  function commitDescription() {
    if (description !== (task.description ?? '')) updateTask({ description: description || null })
  }

  async function addSubtask(event) {
    event.preventDefault()
    const title = newSubtaskTitle.trim()
    if (!title) return
    try {
      await tasksApi.addSubtask(taskId, title)
      setNewSubtaskTitle('')
      await loadTask()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleSubtask(subtask) {
    try {
      await tasksApi.updateSubtask(taskId, subtask.id, { is_done: !subtask.is_done })
      await loadTask()
    } catch (err) {
      setError(err.message)
    }
  }

  function startEditSubtask(subtask) {
    setEditingSubtaskId(subtask.id)
    setDraftSubtaskTitle(subtask.title)
  }

  async function commitSubtaskTitle(subtask) {
    setEditingSubtaskId(null)
    const title = draftSubtaskTitle.trim()
    if (!title || title === subtask.title) return
    try {
      await tasksApi.updateSubtask(taskId, subtask.id, { title })
      await loadTask()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeSubtask(subtaskId) {
    try {
      await tasksApi.removeSubtask(taskId, subtaskId)
      await loadTask()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpload(event) {
    const uploaded = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (uploaded.length === 0) return
    try {
      for (const file of uploaded) {
        await filesApi.upload(file, { taskId })
      }
      await loadFiles()
    } catch (err) {
      setError(err.message)
    }
  }

  async function unlinkFile(fileId) {
    try {
      await filesApi.update(fileId, { task_id: null })
      await loadFiles()
    } catch (err) {
      setError(err.message)
    }
  }

  async function downloadFile(fileId) {
    try {
      const { blob, filename } = await filesApi.download(fileId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
        <p className="font-mono text-xs text-text-secondary">Cargando…</p>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="hud-panel flex h-dvh w-full flex-col sm:h-auto sm:max-h-[85vh] sm:max-w-2xl"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          {editingTitle ? (
            <input
              autoFocus
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitTitle}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
                if (event.key === 'Escape') setEditingTitle(false)
              }}
              className="w-full border-b border-accent bg-transparent text-lg text-text-primary outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftTitle(task.title)
                setEditingTitle(true)
              }}
              className={`truncate text-left text-lg hover:text-accent ${
                task.is_done ? 'text-text-secondary line-through' : 'text-text-primary'
              }`}
            >
              {task.title}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent sm:px-2 sm:py-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-auto p-4">
          {error && (
            <p className="border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">{error}</p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => updateTask({ is_done: !task.is_done })}
              className={`relative h-5 w-5 shrink-0 border before:absolute before:-inset-2 before:content-[''] ${task.is_done ? 'border-success bg-success' : 'border-border'}`}
              aria-label="Marcar como hecha"
            />
            <div className="flex gap-1 font-mono text-[11px] tracking-[0.1em] uppercase">
              {PRIORITIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateTask({ priority: option.value })}
                  className={`border px-3 py-2 transition-colors sm:px-2 sm:py-1 ${
                    task.priority === option.value
                      ? 'border-accent text-accent'
                      : 'border-border text-text-secondary hover:border-text-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 font-mono text-[11px] tracking-[0.15em] text-text-secondary uppercase">Descripción</p>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={commitDescription}
              placeholder="Sin descripción…"
              rows={3}
              className="w-full resize-none border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] tracking-[0.15em] text-text-secondary uppercase">Subtareas</p>
            <ul className="space-y-0.5">
              {task.subtasks.length === 0 && (
                <li className="font-mono text-xs text-text-secondary">Sin subtareas.</li>
              )}
              {task.subtasks.map((subtask) => (
                <li key={subtask.id} className="group flex items-center gap-2 px-1 py-1">
                  <button
                    type="button"
                    onClick={() => toggleSubtask(subtask)}
                    className={`relative h-3.5 w-3.5 shrink-0 border before:absolute before:-inset-2 before:content-[''] ${
                      subtask.is_done ? 'border-success bg-success' : 'border-border'
                    }`}
                    aria-label="Marcar como hecha"
                  />
                  {editingSubtaskId === subtask.id ? (
                    <input
                      autoFocus
                      value={draftSubtaskTitle}
                      onChange={(event) => setDraftSubtaskTitle(event.target.value)}
                      onBlur={() => commitSubtaskTitle(subtask)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') event.currentTarget.blur()
                        if (event.key === 'Escape') setEditingSubtaskId(null)
                      }}
                      className="flex-1 border-b border-accent bg-transparent text-sm text-text-primary outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditSubtask(subtask)}
                      className={`flex-1 truncate text-left text-sm ${
                        subtask.is_done ? 'text-text-secondary line-through' : 'text-text-primary'
                      }`}
                    >
                      {subtask.title}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSubtask(subtask.id)}
                    className="relative shrink-0 p-1 font-mono text-xs text-text-secondary opacity-100 before:absolute before:-inset-2 before:content-[''] hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Eliminar subtarea"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={addSubtask} className="mt-1 border-t border-border pt-1.5">
              <input
                value={newSubtaskTitle}
                onChange={(event) => setNewSubtaskTitle(event.target.value)}
                placeholder="+ subtarea…"
                className="w-full bg-transparent px-1 py-1 text-sm text-text-primary placeholder:text-text-secondary outline-none"
              />
            </form>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] tracking-[0.15em] text-text-secondary uppercase">Archivos</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-mono text-[11px] tracking-[0.1em] text-accent uppercase hover:text-accent-hover"
              >
                + Adjuntar
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
            </div>
            <ul className="space-y-0.5">
              {files.length === 0 && <li className="font-mono text-xs text-text-secondary">Sin archivos.</li>}
              {files.map((file) => (
                <li key={file.id} className="group flex items-center gap-2 px-1 py-1">
                  <button
                    type="button"
                    onClick={() => downloadFile(file.id)}
                    className="flex-1 truncate text-left text-sm text-text-primary hover:text-accent"
                  >
                    {file.filename}
                  </button>
                  <span className="font-mono text-xs text-text-secondary">{formatBytes(file.size_bytes)}</span>
                  <button
                    type="button"
                    onClick={() => unlinkFile(file.id)}
                    className="relative shrink-0 p-1 font-mono text-xs text-text-secondary opacity-100 before:absolute before:-inset-2 before:content-[''] hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Desvincular archivo"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
