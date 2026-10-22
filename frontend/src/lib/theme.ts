// Dark by default; the nav switch flips to light and remembers it.
// public/theme.js applies the default or the saved choice before first paint.
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'raptor-theme'

export const currentTheme = (): Theme =>
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff')
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage blocked (private mode): the switch still works for this visit
  }
}
