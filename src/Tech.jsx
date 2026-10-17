import { useEffect, useState } from 'react'
import { techGlossary, techPattern } from './techGlossary.js'

// Wraps known technology names in plain text with a hover/focus explanation.
export default function Tech({ children }) {
  if (typeof children !== 'string') return children ?? null
  const out = []
  let last = 0
  for (const m of children.matchAll(techPattern)) {
    if (m.index > last) out.push(children.slice(last, m.index))
    out.push(<span key={m.index} className="tt" tabIndex={0} data-tip={techGlossary[m[0]]} aria-describedby="tech-tip">{m[0]}</span>)
    last = m.index + m[0].length
  }
  if (!out.length) return children
  if (last < children.length) out.push(children.slice(last))
  return <>{out}</>
}

// Single floating tooltip shared by every .tt element (works inside scrolling dialogs and on keyboard focus).
export function TechTooltipHost() {
  const [tip, setTip] = useState(null)
  useEffect(() => {
    const show = (e) => {
      const el = e.target instanceof Element ? e.target.closest('.tt') : null
      if (!el) return
      const r = el.getBoundingClientRect()
      setTip({ text: el.dataset.tip, x: r.left + r.width / 2, top: r.top, bottom: r.bottom })
    }
    const hide = (e) => { if (!e || !(e.target instanceof Element) || e.target.closest('.tt')) setTip(null) }
    const esc = (e) => { if (e.key === 'Escape') setTip(null) }
    document.addEventListener('mouseover', show)
    document.addEventListener('focusin', show)
    document.addEventListener('mouseout', hide)
    document.addEventListener('focusout', hide)
    document.addEventListener('keydown', esc)
    window.addEventListener('scroll', hide, true)
    return () => {
      document.removeEventListener('mouseover', show); document.removeEventListener('focusin', show)
      document.removeEventListener('mouseout', hide); document.removeEventListener('focusout', hide)
      document.removeEventListener('keydown', esc); window.removeEventListener('scroll', hide, true)
    }
  }, [])
  const w = 280
  const above = tip && tip.top > 110
  const left = tip ? Math.min(Math.max(tip.x - w / 2, 8), window.innerWidth - w - 8) : 0
  return (
    <div id="tech-tip" role="tooltip" className={'tt-pop' + (tip ? ' on' : '')} style={tip ? { left, width: w, ...(above ? { bottom: window.innerHeight - tip.top + 6 } : { top: tip.bottom + 6 }) } : undefined}>
      {tip?.text}
    </div>
  )
}
