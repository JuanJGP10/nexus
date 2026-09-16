/** Helpers del explorador de archivos: identidad, tipo, orden y lectura de un drop del sistema. */

const KIND_BY_EXTENSION = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg', 'ico', 'heic'],
  video: ['mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
  pdf: ['pdf'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
  sheet: ['csv', 'xls', 'xlsx', 'ods'],
  doc: ['doc', 'docx', 'odt', 'rtf', 'md', 'txt'],
  code: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'rb', 'php', 'sh', 'sql', 'html', 'css', 'json', 'yml', 'yaml', 'xml', 'toml'],
}

/** Extensión en minúsculas y sin punto (`''` si no tiene). */
export function fileExtension(name) {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** Familia del archivo, para elegir icono y color. Se decide por extensión y, si no, por MIME. */
export function fileKind(filename, contentType) {
  const extension = fileExtension(filename)
  for (const [kind, extensions] of Object.entries(KIND_BY_EXTENSION)) {
    if (extensions.includes(extension)) return kind
  }
  if (contentType?.startsWith('image/')) return 'image'
  if (contentType?.startsWith('video/')) return 'video'
  if (contentType?.startsWith('audio/')) return 'audio'
  if (contentType?.startsWith('text/')) return 'doc'
  if (contentType === 'application/pdf') return 'pdf'
  return 'file'
}

/** El navegador puede renderizarlo en el modal de preview (mismo criterio que useFilePreview). */
export function isPreviewableKind(kind) {
  return ['image', 'video', 'audio', 'pdf'].includes(kind)
}

/** Clave estable de un elemento del listado: no se pisan ids de carpeta con ids de archivo. */
export function itemKey(item) {
  return `${item.type}-${item.data.id}`
}

export function itemName(item) {
  return item.type === 'folder' ? item.data.name : item.data.filename
}

export function toFolderItem(folder) {
  return { type: 'folder', data: folder }
}

export function toFileItem(file) {
  return { type: 'file', data: file }
}

function compareNames(a, b) {
  return itemName(a).localeCompare(itemName(b), 'es', { numeric: true, sensitivity: 'base' })
}

/**
 * Ordena el listado. Las carpetas van siempre antes que los archivos (como en
 * cualquier gestor real), y el desempate es siempre por nombre ascendente.
 */
export function sortItems(items, key, direction) {
  const factor = direction === 'desc' ? -1 : 1
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1

    if (key === 'size') {
      const sizeA = a.type === 'folder' ? -1 : a.data.size_bytes
      const sizeB = b.type === 'folder' ? -1 : b.data.size_bytes
      if (sizeA !== sizeB) return (sizeA - sizeB) * factor
      return compareNames(a, b)
    }

    if (key === 'date') {
      const dateA = new Date(a.data.created_at).getTime()
      const dateB = new Date(b.data.created_at).getTime()
      if (dateA !== dateB) return (dateA - dateB) * factor
      return compareNames(a, b)
    }

    return compareNames(a, b) * factor
  })
}

/** Filtro local del listado actual: sin acentos ni mayúsculas, subcadena simple. */
export function normalizeForSearch(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function matchesQuery(name, query) {
  if (!query) return true
  return normalizeForSearch(name).includes(normalizeForSearch(query))
}

function readEntryFile(entry) {
  return new Promise((resolve) => entry.file(resolve, () => resolve(null)))
}

function readDirectory(reader) {
  return new Promise((resolve) => reader.readEntries(resolve, () => resolve([])))
}

async function walkEntry(entry, path, collected) {
  if (entry.isFile) {
    const file = await readEntryFile(entry)
    if (file) collected.push({ path, file })
    return
  }
  if (!entry.isDirectory) return

  // readEntries() devuelve como mucho 100 entradas por llamada: hay que insistir
  // hasta que conteste con una tanda vacía o se pierden archivos en carpetas grandes.
  const reader = entry.createReader()
  const children = []
  for (;;) {
    const batch = await readDirectory(reader)
    if (batch.length === 0) break
    children.push(...batch)
  }

  const childPath = [...path, entry.name]
  for (const child of children) {
    await walkEntry(child, childPath, collected)
  }
}

/**
 * Lee lo que el usuario ha soltado desde el escritorio y lo aplana a
 * `[{ path: ['sub', 'carpeta'], file }]`, recorriendo carpetas enteras.
 *
 * Hay que llamarla de forma síncrona dentro del handler de `drop`: `dataTransfer.items`
 * deja de ser válido en cuanto el evento termina, así que las entradas se toman antes
 * del primer `await`. Si el navegador no soporta `webkitGetAsEntry` caemos a
 * `dataTransfer.files`, que solo trae archivos sueltos (sin estructura de carpetas).
 */
export function collectDropEntries(dataTransfer) {
  const entries = Array.from(dataTransfer.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => (item.webkitGetAsEntry ? item.webkitGetAsEntry() : null))
    .filter(Boolean)

  if (entries.length === 0) {
    const flat = Array.from(dataTransfer.files ?? []).map((file) => ({ path: [], file }))
    return Promise.resolve(flat)
  }

  const collected = []
  return (async () => {
    for (const entry of entries) await walkEntry(entry, [], collected)
    return collected
  })()
}

/** Lo mismo pero desde un `<input type="file" webkitdirectory>`, que ya trae la ruta relativa. */
export function collectInputEntries(fileList) {
  return Array.from(fileList ?? []).map((file) => {
    const relative = file.webkitRelativePath || ''
    const parts = relative ? relative.split('/').slice(0, -1) : []
    return { path: parts, file }
  })
}

export const DRAG_MIME = 'application/x-nexus-items'

/**
 * True si el dispositivo apunta con el dedo.
 *
 * Se consulta una vez al cargar: el explorador lo usa para desactivar el
 * `draggable` de las filas. En iOS/iPadOS una pulsación larga sobre un elemento
 * arrastrable inicia el arrastre nativo, y eso pisa nuestra pulsación larga
 * para abrir el menú contextual.
 */
export function isCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true
}
