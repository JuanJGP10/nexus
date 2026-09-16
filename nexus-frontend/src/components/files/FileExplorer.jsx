import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filesApi } from '../../api/endpoints/files'
import { foldersApi } from '../../api/endpoints/folders'
import { useFileClipboard } from '../../hooks/useFileClipboard'
import { useFilePreview } from '../../hooks/useFilePreview'
import {
  DRAG_MIME,
  collectDropEntries,
  collectInputEntries,
  isCoarsePointer,
  itemKey,
  itemName,
  matchesQuery,
  normalizeForSearch,
  sortItems,
  toFileItem,
  toFolderItem,
} from '../../utils/files'
import { formatBytes } from '../../utils/format'
import { FilePreviewModal } from '../FilePreviewModal'
import { Panel } from '../Panel'
import { ConfirmDialog } from './ConfirmDialog'
import { ContextMenu } from './ContextMenu'
import { ColumnHeader, ExplorerRow, ExplorerTile } from './ExplorerItems'
import { ExplorerToolbar } from './ExplorerToolbar'
import { FolderPickerModal } from './FolderPickerModal'
import { ShortcutsHelp } from './ShortcutsHelp'
import { TaskLinkModal } from './TaskLinkModal'
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  CutIcon,
  DownloadIcon,
  FolderIcon,
  LinkIcon,
  MoveIcon,
  NewFolderIcon,
  OpenIcon,
  PasteIcon,
  RenameIcon,
  RestoreIcon,
  TrashIcon,
  UploadIcon,
} from './icons'

const ROOT_CRUMB = { id: null, name: 'Inicio' }
const VIEW_STORAGE_KEY = 'nexus-files-view'
const SORT_STORAGE_KEY = 'nexus-files-sort'
const LONG_PRESS_MS = 450
const SORT_OPTIONS = [
  { key: 'name', label: 'nombre' },
  { key: 'size', label: 'tamaño' },
  { key: 'date', label: 'fecha' },
]
const TYPE_AHEAD_RESET_MS = 900
const IS_TOUCH_DEVICE = isCoarsePointer()

function readStoredView() {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY)
  return stored === 'grid' || stored === 'list' ? stored : 'list'
}

function readStoredSort() {
  try {
    const stored = JSON.parse(localStorage.getItem(SORT_STORAGE_KEY) ?? 'null')
    if (stored?.key && stored?.direction) return stored
  } catch {
    // Preferencia corrupta: no vale la pena avisar, se vuelve al orden por defecto.
  }
  return { key: 'name', direction: 'asc' }
}

/** Descriptor ligero de un elemento, lo que viaja en el portapapeles y en los arrastres. */
function toRef(item) {
  return { type: item.type, id: item.data.id, name: itemName(item) }
}

/**
 * Explorador de archivos.
 *
 * `variant="widget"` es la versión que vive dentro del panel (más compacta);
 * `variant="page"` es la pantalla completa de /archivos. Las dos comparten toda
 * la lógica: portapapeles, arrastrar y soltar, teclado y selección múltiple.
 */
