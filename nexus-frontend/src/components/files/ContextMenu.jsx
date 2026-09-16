import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const MARGIN = 8

/**
 * Menú contextual del explorador.
 *
 * `sections` es una lista de listas de acciones; entre sección y sección se pinta
 * un separador, igual que en un menú de escritorio. Cada acción es
 * `{ label, icon, onSelect, shortcut, danger, disabled }`.
 *
 * En escritorio se posiciona donde está el cursor y se recorta contra los bordes.
 * En móvil sale como hoja inferior: el menú completo mide más de 400px y en una
 * pantalla de teléfono, flotando, tapaba media interfaz y acababa recolocándose
 * arriba del todo, lejos de donde el usuario había pulsado.
 */
export function ContextMenu({ x, y, sections, onClose }) {
  const menuRef = useRef(null)
  const [position, setPosition] = useState({ left: x, top: y, ready: false })
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isFloating, setIsFloating] = useState(() => window.matchMedia('(min-width: 640px)').matches)

  // Se aplana una sola vez: cada acción lleva ya su índice global, que es lo que
  // usan el teclado y el resaltado, sin necesidad de un contador mutable.
  const groups = []
  const actions = []
  for (const section of sections) {
    const visible = section.filter(Boolean)
    if (visible.length === 0) continue
    groups.push(visible.map((action) => ({ action, index: actions.push(action) - 1 })))
  }
  const enabledIndexes = actions.map((action, index) => (action.disabled ? -1 : index)).filter((i) => i >= 0)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)')
    const update = () => setIsFloating(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useLayoutEffect(() => {
    const element = menuRef.current
    if (!element || !isFloating) return
    const { width, height } = element.getBoundingClientRect()
    const left = Math.min(Math.max(MARGIN, x), window.innerWidth - width - MARGIN)
    const top = Math.min(Math.max(MARGIN, y), window.innerHeight - height - MARGIN)
    setPosition({ left, top, ready: true })
  }, [x, y, isFloating])

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) onClose()
    }
    function handleScroll() {
      onClose()
    }
    // `capture` para enterarnos antes de que el clic llegue al listado y cambie la selección.
    document.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('resize', handleScroll)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('resize', handleScroll)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  useEffect(() => {
    menuRef.current?.focus()
  }, [])

  function moveActive(step) {
    if (enabledIndexes.length === 0) return
    const current = enabledIndexes.indexOf(activeIndex)
    const next = current === -1 ? (step > 0 ? 0 : enabledIndexes.length - 1) : current + step
    const wrapped = (next + enabledIndexes.length) % enabledIndexes.length
    setActiveIndex(enabledIndexes[wrapped])
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveActive(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveActive(-1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const action = actions[activeIndex]
      if (action && !action.disabled) {
        onClose()
        action.onSelect()
      }
    }
  }

  return (
    <>
      {!isFloating && <div className="fixed inset-0 z-[69] bg-bg/60" onClick={onClose} role="presentation" />}

      <div
        ref={menuRef}
        role="menu"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onContextMenu={(event) => event.preventDefault()}
        style={
          isFloating
            ? { left: position.left, top: position.top, visibility: position.ready ? 'visible' : 'hidden' }
            : undefined
        }
        className={
          isFloating
            ? 'fixed z-[70] min-w-52 border border-border bg-surface py-1 shadow-xl outline-none'
            : 'fixed inset-x-0 bottom-0 z-[70] max-h-[75dvh] overflow-auto border-t border-border bg-surface py-1 pb-[env(safe-area-inset-bottom)] shadow-xl outline-none'
        }
      >
        {/* Asa: sin ella la hoja no se lee como algo que se cierra deslizando o tocando fuera. */}
        {!isFloating && (
          <div className="flex justify-center py-1.5">
            <span className="h-1 w-10 rounded-full bg-border" />
          </div>
        )}

        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className={groupIndex > 0 ? 'mt-1 border-t border-border pt-1' : undefined}>
            {group.map(({ action, index }) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                disabled={action.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onClose()
                  action.onSelect()
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors sm:px-3 sm:py-1.5 ${
                  action.disabled
                    ? 'cursor-not-allowed text-text-secondary/40'
                    : action.danger
                      ? 'text-danger hover:bg-danger/10'
                      : 'text-text-primary hover:bg-accent/15'
                } ${
                  index === activeIndex && !action.disabled
                    ? action.danger
                      ? 'bg-danger/10'
                      : 'bg-accent/15'
                    : ''
                }`}
              >
                {action.icon ? <action.icon className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" />}
                <span className="flex-1 truncate">{action.label}</span>
                {action.shortcut && (
                  <span className="hidden shrink-0 font-mono text-[10px] tracking-wider text-text-secondary sm:inline">
                    {action.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
