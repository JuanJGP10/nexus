import { useCallback, useState } from 'react'
import { filesApi } from '../api/endpoints/files'

const PREVIEWABLE_PREFIXES = ['image/', 'video/', 'audio/', 'text/']

function isPreviewable(mimeType) {
  if (!mimeType) return false
  if (mimeType === 'application/pdf') return true
  return PREVIEWABLE_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
}

/** Abre un archivo: preview en modal si el navegador puede renderizarlo, si no descarga directo. */
export function useFilePreview() {
  const [preview, setPreview] = useState(null)

  const openFile = useCallback(async (fileId) => {
    const { blob, filename } = await filesApi.download(fileId)
    const mimeType = blob.type
    const url = URL.createObjectURL(blob)

    if (!isPreviewable(mimeType)) {
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      return
    }

    const text = mimeType.startsWith('text/') ? await blob.text() : null
    setPreview({ url, filename, mimeType, text })
  }, [])

  const closePreview = useCallback(() => {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current.url)
      return null
    })
  }, [])

  return { preview, openFile, closePreview }
}
