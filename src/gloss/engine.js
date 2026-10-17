// Finds glossary and technology terms in plain text so they can be shown with a hover explanation.
import { terms } from '../glossaryTerms.js'
import { techGlossary } from '../techGlossary.js'

// Extra spellings for glossary entries whose heading holds several terms.
const EXTRA = {
  'Parent order / block': ['Parent order'],
  'Clearing / give-up': ['give-up'],
  'T+1 / T+2': ['T+1', 'T+2'],
  'p95 / p99 latency': ['p95', 'p99'],
  'SLA / SLO': ['SLA', 'SLO'],
  'Value at Risk (VaR)': ['Value at Risk', 'VaR'],
  'Prime broker (PB)': ['Prime broker', 'PB'],
}

// Short mixed-case or numeric names (OMS, VaR, DV01, p95) are matched exactly; everything else ignores case.
const isExact = (k) => k.length <= 5 && /[A-Z0-9]/.test(k.slice(1)) || /^p\d/.test(k)

const entries = new Map() // lower-case key -> { key, text, exact }
const put = (key, text, exact) => entries.set(key.toLowerCase(), { key, text, exact })
for (const [k, text] of Object.entries(techGlossary)) put(k, text, true)
for (const [, term, text] of terms) {
  const names = EXTRA[term] ? (term.includes('/') || term.includes('(') ? [...EXTRA[term]] : [term, ...EXTRA[term]]) : [term]
  for (const n of names) put(n, text, isExact(n))
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const keys = [...entries.values()].map((e) => e.key).sort((a, b) => b.length - a.length)
const pattern = new RegExp(`(?<![\\w.+#-])(${keys.map(esc).join('|')})(?:es|s)?(?![\\w#]|\\+(?!\\+)(?=\\w))`, 'gi')
const hasWord = /[A-Za-z]{2}/

// Returns [{ start, end, text, term }] for the first occurrence of each term in the string.
export function findTerms(str) {
  if (!hasWord.test(str)) return []
  const seen = new Set()
  const out = []
  for (const m of str.matchAll(pattern)) {
    const e = entries.get(m[1].toLowerCase())
    if (!e || (e.exact && m[1] !== e.key) || seen.has(e.key.toLowerCase())) continue
    seen.add(e.key.toLowerCase())
    out.push({ start: m.index, end: m.index + m[0].length, text: e.text })
  }
  return out
}
