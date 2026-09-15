export function FilePreviewModal({ preview, onClose }) {
  if (!preview) return null
  const { url, filename, mimeType, text } = preview

  function download() {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="hud-panel flex h-dvh w-full flex-col sm:h-auto sm:max-h-[85vh] sm:max-w-3xl"
      >
        <span className="hud-corner-bl" />
        <span className="hud-corner-br" />

        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <span className="truncate text-sm text-text-primary">{filename}</span>
          <div className="flex shrink-0 items-center gap-3 font-mono text-xs tracking-[0.1em] uppercase">
            <button type="button" onClick={download} className="text-text-secondary hover:text-accent">
              Descargar
            </button>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-accent">
              Cerrar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {mimeType.startsWith('image/') && (
            <img src={url} alt={filename} className="mx-auto max-h-full max-w-full object-contain" />
          )}
          {mimeType === 'application/pdf' && (
            <iframe src={url} title={filename} className="h-full min-h-[70vh] w-full border-0" />
          )}
          {mimeType.startsWith('video/') && (
            <video src={url} controls className="mx-auto max-h-full max-w-full" />
          )}
          {mimeType.startsWith('audio/') && <audio src={url} controls className="w-full" />}
          {mimeType.startsWith('text/') && (
            <pre className="font-mono text-xs whitespace-pre-wrap break-words text-text-primary">{text}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
