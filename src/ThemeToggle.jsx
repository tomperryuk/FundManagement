import { useEffect, useState } from 'react'

const MODES = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]

const read = () => { try { const v = localStorage.getItem('theme'); return v === 'light' || v === 'dark' ? v : 'system' } catch { return 'system' } }

// Light / dark / follow-system selector. The choice is remembered in this browser; index.html applies it before first paint.
export default function ThemeToggle() {
  const [mode, setMode] = useState(read)
  useEffect(() => {
    const root = document.documentElement
    if (mode === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode)
    try { if (mode === 'system') localStorage.removeItem('theme'); else localStorage.setItem('theme', mode) } catch { /* storage unavailable */ }
  }, [mode])
  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme">
      {MODES.map(([id, label]) => <button key={id} aria-pressed={mode === id} className={mode === id ? 'on' : ''} onClick={() => setMode(id)}>{label}</button>)}
    </div>
  )
}
