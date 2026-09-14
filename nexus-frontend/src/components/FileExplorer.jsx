import { useCallback, useEffect, useRef, useState } from 'react'
import { filesApi } from '../api/endpoints/files'
import { foldersApi } from '../api/endpoints/folders'
import { tasksApi } from '../api/endpoints/tasks'
import { formatBytes, formatDate } from '../lib/format'
import { Panel } from './Panel'

function FolderIcon({ className }) {
  return (
    <svg viewBox="0 0 20 16" fill="none" className={className}>
      <path
        d="M1 2.5C1 1.67 1.67 1 2.5 1h4.4c.5 0 .96.24 1.25.65l.9 1.25H17.5c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-15C1.67 15 1 14.33 1 13.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function FileIcon({ className }) {
  return (
    <svg viewBox="0 0 14 18" fill="none" className={className}>
      <path
        d="M1.5 1.5h7L12.5 5.5V16.5h-11v-15Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8.5 1.5v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

export function FileExplorer() {
  const [path, setPath] = useState([{ id: null, name: 'Inicio' }])
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [tasks, setTasks] = useState([])

  const containerRef = useRef(null)
  const fileInputRef = useRef(null)
  const newFolderInputRef = useRef(null)

  const currentFolderId = path[path.length - 1].id
  const items = [
    ...folders.map((folder) => ({ type: 'folder', data: folder })),
    ...files.map((file) => ({ type: 'file', data: file })),
  ]
  const selectedItem = items[selectedIndex]

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [folderList, fileList] = await Promise.all([
        foldersApi.list(currentFolderId ?? undefined),
        filesApi.list({ folder_id: currentFolderId ?? undefined }),
      ])
      setFolders(folderList)
      setFiles(fileList)
      setSelectedIndex(folderList.length + fileList.length > 0 ? 0 : -1)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [currentFolderId])

  function focusContainer() {
    containerRef.current?.focus()
  }

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    focusContainer()
  }, [])

  useEffect(() => {
    tasksApi.list({ is_done: false }).then(setTasks).catch(() => {})
  }, [])

  useEffect(() => {
    if (creatingFolder) newFolderInputRef.current?.focus()
  }, [creatingFolder])

  function openFolder(folder) {
    setPath((current) => [...current, { id: folder.id, name: folder.name }])
  }

  function goToBreadcrumb(index) {
    setPath((current) => current.slice(0, index + 1))
  }

  function goUp() {
    if (path.length > 1) setPath((current) => current.slice(0, -1))
  }

  async function openItem(item) {
    if (!item) return
    if (item.type === 'folder') {
      openFolder(item.data)
      return
    }
    try {
      const { blob, filename } = await filesApi.download(item.data.id)
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

  async function deleteItem(item) {
    if (!item) return
    try {
      if (item.type === 'folder') {
        await foldersApi.remove(item.data.id)
      } else {
        // Sin vista de papelera todavía: borrar de verdad (papelera + permanente) en un solo paso.
        await filesApi.trash(item.data.id)
        await filesApi.remove(item.data.id)
      }
      await load()
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
        await filesApi.upload(file, { folderId: currentFolderId ?? undefined })
      }
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      focusContainer()
    }
  }

  async function linkToTask(fileId, taskId) {
    try {
      await filesApi.update(fileId, { task_id: taskId || null })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      focusContainer()
    }
  }

  async function submitNewFolder(event) {
    event.preventDefault()
    const name = newFolderName.trim()
    setCreatingFolder(false)
    setNewFolderName('')
    if (!name) {
      focusContainer()
      return
    }
    try {
      await foldersApi.create({ name, parent_id: currentFolderId ?? undefined })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      focusContainer()
    }
  }

  function handleKeyDown(event) {
    if (event.target.tagName === 'INPUT') return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((index) => Math.min(index + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' || event.key === 'ArrowRight') {
      event.preventDefault()
      openItem(items[selectedIndex])
    } else if (event.key === 'Backspace' || event.key === 'ArrowLeft') {
      event.preventDefault()
      goUp()
    } else if (event.key === 'Delete') {
      event.preventDefault()
      deleteItem(items[selectedIndex])
    }
  }

  return (
    <Panel
      title="Archivos"
      className="h-full"
      bodyClassName="flex flex-col"
      action={
        <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.1em] uppercase">
          {selectedItem?.type === 'file' && (
            <select
              value={selectedItem.data.task_id ?? ''}
              onChange={(event) => linkToTask(selectedItem.data.id, event.target.value ? Number(event.target.value) : null)}
              className="max-w-32 border border-border bg-bg px-1.5 py-0.5 text-text-secondary normal-case outline-none focus:border-accent"
            >
              <option value="">Sin tarea</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setCreatingFolder(true)}
            className="text-text-secondary hover:text-accent"
          >
            + Carpeta
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-text-secondary hover:text-accent"
          >
            Subir
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        </div>
      }
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2 font-mono text-xs text-text-secondary">
        {path.map((crumb, index) => (
          <span key={crumb.id ?? 'root'} className="flex items-center gap-1">
            {index > 0 && <span className="text-border">/</span>}
            <button
              type="button"
              onClick={() => goToBreadcrumb(index)}
              className={
                index === path.length - 1
                  ? 'text-accent'
                  : 'hover:text-text-primary'
              }
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {error && (
        <p className="border-b border-danger/40 bg-danger/10 px-3 py-1.5 font-mono text-xs text-danger">
          {error}
        </p>
      )}

      {/* Listado explorable */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-auto outline-none focus:bg-accent/[0.02]"
      >
        {creatingFolder && (
          <form onSubmit={submitNewFolder} className="flex items-center gap-2 px-3 py-1.5">
            <FolderIcon className="h-3.5 w-4 shrink-0 text-accent" />
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onBlur={() => setCreatingFolder(false)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setCreatingFolder(false)
                  focusContainer()
                }
              }}
              placeholder="Nombre de la carpeta…"
              className="flex-1 border-b border-accent bg-transparent text-sm text-text-primary outline-none"
            />
          </form>
        )}

        {isLoading ? (
          <p className="px-3 py-4 font-mono text-xs text-text-secondary">Cargando…</p>
        ) : items.length === 0 && !creatingFolder ? (
          <p className="px-3 py-4 font-mono text-xs text-text-secondary">Carpeta vacía.</p>
        ) : (
          items.map((item, index) => {
            const isSelected = index === selectedIndex
            const isFolder = item.type === 'folder'
            return (
              <div
                key={`${item.type}-${item.data.id}`}
                onClick={() => {
                  setSelectedIndex(index)
                  focusContainer()
                }}
                onDoubleClick={() => openItem(item)}
                className={`flex cursor-default items-center gap-2 px-3 py-1.5 text-sm ${
                  isSelected ? 'bg-accent/15 text-text-primary' : 'text-text-primary hover:bg-surface'
                }`}
              >
                {isFolder ? (
                  <FolderIcon className="h-3.5 w-4 shrink-0 text-accent" />
                ) : (
                  <FileIcon className="h-4 w-3.5 shrink-0 text-text-secondary" />
                )}
                <span className="flex-1 truncate">{isFolder ? item.data.name : item.data.filename}</span>
                {!isFolder && item.data.task_id && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" title="Vinculado a una tarea" />
                )}
                <span className="w-16 shrink-0 text-right font-mono text-xs text-text-secondary">
                  {isFolder ? '' : formatBytes(item.data.size_bytes)}
                </span>
                <span className="w-20 shrink-0 text-right font-mono text-xs text-text-secondary">
                  {formatDate(item.data.created_at)}
                </span>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-border px-3 py-1 font-mono text-[10px] tracking-[0.1em] text-text-secondary uppercase">
        ↑↓ mover · Enter/→ abrir · ←/Retroceso subir · Supr eliminar
      </div>
    </Panel>
  )
}
