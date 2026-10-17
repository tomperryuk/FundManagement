import { Fragment } from 'react'
import { jsx } from 'react/jsx-runtime'
import { findTerms } from './engine.js'

// Splits a string into text and hover-explained term spans. Returns null when nothing matches.
export function annotate(str, focusable = false, key) {
  const found = findTerms(str)
  if (!found.length) return null
  const out = []
  let last = 0
  for (const f of found) {
    if (f.start > last) out.push(str.slice(last, f.start))
    out.push(jsx('span', { className: 'tt', tabIndex: focusable ? 0 : undefined, 'data-tip': f.text, 'aria-describedby': 'tech-tip', children: str.slice(f.start, f.end) }, f.start))
    last = f.end
  }
  if (last < str.length) out.push(str.slice(last))
  return jsx(Fragment, { children: out }, key)
}
