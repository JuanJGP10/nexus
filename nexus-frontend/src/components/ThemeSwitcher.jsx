import { useEffect, useRef, useState } from 'react'
import { applyTheme, getStoredTheme } from '../theme'

const THEME_OPTIONS = [
  { id: 'dark', label: 'Original', swatch: '#a8434b' },
  { id: 'pastel', label: 'Pastel', swatch: '#ffafcc' },
  { id: 'mono', label: 'Mono', swatch: '#7c7a7a' },
  { id: 'ocean', label: 'Océano', swatch: '#68c3d4' },
  { id: 'candy', label: 'Caramelo', swatch: '#a2d2ff' },
]

export function ThemeSwitcher() {
  const [theme, setTheme] = useState(getStoredTheme)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectTheme(id) {
    applyTheme(id)
    setTheme(id)
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="border border-border px-3 py-1.5 font-mono text-xs tracking-[0.1em] text-text-secondary uppercase transition-colors hover:border-accent hover:text-accent"
      >
        Tema
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40">
          <div className="hud-panel p-2">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => selectTheme(option.id)}
                className={`flex w-full items-center gap-2 px-2 py-1.5 font-mono text-xs tracking-[0.05em] uppercase transition-colors ${
                  theme === option.id ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: option.swatch }}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
