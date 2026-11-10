import { useEffect, useMemo, useRef, useState } from 'react'
import Modal from './Modal.jsx'
import { PAGES, href } from './journey.jsx'
import { terms } from './glossaryTerms.js'
import { decisionCatalogue } from './decisionCatalogue.js'

const KIND_ORDER = ['Page', 'Section', 'Component', 'Decision', 'Data', 'Team', 'Term']
const GRAPH_KINDS = { component: 'Component', external: 'Component', subcomponent: 'Component', dataset: 'Data', team: 'Team', step: 'Component', technology: 'Component' }

const clip = (text, n = 110) => (text && text.length > n ? text.slice(0, n - 1).trimEnd() + '…' : text || '')

function staticEntries() {
  const out = []
  for (const p of PAGES) {
    out.push({ kind: 'Page', title: p.title, sub: p.stage.title, href: href(p.id), hay: `${p.title} ${p.summary || ''}` })
    for (const [id, title] of p.parts || []) out.push({ kind: 'Section', title: `${p.title}: ${title}`, sub: p.stage.title, href: href(p.id, id), hay: `${p.title} ${title}` })
  }
  for (const d of decisionCatalogue) out.push({ kind: 'Decision', title: d.q, sub: clip(d.context), href: d.link, hay: `${d.q} ${d.context || ''} ${d.rec || ''}` })
  for (const [area, name, definition] of terms) out.push({ kind: 'Term', title: name, sub: clip(definition), href: `#/glossary/${encodeURIComponent(name)}`, hay: `${area} ${name} ${definition}` })
  return out
}

function graphEntries(data) {
  return data.nodes.filter(n => GRAPH_KINDS[n.type]).map(n => ({
    kind: GRAPH_KINDS[n.type], title: n.label, sub: clip(n.description || n.scope || n.tech || n.group || n.category || ''),
    href: n.route ? `#/${n.route}` : `#/graph/${n.id}`, hay: `${n.label} ${n.description || ''} ${n.scope || ''} ${n.tech || ''}`,
  }))
}

export function searchEntries(entries, query, limit = 30) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return []
  const scored = []
  for (const e of entries) {
    const title = e.title.toLowerCase(), hay = (e.hay || '').toLowerCase()
    if (!tokens.every(t => title.includes(t) || hay.includes(t))) continue
    const score = title === tokens.join(' ') ? 0 : title.startsWith(tokens[0]) ? 1 : tokens.every(t => title.includes(t)) ? 2 : 3
    scored.push([score * 10 + KIND_ORDER.indexOf(e.kind), e])
  }
  return scored.sort((a, b) => a[0] - b[0]).slice(0, limit).map(x => x[1])
}

// Opened on demand from the masthead, so the graph index is fetched the first time someone searches.
export default function SearchDialog({ onClose }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [graph, setGraph] = useState([])
  const input = useRef(null)
  const base = useMemo(staticEntries, [])
  useEffect(() => {
    let live = true
    import('./graphData.json').then(m => { if (live) setGraph(graphEntries(m.default || m)) }).catch(() => {})
    return () => { live = false }
  }, [])
  useEffect(() => { input.current?.focus() }, [])
  const results = useMemo(() => searchEntries([...base, ...graph], q), [base, graph, q])
  const go = (e) => { window.location.hash = e.href.slice(1); onClose() }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]) }
  }
  useEffect(() => { document.getElementById(`search-opt-${active}`)?.scrollIntoView({ block: 'nearest' }) }, [active])
  return <Modal open onClose={onClose} label="Search the blueprint">
    <div className="search-box">
      <label htmlFor="site-search">Search pages, components, decisions, data and terms</label>
      <input id="site-search" ref={input} type="search" role="combobox" aria-expanded="true" aria-controls="search-results" aria-activedescendant={results[active] ? `search-opt-${active}` : undefined} autoComplete="off" value={q} placeholder="For example: reconciliation, Kafka, drawdown" onChange={e => { setQ(e.target.value); setActive(0) }} onKeyDown={onKey} />
      <p className="small muted" role="status" aria-live="polite">{q.trim() ? `${results.length}${results.length === 30 ? '+' : ''} result${results.length === 1 ? '' : 's'}` : 'Type to search. Use ↑ ↓ and Enter to open a result.'}</p>
      <ul id="search-results" role="listbox" aria-label="Search results">
        {results.map((r, i) => <li key={r.kind + r.href + r.title} id={`search-opt-${i}`} role="option" aria-selected={i === active} className={i === active ? 'on' : ''}>
          <a href={r.href} onClick={e => { e.preventDefault(); go(r) }} tabIndex={-1}><span className="kind">{r.kind}</span><b>{r.title}</b>{r.sub && <span className="sub">{r.sub}</span>}</a>
        </li>)}
      </ul>
      {q.trim() && !results.length && <p className="muted">Nothing matches “{q.trim()}”. Try fewer or shorter words.</p>}
    </div>
  </Modal>
}
