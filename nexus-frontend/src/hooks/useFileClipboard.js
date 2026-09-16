import { useCallback, useSyncExternalStore } from 'react'

/**
 * Portapapeles del explorador, guardado fuera de React.
 *
 * Vive en el módulo (no en el estado de un componente) para que copiar en el
 * explorador del panel y pegar en la página /archivos funcione: son dos
 * instancias distintas de FileExplorer y el portapapeles tiene que sobrevivir
 * al cambio de pantalla, igual que en un gestor de archivos de escritorio.
 */

/** @type {{ mode: 'copy' | 'cut', items: Array<{ type: 'folder' | 'file', id: number, name: string }> } | null} */
let clipboard = null
const listeners = new Set()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return clipboard
}

export function useFileClipboard() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const copy = useCallback((items) => {
    clipboard = items.length > 0 ? { mode: 'copy', items } : null
    emit()
  }, [])

  const cut = useCallback((items) => {
    clipboard = items.length > 0 ? { mode: 'cut', items } : null
    emit()
  }, [])

  const clear = useCallback(() => {
    clipboard = null
    emit()
  }, [])

  return { clipboard: value, copy, cut, clear }
}
