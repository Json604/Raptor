import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, currentTheme } from '../lib/theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme)
  const next = theme === 'dark' ? 'light' : 'dark'

  const toggle = () => {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      className="nav-icon"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  )
}