export function FileExplorer({ variant = 'widget' }) {
  const compact = variant === 'widget'

  const [history, setHistory] = useState([[ROOT_CRUMB]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const path = history[historyIndex]
  const currentFolderId = path[path.length - 1].id

  const [mode, setMode] = useState('browse')
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')

  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)

  const [selectedKeys, setSelectedKeys] = useState(() => new Set())
  const [rawCursorIndex, setCursorIndex] = useState(-1)
  const [anchorIndex, setAnchorIndex] = useState(-1)
  const [selectionMode, setSelectionMode] = useState(false)

  const [view, setView] = useState(readStoredView)
  const [sort, setSort] = useState(readStoredSort)

  const [renamingKey, setRenamingKey] = useState(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const [menu, setMenu] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [picker, setPicker] = useState(null)
  const [taskLinkFile, setTaskLinkFile] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

  const [dropFolderId, setDropFolderId] = useState(undefined)
  const [externalDrag, setExternalDrag] = useState(false)
  const [marquee, setMarquee] = useState(null)

  const listRef = useRef(null)
  const itemRefs = useRef(new Map())
  const searchInputRef = useRef(null)
  const newFolderInputRef = useRef(null)
  const dragRef = useRef(null)
  const dragCounter = useRef(0)
  const longPressRef = useRef(null)
  const longPressOriginRef = useRef(null)
  const lastPointerTypeRef = useRef('mouse')
  const suppressClickRef = useRef(false)
  const typeAheadRef = useRef({ text: '', at: 0 })
  const pendingSelectRef = useRef(null)

  const { clipboard, copy: setCopyClipboard, cut: setCutClipboard, clear: clearClipboard } = useFileClipboard()
  const { preview, openFile, closePreview } = useFilePreview()

  // ---------------------------------------------------------------- carga

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      if (mode === 'trash') {
        setFolders([])
        setFiles(await filesApi.listTrash())
      } else if (mode === 'search') {
        setFolders([])
        setFiles(await filesApi.search(searchTerm))
      } else {
        const [folderList, fileList] = await Promise.all([
          foldersApi.list(currentFolderId ?? undefined),
          filesApi.list({ folder_id: currentFolderId ?? undefined }),
        ])
        setFolders(folderList)
        setFiles(fileList)
      }
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [mode, searchTerm, currentFolderId])

  useEffect(() => {
    load()
  }, [load])

  const items = useMemo(() => {
    const all = [...folders.map(toFolderItem), ...files.map(toFileItem)]
    // En modo búsqueda el texto ya lo ha aplicado el backend; aquí solo filtramos
    // el listado local mientras se escribe, sin ir al servidor en cada tecla.
    const filtered = mode === 'browse' && query ? all.filter((item) => matchesQuery(itemName(item), query)) : all
    return sortItems(filtered, sort.key, sort.direction)
  }, [folders, files, query, sort, mode])

  // El cursor se acota al render en vez de corregirse en un efecto: si la lista
  // encoge (borrado, filtro, cambio de carpeta) el índice guardado puede quedarse
  // fuera de rango y así nunca apunta a un hueco.
  const cursorIndex = items.length === 0 ? -1 : Math.min(Math.max(rawCursorIndex, 0), items.length - 1)

  // Los handlers (teclado, arrastre) necesitan la lista actual sin volver a crearse
  // en cada render, así que la dejan en una ref que se refresca tras pintar.
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Tras "Ir a la carpeta" desde un resultado de búsqueda, dejar el archivo seleccionado.
  useEffect(() => {
    const pending = pendingSelectRef.current
    if (!pending) return
    const index = items.findIndex((item) => itemKey(item) === pending)
    if (index === -1) return
    pendingSelectRef.current = null
    setSelectedKeys(new Set([pending]))
    setCursorIndex(index)
    itemRefs.current.get(pending)?.scrollIntoView({ block: 'center' })
  }, [items])

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view)
  }, [view])

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort))
  }, [sort])

  useEffect(() => {
    if (creatingFolder) newFolderInputRef.current?.focus()
  }, [creatingFolder])

  const focusList = useCallback(() => listRef.current?.focus(), [])

  // ----------------------------------------------------------- navegación

  const navigateTo = useCallback(
    (nextPath) => {
      // Volver a la carpeta en la que ya estás (clic en la última miga de pan) no
      // debe apilar una entrada de historial: "atrás" dejaría de retroceder.
      const current = history[historyIndex]
      const isSamePath =
        current.length === nextPath.length && current.every((crumb, i) => crumb.id === nextPath[i].id)
      if (isSamePath) {
        setMode('browse')
        setQuery('')
        return
      }
      setHistory((entries) => [...entries.slice(0, historyIndex + 1), nextPath])
      setHistoryIndex(historyIndex + 1)
      setMode('browse')
      setQuery('')
      setSelectedKeys(new Set())
      setSelectionMode(false)
      setCursorIndex(0)
    },
    [history, historyIndex],
  )

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setMode('browse')
    }
  }, [historyIndex])

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setMode('browse')
    }
  }, [history.length, historyIndex])

  const goUp = useCallback(() => {
    if (mode !== 'browse') {
      setMode('browse')
      return
    }
    if (path.length > 1) navigateTo(path.slice(0, -1))
  }, [mode, navigateTo, path])

  function openFolder(folder) {
    navigateTo([...path, { id: folder.id, name: folder.name }])
  }

  async function openItem(item) {
    if (!item) return
    if (item.type === 'folder') {
      openFolder(item.data)
      return
    }
    try {
      await openFile(item.data.id)
    } catch (err) {
      setError(err.message)
    }
  }

  async function revealFile(file) {
    try {
      const ancestors = file.folder_id ? await foldersApi.path(file.folder_id) : []
      pendingSelectRef.current = `file-${file.id}`
      navigateTo([ROOT_CRUMB, ...ancestors.map((folder) => ({ id: folder.id, name: folder.name }))])
      setSearchTerm('')
    } catch (err) {
      setError(err.message)
    }
  }

  // ------------------------------------------------------------ selección

  // Derivar de `items` hace que una clave que ya no está en pantalla (borrada,
  // movida o filtrada) desaparezca sola de la selección efectiva.
  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.has(itemKey(item))),
    [items, selectedKeys],
  )

  const selectOnly = useCallback((index) => {
    const item = itemsRef.current[index]
    if (!item) return
    setSelectedKeys(new Set([itemKey(item)]))
    setAnchorIndex(index)
    setCursorIndex(index)
  }, [])

  const toggleAt = useCallback((index) => {
    const item = itemsRef.current[index]
    if (!item) return
    const key = itemKey(item)
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setAnchorIndex(index)
    setCursorIndex(index)
  }, [])

  const selectRange = useCallback((from, to) => {
    const list = itemsRef.current
    const start = Math.min(from, to)
    const end = Math.max(from, to)
    setSelectedKeys(new Set(list.slice(start, end + 1).map(itemKey)))
    setCursorIndex(to)
  }, [])

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(itemsRef.current.map(itemKey)))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set())
    setSelectionMode(false)
  }, [])

  const toggleSort = useCallback((key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  function scrollItemIntoView(index) {
    const item = itemsRef.current[index]
    if (item) itemRefs.current.get(itemKey(item))?.scrollIntoView({ block: 'nearest' })
  }

  /** Cuántas celdas caben por fila en modo cuadrícula: se mide, no se adivina. */
  function gridColumns() {
    if (view !== 'grid') return 1
    const elements = listRef.current?.querySelectorAll('[data-explorer-item]') ?? []
    if (elements.length === 0) return 1
    const firstTop = elements[0].offsetTop
    let columns = 0
    for (const element of elements) {
      if (element.offsetTop !== firstTop) break
      columns += 1
    }
    return Math.max(1, columns)
  }

  function moveCursor(delta, extend) {
    if (items.length === 0) return
    const from = cursorIndex < 0 ? 0 : cursorIndex
    const next = Math.max(0, Math.min(items.length - 1, from + delta))
    if (extend) selectRange(anchorIndex < 0 ? from : anchorIndex, next)
    else selectOnly(next)
    scrollItemIntoView(next)
  }

  // ------------------------------------------------------------- acciones

  async function runAction(label, action) {
    setBusy(label)
    try {
      await action()
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
      await load()
    }
  }

  function submitNewFolder(event) {
    event.preventDefault()
    const name = newFolderName.trim()
    setCreatingFolder(false)
    setNewFolderName('')
    if (!name) {
      focusList()
      return
    }
    runAction('Creando carpeta…', () => foldersApi.create({ name, parent_id: currentFolderId ?? undefined }))
  }

  function renameItem(item, rawName) {
    setRenamingKey(null)
    focusList()
    const name = rawName.trim()
    if (!name || name === itemName(item)) return
    runAction('Renombrando…', () =>
      item.type === 'folder'
        ? foldersApi.update(item.data.id, { name })
        : filesApi.update(item.data.id, { filename: name }),
    )
  }

  function moveRefs(refs, targetFolderId) {
    const movable = refs.filter((ref) => !(ref.type === 'folder' && ref.id === targetFolderId))
    if (movable.length === 0) return
    runAction('Moviendo…', async () => {
      for (const ref of movable) {
        if (ref.type === 'folder') await foldersApi.update(ref.id, { parent_id: targetFolderId })
        else await filesApi.update(ref.id, { folder_id: targetFolderId })
      }
    })
  }

  function copyRefs(refs, targetFolderId) {
    if (refs.length === 0) return
    runAction('Copiando…', async () => {
      for (const ref of refs) {
        if (ref.type === 'folder') await foldersApi.copy(ref.id, targetFolderId)
        else await filesApi.copy(ref.id, targetFolderId)
      }
    })
  }

  function paste(targetFolderId = currentFolderId) {
    if (!clipboard) return
    const { mode: clipboardMode, items: refs } = clipboard
    if (clipboardMode === 'cut') {
      clearClipboard()
      moveRefs(refs, targetFolderId)
    } else {
      copyRefs(refs, targetFolderId)
    }
  }

  function requestDelete(targets, { permanent = false } = {}) {
    if (targets.length === 0) return
    const folderCount = targets.filter((item) => item.type === 'folder').length
    const single = targets.length === 1 ? `«${itemName(targets[0])}»` : `${targets.length} elementos`

    const message = permanent
      ? `${single} se eliminará de forma definitiva. Esta acción no se puede deshacer.`
      : folderCount > 0
        ? `${single} se eliminará. Las carpetas desaparecen con sus subcarpetas y sus archivos van a la papelera.`
        : `${single} se enviará a la papelera. Puedes recuperarlo desde ahí.`

    setConfirm({
      title: permanent ? 'Eliminar definitivamente' : 'Eliminar',
      message,
      confirmLabel: permanent ? 'Eliminar para siempre' : 'Eliminar',
      onConfirm: () => {
        setConfirm(null)
        runAction('Eliminando…', async () => {
          for (const item of targets) {
            if (item.type === 'folder') {
              await foldersApi.remove(item.data.id, { recursive: true })
            } else if (permanent) {
              if (!item.data.is_trashed) await filesApi.trash(item.data.id)
              await filesApi.remove(item.data.id)
            } else {
              await filesApi.trash(item.data.id)
            }
          }
        })
      },
    })
  }

  function restoreItems(targets) {
    const fileTargets = targets.filter((item) => item.type === 'file')
    if (fileTargets.length === 0) return
    runAction('Restaurando…', async () => {
      for (const item of fileTargets) await filesApi.restore(item.data.id)
    })
  }

  function requestEmptyTrash() {
    setConfirm({
      title: 'Vaciar la papelera',
      message: 'Se eliminarán definitivamente todos los archivos de la papelera. No se puede deshacer.',
      confirmLabel: 'Vaciar',
      onConfirm: () => {
        setConfirm(null)
        runAction('Vaciando papelera…', () => filesApi.emptyTrash())
      },
    })
  }

  async function downloadItems(targets) {
    for (const item of targets.filter((entry) => entry.type === 'file')) {
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
  }

  // --------------------------------------------------------------- subida

  /**
   * Crea (o reutiliza) la cadena de carpetas de una ruta relativa dentro de `baseId`.
   * Reutilizar en vez de crear evita el 409 del backend cuando la carpeta ya existe,
   * que es lo normal al volver a soltar la misma carpeta del escritorio.
   */
  async function ensureFolderPath(parts, baseId, cache) {
    let parentId = baseId
    let cacheKey = ''
    for (const name of parts) {
      cacheKey = cacheKey ? `${cacheKey}/${name}` : name
      if (cache.has(cacheKey)) {
        parentId = cache.get(cacheKey)
        continue
      }
      const siblings = await foldersApi.list(parentId ?? undefined)
      const existing = siblings.find((folder) => folder.name === name)
      const folder = existing ?? (await foldersApi.create({ name, parent_id: parentId ?? undefined }))
      cache.set(cacheKey, folder.id)
      parentId = folder.id
    }
    return parentId
  }

  function uploadEntries(entries, targetFolderId) {
    if (entries.length === 0) return
    const cache = new Map()
    runAction(`Subiendo ${entries.length} archivo${entries.length === 1 ? '' : 's'}…`, async () => {
      for (const entry of entries) {
        const folderId = await ensureFolderPath(entry.path, targetFolderId, cache)
        await filesApi.upload(entry.file, { folderId: folderId ?? undefined })
      }
    })
  }

  // ------------------------------------------------- arrastrar y soltar

  function handleDragStart(event, item, index) {
    if (mode !== 'browse') {
      event.preventDefault()
      return
    }
    const key = itemKey(item)
    const dragged = selectedKeys.has(key) ? selectedItems : [item]
    if (!selectedKeys.has(key)) selectOnly(index)
    dragRef.current = dragged.map(toRef)
    event.dataTransfer.setData(DRAG_MIME, String(dragged.length))
    event.dataTransfer.effectAllowed = 'copyMove'
  }

  function handleDragEnd() {
    dragRef.current = null
    setDropFolderId(undefined)
  }

  function dragKind(event) {
    const types = Array.from(event.dataTransfer.types ?? [])
    if (types.includes(DRAG_MIME)) return 'internal'
    if (types.includes('Files')) return 'external'
    return null
  }

  function handleFolderDragOver(event, folderId) {
    const kind = dragKind(event)
    if (!kind) return
    if (kind === 'internal' && dragRef.current?.some((ref) => ref.type === 'folder' && ref.id === folderId)) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = kind === 'internal' && !(event.ctrlKey || event.metaKey) ? 'move' : 'copy'
    setDropFolderId(folderId)
  }

  function handleDropOn(event, folderId) {
    event.preventDefault()
    event.stopPropagation()
    setDropFolderId(undefined)
    setExternalDrag(false)
    dragCounter.current = 0

    const kind = dragKind(event)
    if (kind === 'internal') {
      const dragged = dragRef.current ?? []
      dragRef.current = null
      if (dragged.length === 0) return
      if (event.ctrlKey || event.metaKey) copyRefs(dragged, folderId)
      else moveRefs(dragged, folderId)
      return
    }
    if (kind !== 'external') return

    // `dataTransfer` deja de ser legible en cuanto el handler termina: hay que
    // arrancar la lectura aquí mismo, antes de cualquier await.
    collectDropEntries(event.dataTransfer)
      .then((entries) => uploadEntries(entries, folderId))
      .catch((err) => setError(err.message))
  }

  function handleContainerDragOver(event) {
    const kind = dragKind(event)
    if (!kind) return
    event.preventDefault()
    event.dataTransfer.dropEffect = kind === 'external' || event.ctrlKey || event.metaKey ? 'copy' : 'move'
    // Salir de una carpeta destino tiene que apagar su resaltado; el guard evita
    // re-renderizar en cada uno de los muchos dragover que dispara el navegador.
    setDropFolderId((current) => (current === undefined ? current : undefined))
  }

  function handleContainerDragEnter(event) {
    if (dragKind(event) !== 'external') return
    dragCounter.current += 1
    setExternalDrag(true)
  }

  function handleContainerDragLeave(event) {
    if (dragKind(event) !== 'external') return
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setExternalDrag(false)
    }
  }

  // --------------------------------------------- selección por recuadro

  function handleContainerPointerDown(event) {
    lastPointerTypeRef.current = event.pointerType || 'mouse'
    if (event.target.closest('[data-explorer-item]')) return

    if (event.pointerType === 'touch') {
      startLongPress(event, null, -1)
      return
    }
    // El recuadro de selección es solo de ratón: con el dedo ese gesto es el scroll.
    if (event.pointerType !== 'mouse' || event.button !== 0) return

    const container = listRef.current
    if (!container) return
    focusList()

    const bounds = container.getBoundingClientRect()
    const toLocal = (pointerEvent) => ({
      x: pointerEvent.clientX - bounds.left + container.scrollLeft,
      y: pointerEvent.clientY - bounds.top + container.scrollTop,
    })
    const origin = toLocal(event)
    const additive = event.ctrlKey || event.metaKey || event.shiftKey
    const base = additive ? new Set(selectedKeys) : new Set()
    if (!additive) setSelectedKeys(new Set())

    let dragging = false

    function onMove(moveEvent) {
      const point = toLocal(moveEvent)
      if (!dragging && Math.abs(point.x - origin.x) < 4 && Math.abs(point.y - origin.y) < 4) return
      dragging = true
      const box = {
        left: Math.min(origin.x, point.x),
        top: Math.min(origin.y, point.y),
        right: Math.max(origin.x, point.x),
        bottom: Math.max(origin.y, point.y),
      }
      setMarquee(box)
      const next = new Set(base)
      for (const [key, element] of itemRefs.current) {
        const left = element.offsetLeft
        const top = element.offsetTop
        if (
          left < box.right &&
          left + element.offsetWidth > box.left &&
          top < box.bottom &&
          top + element.offsetHeight > box.top
        ) {
          next.add(key)
        }
      }
      setSelectedKeys(next)
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setMarquee(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // ------------------------------------------------------------- teclado

  function handleKeyDown(event) {
    const tag = event.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    const modifier = event.ctrlKey || event.metaKey
    const key = event.key

    if (event.altKey && key === 'ArrowLeft') {
      event.preventDefault()
      goBack()
      return
    }
    if (event.altKey && key === 'ArrowRight') {
      event.preventDefault()
      goForward()
      return
    }

    if (modifier) {
      const lower = key.toLowerCase()
      if (lower === 'a') {
        event.preventDefault()
        selectAll()
        return
      }
      if (lower === 'c') {
        event.preventDefault()
        if (selectedItems.length > 0) setCopyClipboard(selectedItems.map(toRef))
        return
      }
      if (lower === 'x') {
        event.preventDefault()
        if (selectedItems.length > 0 && mode === 'browse') setCutClipboard(selectedItems.map(toRef))
        return
      }
      if (lower === 'v') {
        event.preventDefault()
        if (mode === 'browse') paste()
        return
      }
      if (lower === 'f') {
        event.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      if (lower === 'n' && event.shiftKey) {
        event.preventDefault()
        if (mode === 'browse') setCreatingFolder(true)
        return
      }
      if (key === ' ') {
        event.preventDefault()
        toggleAt(cursorIndex)
        return
      }
      return
    }

    const columns = gridColumns()

    switch (key) {
      case 'ArrowDown':
        event.preventDefault()
        moveCursor(view === 'grid' ? columns : 1, event.shiftKey)
        return
      case 'ArrowUp':
        event.preventDefault()
        moveCursor(view === 'grid' ? -columns : -1, event.shiftKey)
        return
      case 'ArrowRight':
        event.preventDefault()
        if (view === 'grid') moveCursor(1, event.shiftKey)
        else openItem(items[cursorIndex])
        return
      case 'ArrowLeft':
        event.preventDefault()
        if (view === 'grid') moveCursor(-1, event.shiftKey)
        else goUp()
        return
      case 'Home':
        event.preventDefault()
        moveCursor(-items.length, event.shiftKey)
        return
      case 'End':
        event.preventDefault()
        moveCursor(items.length, event.shiftKey)
        return
      case 'PageDown':
        event.preventDefault()
        moveCursor(10, event.shiftKey)
        return
      case 'PageUp':
        event.preventDefault()
        moveCursor(-10, event.shiftKey)
        return
      case 'Enter':
        event.preventDefault()
        openItem(items[cursorIndex])
        return
      case 'Backspace':
        event.preventDefault()
        goUp()
        return
      case 'F2': {
        event.preventDefault()
        const target = items[cursorIndex]
        if (target && mode === 'browse') setRenamingKey(itemKey(target))
        return
      }
      case 'F5':
        event.preventDefault()
        load()
        return
      case 'Delete':
        event.preventDefault()
        requestDelete(selectedItems.length > 0 ? selectedItems : [items[cursorIndex]].filter(Boolean), {
          permanent: event.shiftKey || mode === 'trash',
        })
        return
      case 'Escape':
        event.preventDefault()
        if (query || mode === 'search') {
          setQuery('')
          if (mode === 'search') setMode('browse')
        } else {
          clearSelection()
        }
        return
      default:
        break
    }

    if (key === '?') {
      event.preventDefault()
      setShowHelp(true)
      return
    }

    // Type-ahead: escribir letras salta al primer nombre que empiece así.
    if (key.length === 1 && !event.altKey) {
      const now = Date.now()
      const buffer = now - typeAheadRef.current.at > TYPE_AHEAD_RESET_MS ? key : typeAheadRef.current.text + key
      typeAheadRef.current = { text: buffer, at: now }
      const needle = normalizeForSearch(buffer)
      const index = items.findIndex((item) => normalizeForSearch(itemName(item)).startsWith(needle))
      if (index !== -1) {
        event.preventDefault()
        selectOnly(index)
        scrollItemIntoView(index)
      }
    }
  }

  // ------------------------------------------------------ menú contextual

  function buildMenuSections(target) {
    const targets = target ? (selectedKeys.has(itemKey(target)) ? selectedItems : [target]) : []
    const refs = targets.map(toRef)
    const onlyFiles = targets.length > 0 && targets.every((item) => item.type === 'file')
    const single = targets.length === 1 ? targets[0] : null

    if (mode === 'trash') {
      return [
        [
          targets.length > 0 && {
            label: 'Restaurar',
            icon: RestoreIcon,
            onSelect: () => restoreItems(targets),
          },
          onlyFiles && {
            label: 'Descargar',
            icon: DownloadIcon,
            onSelect: () => downloadItems(targets),
          },
        ],
        [
          targets.length > 0 && {
            label: 'Eliminar definitivamente',
            icon: TrashIcon,
            danger: true,
            onSelect: () => requestDelete(targets, { permanent: true }),
          },
          {
            label: 'Vaciar la papelera',
            icon: TrashIcon,
            danger: true,
            onSelect: requestEmptyTrash,
          },
        ],
      ]
    }

    if (targets.length === 0) {
      return [
        [
          { label: 'Nueva carpeta', icon: NewFolderIcon, shortcut: 'Ctrl+⇧+N', onSelect: () => setCreatingFolder(true) },
          {
            label: 'Pegar',
            icon: PasteIcon,
            shortcut: 'Ctrl+V',
            disabled: !clipboard,
            onSelect: () => paste(),
          },
        ],
        [{ label: 'Seleccionar todo', icon: CheckIcon, shortcut: 'Ctrl+A', onSelect: selectAll }],
        SORT_OPTIONS.map((option) => ({
          label: `Ordenar por ${option.label}${sort.key === option.key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}`,
          onSelect: () => toggleSort(option.key),
        })),
      ]
    }

    return [
      [
        single && {
          label: single.type === 'folder' ? 'Abrir' : 'Abrir vista previa',
          icon: OpenIcon,
          shortcut: 'Enter',
          onSelect: () => openItem(single),
        },
        onlyFiles && { label: 'Descargar', icon: DownloadIcon, onSelect: () => downloadItems(targets) },
        mode === 'search' &&
          single?.type === 'file' && {
            label: 'Ir a la carpeta',
            icon: FolderIcon,
            onSelect: () => revealFile(single.data),
          },
      ],
      [
        { label: 'Copiar', icon: CopyIcon, shortcut: 'Ctrl+C', onSelect: () => setCopyClipboard(refs) },
        mode === 'browse' && {
          label: 'Cortar',
          icon: CutIcon,
          shortcut: 'Ctrl+X',
          onSelect: () => setCutClipboard(refs),
        },
        mode === 'browse' && {
          label: 'Pegar dentro',
          icon: PasteIcon,
          disabled: !clipboard || single?.type !== 'folder',
          onSelect: () => paste(single.data.id),
        },
      ],
      [
        mode === 'browse' && {
          label: 'Mover a…',
          icon: MoveIcon,
          onSelect: () => setPicker({ action: 'move', refs }),
        },
        { label: 'Copiar a…', icon: CopyIcon, onSelect: () => setPicker({ action: 'copy', refs }) },
        single &&
          mode === 'browse' && {
            label: 'Renombrar',
            icon: RenameIcon,
            shortcut: 'F2',
            onSelect: () => setRenamingKey(itemKey(single)),
          },
        single?.type === 'file' && {
          label: 'Vincular a una tarea…',
          icon: LinkIcon,
          onSelect: () => setTaskLinkFile(single.data),
        },
      ],
      [
        {
          label: 'Eliminar',
          icon: TrashIcon,
          shortcut: 'Supr',
          danger: true,
          onSelect: () => requestDelete(targets),
        },
      ],
    ]
  }

  function openMenuFor(event, item, index) {
    event.preventDefault()
    if (item && !selectedKeys.has(itemKey(item))) selectOnly(index)
    setMenu({ x: event.clientX, y: event.clientY, target: item ?? null })
  }

  // -------------------------------------------------- gestos táctiles

  function startLongPress(event, item, index) {
    if (event.pointerType !== 'touch') return
    const { clientX, clientY } = event
    suppressClickRef.current = false
    longPressOriginRef.current = { x: clientX, y: clientY }
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null
      suppressClickRef.current = true
      navigator.vibrate?.(12)
      if (item && !selectedKeys.has(itemKey(item))) selectOnly(index)
      setMenu({ x: clientX, y: clientY, target: item ?? null })
    }, LONG_PRESS_MS)
  }

  /** Se cancela solo si el dedo se mueve de verdad: un temblor no debe abortar el gesto. */
  function cancelLongPress(event) {
    if (!longPressRef.current) return
    const origin = longPressOriginRef.current
    if (event?.type === 'pointermove' && origin) {
      const moved = Math.abs(event.clientX - origin.x) + Math.abs(event.clientY - origin.y)
      if (moved < 12) return
    }
    clearTimeout(longPressRef.current)
    longPressRef.current = null
  }

  function handleItemClick(event, item, index) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    // El `pointerType` del propio click no es de fiar en móvil (Chrome Android lo
    // reporta como 'mouse'), así que se guarda el del pointerdown, que sí es correcto.
    const isTouch = lastPointerTypeRef.current === 'touch'

    if (event.ctrlKey || event.metaKey) {
      toggleAt(index)
      return
    }
    if (event.shiftKey) {
      selectRange(anchorIndex < 0 ? index : anchorIndex, index)
      return
    }
    if (isTouch) {
      if (selectionMode) toggleAt(index)
      else openItem(item)
      return
    }
    selectOnly(index)
  }

  // ------------------------------------------------------------- render

  const totalSize = items.reduce((sum, item) => sum + (item.type === 'file' ? item.data.size_bytes : 0), 0)
  const selectedSize = selectedItems.reduce(
    (sum, item) => sum + (item.type === 'file' ? item.data.size_bytes : 0),
    0,
  )

  function registerItemRef(key) {
    return (element) => {
      if (element) itemRefs.current.set(key, element)
      else itemRefs.current.delete(key)
    }
  }

  function itemDomProps(item, index) {
    const key = itemKey(item)
    const isFolder = item.type === 'folder'
    return {
      'data-explorer-item': key,
      draggable: !IS_TOUCH_DEVICE && mode === 'browse' && renamingKey !== key,
      onClick: (event) => handleItemClick(event, item, index),
      // Con el dedo un toque ya abre: sin este guard, un doble toque abriría dos veces.
      onDoubleClick: () => lastPointerTypeRef.current !== 'touch' && openItem(item),
      onContextMenu: (event) => openMenuFor(event, item, index),
      onPointerDown: (event) => {
        lastPointerTypeRef.current = event.pointerType || 'mouse'
        startLongPress(event, item, index)
      },
      onPointerUp: cancelLongPress,
      onPointerMove: cancelLongPress,
      onPointerCancel: cancelLongPress,
      onDragStart: (event) => handleDragStart(event, item, index),
      onDragEnd: handleDragEnd,
      onDragOver: isFolder ? (event) => handleFolderDragOver(event, item.data.id) : undefined,
      onDragLeave: isFolder ? () => setDropFolderId(undefined) : undefined,
      onDrop: isFolder ? (event) => handleDropOn(event, item.data.id) : undefined,
    }
  }

  const emptyMessage =
    mode === 'trash'
      ? 'La papelera está vacía.'
      : mode === 'search'
        ? 'Ningún archivo coincide con la búsqueda.'
        : query
          ? 'Nada coincide con el filtro.'
          : 'Carpeta vacía. Arrastra archivos aquí para subirlos.'

  return (
    <>
      <Panel title="Archivos" className="h-full" bodyClassName="flex min-h-0 flex-col">
        <ExplorerToolbar
          path={path}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          canGoUp={mode !== 'browse' || path.length > 1}
          onGoBack={goBack}
          onGoForward={goForward}
          onGoUp={goUp}
          onRefresh={load}
          onNavigateCrumb={(index) => navigateTo(path.slice(0, index + 1))}
          crumbDropId={dropFolderId}
          onCrumbDragOver={handleFolderDragOver}
          onCrumbDragLeave={() => setDropFolderId(undefined)}
          onCrumbDrop={handleDropOn}
          query={query}
          onQueryChange={(value) => {
            setQuery(value)
            if (mode === 'search' && value === '') setMode('browse')
          }}
          onSearchSubmit={() => {
            const term = query.trim()
            if (!term) return
            setSearchTerm(term)
            setMode('search')
          }}
          searchInputRef={searchInputRef}
          isSearchResults={mode === 'search'}
          onExitSearch={() => {
            setMode('browse')
            setQuery('')
          }}
          view={view}
          onViewChange={setView}
          mode={mode}
          onToggleTrash={() => {
            setMode(mode === 'trash' ? 'browse' : 'trash')
            setQuery('')
            clearSelection()
          }}
          onNewFolder={() => setCreatingFolder(true)}
          onUpload={(fileList) => uploadEntries(collectInputEntries(fileList), currentFolderId)}
          onUploadFolder={(fileList) => uploadEntries(collectInputEntries(fileList), currentFolderId)}
          clipboard={clipboard}
          onPaste={() => paste()}
          onShowHelp={() => setShowHelp(true)}
          compact={compact}
        />

        {error && (
          <p className="flex shrink-0 items-start gap-2 border-b border-danger/40 bg-danger/10 px-3 py-1.5 font-mono text-xs text-danger">
            <span className="flex-1 break-words">{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Descartar el error">
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </p>
        )}

        {busy && (
          <p className="shrink-0 border-b border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent">
            {busy}
          </p>
        )}

        {view === 'list' && !compact && mode !== 'trash' && (
          <ColumnHeader
            sort={sort}
            onSort={toggleSort}
          />
        )}

        <div
          ref={listRef}
          tabIndex={0}
          role="listbox"
          aria-multiselectable="true"
          aria-label="Contenido de la carpeta"
          onKeyDown={handleKeyDown}
          onPointerDown={handleContainerPointerDown}
          onPointerUp={cancelLongPress}
          onPointerMove={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onContextMenu={(event) => {
            if (event.target.closest('[data-explorer-item]')) return
            openMenuFor(event, null, -1)
          }}
          onDragOver={handleContainerDragOver}
          onDragEnter={handleContainerDragEnter}
          onDragLeave={handleContainerDragLeave}
          onDrop={(event) => handleDropOn(event, currentFolderId)}
          className="relative min-h-0 flex-1 overflow-auto outline-none focus-visible:bg-accent/[0.02]"
        >
          {externalDrag && (
            <div className="pointer-events-none absolute inset-2 z-10 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-accent bg-bg/70 font-mono text-xs tracking-[0.1em] text-accent uppercase">
              <UploadIcon className="h-6 w-6" />
              Soltar para subir aquí
            </div>
          )}

          {marquee && (
            <div
              className="pointer-events-none absolute z-10 border border-accent bg-accent/10"
              style={{
                left: marquee.left,
                top: marquee.top,
                width: marquee.right - marquee.left,
                height: marquee.bottom - marquee.top,
              }}
            />
          )}

          {creatingFolder && (
            <form onSubmit={submitNewFolder} className="flex items-center gap-2.5 px-3 py-2">
              <FolderIcon className="h-4 w-4 shrink-0 text-accent" />
              <input
                ref={newFolderInputRef}
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                onBlur={() => {
                  setCreatingFolder(false)
                  setNewFolderName('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setCreatingFolder(false)
                    setNewFolderName('')
                    focusList()
                  }
                }}
                placeholder="Nombre de la carpeta…"
                className="min-w-0 flex-1 border-b border-accent bg-transparent text-sm text-text-primary outline-none"
              />
            </form>
          )}

          {isLoading ? (
            <p className="px-3 py-4 font-mono text-xs text-text-secondary">Cargando…</p>
          ) : items.length === 0 && !creatingFolder ? (
            <p className="px-3 py-6 text-center font-mono text-xs text-text-secondary">{emptyMessage}</p>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1 p-2 sm:grid-cols-[repeat(auto-fill,minmax(104px,1fr))]">
              {items.map((item, index) => {
                const key = itemKey(item)
                return (
                  <ExplorerTile
                    key={key}
                    item={item}
                    selected={selectedKeys.has(key)}
                    cursor={index === cursorIndex}
                    cut={clipboard?.mode === 'cut' && clipboard.items.some((ref) => ref.type === item.type && ref.id === item.data.id)}
                    dropTarget={item.type === 'folder' && dropFolderId === item.data.id}
                    showCheckbox={selectionMode}
                    rename={
                      renamingKey === key
                        ? { onSubmit: (value) => renameItem(item, value), onCancel: () => setRenamingKey(null) }
                        : null
                    }
                    domProps={itemDomProps(item, index)}
                    elementRef={registerItemRef(key)}
                  />
                )
              })}
            </div>
          ) : (
            items.map((item, index) => {
              const key = itemKey(item)
              return (
                <ExplorerRow
                  key={key}
                  item={item}
                  selected={selectedKeys.has(key)}
                  cursor={index === cursorIndex}
                  cut={clipboard?.mode === 'cut' && clipboard.items.some((ref) => ref.type === item.type && ref.id === item.data.id)}
                  dropTarget={item.type === 'folder' && dropFolderId === item.data.id}
                  compact={compact}
                  showCheckbox={selectionMode}
                  rename={
                    renamingKey === key
                      ? { onSubmit: (value) => renameItem(item, value), onCancel: () => setRenamingKey(null) }
                      : null
                  }
                  domProps={itemDomProps(item, index)}
                  elementRef={registerItemRef(key)}
                />
              )
            })
          )}
        </div>

        {/* Barra de acciones para el dedo: en móvil no hay clic derecho ni arrastre. */}
        {selectedItems.length > 0 && (
          <div className="no-scrollbar flex shrink-0 items-center gap-0.5 overflow-x-auto border-t border-border bg-surface px-1.5 py-2 sm:hidden">
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Cancelar la selección"
              className="flex h-9 w-9 shrink-0 items-center justify-center text-text-secondary"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            <span className="shrink-0 px-1 font-mono text-[11px] text-text-secondary">{selectedItems.length}</span>
            {mode === 'trash' ? (
              <>
                <MobileAction icon={RestoreIcon} label="Restaurar" onClick={() => restoreItems(selectedItems)} />
                <MobileAction
                  icon={TrashIcon}
                  label="Borrar"
                  danger
                  onClick={() => requestDelete(selectedItems, { permanent: true })}
                />
              </>
            ) : (
              <>
                <MobileAction icon={MoveIcon} label="Mover" onClick={() => setPicker({ action: 'move', refs: selectedItems.map(toRef) })} />
                <MobileAction icon={CopyIcon} label="Copiar" onClick={() => setPicker({ action: 'copy', refs: selectedItems.map(toRef) })} />
                {selectedItems.length === 1 && (
                  <MobileAction
                    icon={RenameIcon}
                    label="Renom."
                    onClick={() => setRenamingKey(itemKey(selectedItems[0]))}
                  />
                )}
                {selectedItems.every((item) => item.type === 'file') && (
                  <MobileAction icon={DownloadIcon} label="Bajar" onClick={() => downloadItems(selectedItems)} />
                )}
                <MobileAction icon={TrashIcon} label="Borrar" danger onClick={() => requestDelete(selectedItems)} />
              </>
            )}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3 overflow-x-auto border-t border-border px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-text-secondary uppercase sm:py-1.5">
          <span className="shrink-0">
            {items.length} elemento{items.length === 1 ? '' : 's'}
          </span>
          {selectedItems.length > 0 && (
            <span className="shrink-0 text-accent">
              {selectedItems.length} sel. · {formatBytes(selectedSize)}
            </span>
          )}
          {selectedItems.length === 0 && totalSize > 0 && (
            <span className="hidden shrink-0 sm:inline">{formatBytes(totalSize)}</span>
          )}
          {clipboard && (
            <span className="max-w-28 shrink-0 truncate text-accent">
              {clipboard.mode === 'cut' ? 'Cortado' : 'Copiado'}: {clipboard.items.length}
            </span>
          )}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setSelectionMode((current) => !current)}
            className={`shrink-0 sm:hidden ${selectionMode ? 'text-accent' : ''}`}
          >
            {selectionMode ? 'Hecho' : 'Seleccionar'}
          </button>
          <span className="hidden shrink-0 sm:inline">
            {mode === 'trash' ? 'Supr elimina · Restaurar con clic derecho' : 'F2 renombrar · Supr papelera · ? atajos'}
          </span>
        </div>
      </Panel>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          sections={buildMenuSections(menu.target)}
          onClose={() => setMenu(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {picker && (
        <FolderPickerModal
          title={picker.action === 'move' ? 'Mover a…' : 'Copiar a…'}
          confirmLabel={picker.action === 'move' ? 'Mover aquí' : 'Copiar aquí'}
          initialPath={path}
          excludedIds={new Set(picker.refs.filter((ref) => ref.type === 'folder').map((ref) => ref.id))}
          onCancel={() => setPicker(null)}
          onConfirm={(folderId) => {
            const { action, refs } = picker
            setPicker(null)
            if (action === 'move') moveRefs(refs, folderId)
            else copyRefs(refs, folderId)
          }}
        />
      )}

      {taskLinkFile && (
        <TaskLinkModal
          file={taskLinkFile}
          onClose={() => setTaskLinkFile(null)}
          onLinked={(taskId) => {
            const fileId = taskLinkFile.id
            setTaskLinkFile(null)
            runAction('Vinculando…', () => filesApi.update(fileId, { task_id: taskId }))
          }}
        />
      )}

      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}

      <FilePreviewModal preview={preview} onClose={closePreview} />
    </>
  )
}

function MobileAction({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center gap-0.5 px-2.5 py-1 font-mono text-[10px] tracking-normal uppercase ${
        danger ? 'text-danger' : 'text-text-secondary'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
