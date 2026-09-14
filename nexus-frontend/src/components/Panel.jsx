export function Panel({ title, action, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`hud-panel flex flex-col ${className}`}>
      <span className="hud-corner-bl" />
      <span className="hud-corner-br" />
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2">
          <h2 className="font-mono text-xs tracking-[0.2em] text-text-secondary uppercase">{title}</h2>
          {action}
        </header>
      )}
      <div className={`flex-1 overflow-auto ${bodyClassName}`}>{children}</div>
    </section>
  )
}
