const STORAGE_KEY = 'nexus-theme'
export const THEMES = ['dark', 'pastel', 'mono', 'ocean', 'candy']
const DEFAULT_THEME = 'dark'

export function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return THEMES.includes(stored) ? stored : DEFAULT_THEME
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}
