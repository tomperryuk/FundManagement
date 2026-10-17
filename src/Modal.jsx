import { useEffect, useRef } from 'react'

// Accessible modal dialog: Esc and backdrop close it, focus moves in and is restored, background scroll is locked.
export default function Modal({ open, onClose, label, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const scroll = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key !== 'Tab' || !ref.current) return
      const f = [...ref.current.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')]
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = scroll
      if (prev instanceof HTMLElement) prev.focus()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
