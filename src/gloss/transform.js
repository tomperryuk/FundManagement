import { annotate } from './annotate.jsx'

// Host elements whose text must stay plain: interactive controls, headings, code and SVG text.
const SKIP = new Set(['a', 'button', 'summary', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'kbd', 'label', 'option', 'select', 'textarea', 'input', 'title', 'script', 'style', 'text', 'tspan'])
let off = false
export const withoutGlossary = (fn) => { const prev = off; off = true; try { return fn() } finally { off = prev } }

const one = (c, i) => {
  if (typeof c !== 'string') return c
  return annotate(c, false, 'g' + i) ?? c
}

// Called for every element created: annotates string children of plain text-bearing host elements.
export function transform(type, props) {
  if (off || typeof type !== 'string' || SKIP.has(type) || !props) return props
  if (props['data-no-gloss'] !== undefined || (typeof props.className === 'string' && /(^|\s)tt(\s|$)/.test(props.className))) return props
  const c = props.children
  if (typeof c === 'string') { const a = annotate(c); return a ? { ...props, children: a } : props }
  if (Array.isArray(c) && c.some((x) => typeof x === 'string')) return { ...props, children: c.map(one) }
  return props
}
