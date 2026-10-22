import { useEffect, useMemo, useRef, useState } from 'react'
import { Network, DataSet } from 'vis-network/standalone'
import { graphNodeForRoute } from './graphRoutes.js'

// Routes: #/graph (whole graph) and #/graph/<node id> (node selected). The URL is the single source of truth for the selection.
const COLORS = { component: '#2f6fae', external: '#7a7a74', subcomponent: '#8fb3d6', decision: '#c2662d', option: '#e3b28e', step: '#2e8b57', gate: '#1f5f3c', team: '#7b4fa3', owner: '#b07cc6', dataset: '#c9a227', technology: '#4a9a9a' }
const DEFAULT_OFF = new Set(['option', 'subcomponent'])
const EDGE_OFF = new Set(['mentions', 'option'])
const SKIP = new Set(['id', 'type', 'label', 'degree', 'route'])
const nice = s => s.replace(/_/g, ' ')
export const graphHref = id => `#/graph${id ? '/' + id : ''}`
const decode = s => { try { return decodeURIComponent(s) } catch { return s } }

export default function GraphView({ node }) {
  const [G, setG] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    import('./graphData.json').then(m => setG(m.default), () => setFailed(true))
  }, [])
  if (failed) return <p role="alert">The knowledge graph could not be loaded. Please reload.</p>
  if (!G) return <p role="status" className="muted">Loading knowledge graph…</p>
  return <Graph G={G} selected={node ? decode(node) : null} />
}

function Graph({ G, selected }) {
  const N = useMemo(() => new Map(G.nodes.map(n => [n.id, n])), [G])
  const types = useMemo(() => [...new Set(G.nodes.map(n => n.type))].sort(), [G])
  const etypes = useMemo(() => [...new Set(G.edges.map(e => e.type))].sort(), [G])
  const [on, setOn] = useState(() => new Set(types.filter(t => !DEFAULT_OFF.has(t))))
  const [eon, setEon] = useState(() => new Set(etypes.filter(t => !EDGE_OFF.has(t))))
  // Arriving on a node link starts in neighbourhood view; the whole graph is dense.
  const [focusMode, setFocusMode] = useState(Boolean(selected))
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState(0)
  const box = useRef(null)
  const net = useRef(null)
  const ds = useRef({ nodes: new DataSet(), edges: new DataSet() })
  const sel = selected && N.has(selected) ? selected : null

  const adjacency = useMemo(() => {
    const a = new Map()
    G.edges.forEach(e => {
      if (!a.has(e.source)) a.set(e.source, [])
      if (!a.has(e.target)) a.set(e.target, [])
      a.get(e.source).push([e.target, e])
      a.get(e.target).push([e.source, e])
    })
    return a
  }, [G])

  const { ns, es } = useMemo(() => {
    let ids
    if (focusMode && sel) {
      ids = new Set([sel])
      for (const [o, e] of adjacency.get(sel) || []) if (eon.has(e.type)) ids.add(o)
    } else ids = new Set(G.nodes.filter(n => on.has(n.type)).map(n => n.id))
    if (sel) ids.add(sel)
    return { ns: [...ids].map(i => N.get(i)), es: G.edges.filter(e => eon.has(e.type) && ids.has(e.source) && ids.has(e.target)) }
  }, [G, N, adjacency, on, eon, focusMode, sel])

  // Re-colour labels when the site theme changes.
  useEffect(() => {
    const bump = () => setTheme(t => t + 1)
    const mo = new MutationObserver(bump)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener?.('change', bump)
    return () => { mo.disconnect(); mq?.removeEventListener?.('change', bump) }
  }, [])

  useEffect(() => {
    const network = new Network(box.current, ds.current, {
      physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -45, springLength: 110 }, stabilization: { iterations: 250 } },
      interaction: { hover: true, tooltipDelay: 120 }, edges: { smooth: false },
    })
    net.current = network
    network.on('click', p => { if (p.nodes[0]) window.location.hash = graphHref(p.nodes[0]) })
    network.on('doubleClick', p => { if (p.nodes[0]) { setFocusMode(true); window.location.hash = graphHref(p.nodes[0]) } })
    return () => { network.destroy(); net.current = null }
  }, [])

  useEffect(() => {
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#222'
    const { nodes, edges } = ds.current
    nodes.clear(); edges.clear()
    nodes.add(ns.map(n => ({
      id: n.id, label: n.label.length > 34 ? n.label.slice(0, 32) + '…' : n.label, title: `${n.label} (${n.type})`,
      color: { background: COLORS[n.type] || '#999', border: COLORS[n.type] || '#999', highlight: { background: '#f0c040', border: '#b08000' } },
      font: { color: ink, size: 12 }, shape: n.type === 'decision' ? 'diamond' : n.type === 'technology' ? 'square' : 'dot',
      size: 6 + Math.min(22, Math.sqrt(n.degree || 1) * 3),
    })))
    edges.add(es.map((e, i) => ({
      id: i, from: e.source, to: e.target, arrows: e.type === 'interface' || e.type === 'selected' ? 'to' : '',
      title: [e.type, e.label, e.protocol, e.frequency].filter(Boolean).join(' · '),
      color: { color: e.type === 'interface' ? '#2f6fae99' : e.type === 'selected' ? '#c2662d' : '#9995', highlight: '#f0c040' },
      dashes: e.type === 'mentions', width: e.type === 'interface' || e.type === 'selected' ? 1.6 : 0.7,
    })))
    if (sel) { net.current?.selectNodes([sel]); setTimeout(() => net.current?.focus(sel, { scale: 1.1, animation: { duration: 400 } }), 400) }
    else setTimeout(() => net.current?.fit(), 400)
  }, [ns, es, sel, theme])

  const hits = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q ? G.nodes.filter(n => n.label.toLowerCase().includes(q)).sort((a, b) => (b.degree || 0) - (a.degree || 0)).slice(0, 25) : []
  }, [G, query])

  const toggle = (set, setter, t) => setter(prev => { const next = new Set(prev); next.has(t) ? next.delete(t) : next.add(t); return next })
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }, () => {})

  const n = sel ? N.get(sel) : null
  const groups = {}
  if (n) for (const [o, e] of adjacency.get(n.id) || []) (groups[`${e.source === n.id ? '→' : '←'} ${nice(e.type)}`] ??= []).push([o, e])

  return (
    <div className="kg">
      <aside className="kg-side" aria-label="Graph controls">
        <p className="small muted">{G.nodes.length} nodes · {G.edges.length} connections</p>
        <label className="kg-search">Find a node<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search nodes…" autoComplete="off" /></label>
        {query.trim() && <ul className="kg-results">{hits.length ? hits.map(h => <li key={h.id}><a href={graphHref(h.id)} onClick={() => setQuery('')}><span className="dot" style={{ background: COLORS[h.type] }} />{h.label} <small>{h.type}</small></a></li>) : <li className="muted">No match</li>}</ul>}
        <h4>Show node types</h4>
        {types.map(t => <label key={t} className="kg-check"><input type="checkbox" checked={on.has(t)} onChange={() => toggle(on, setOn, t)} /><span className="dot" style={{ background: COLORS[t] }} />{nice(t)}<span className="count">{G.nodes.filter(x => x.type === t).length}</span></label>)}
        <h4>Show connections</h4>
        {etypes.map(t => <label key={t} className="kg-check"><input type="checkbox" checked={eon.has(t)} onChange={() => toggle(eon, setEon, t)} />{nice(t)}<span className="count">{G.edges.filter(x => x.type === t).length}</span></label>)}
        <h4>View</h4>
        <div className="kg-btns">
          <button onClick={() => { setFocusMode(false); if (sel) window.location.hash = graphHref(); else net.current?.fit() }}>Whole graph</button>
          <button onClick={() => net.current?.fit()}>Fit</button>
          {sel && <button onClick={() => setFocusMode(f => !f)} aria-pressed={focusMode}>{focusMode ? 'Show all' : 'Neighbours only'}</button>}
        </div>
        <p className="small muted">Click a node for details; double-click to focus on it and its neighbours. Every selection has its own link.</p>
      </aside>
      <div className="kg-canvas" ref={box} role="img" aria-label="Knowledge graph of components, decisions, datasets and technologies. Use search and the detail panel to navigate by keyboard." />
      <section className="kg-detail" aria-live="polite" aria-label="Selected node">
        {selected && !n && <p className="muted">That node is not in the graph. <a href={graphHref()}>Show the whole graph</a>.</p>}
        {!selected && <p className="muted">Select a node to see its attributes and connections, and to link to it.</p>}
        {n && <>
          <span className="kg-kind"><span className="dot" style={{ background: COLORS[n.type] }} />{nice(n.type)}</span>
          <h3>{n.label}</h3>
          <p className="kg-links">
            {n.route && <a href={`#/${n.route}`}>Open in the blueprint →</a>}
            <button className="link" onClick={copy}>{copied ? 'Link copied' : 'Copy link to this node'}</button>
          </p>
          <dl>{Object.entries(n).filter(([k]) => !SKIP.has(k)).map(([k, v]) => <div key={k}><dt>{nice(k)}</dt><dd>{Array.isArray(v) ? v.join('\n') : String(v)}</dd></div>)}</dl>
          {Object.keys(groups).sort().map(k => <div key={k} className="kg-nb"><h4>{k} ({groups[k].length})</h4>
            {groups[k].sort((a, b) => N.get(a[0]).label.localeCompare(N.get(b[0]).label)).map(([o, e], i) => <a key={o + i} href={graphHref(o)}>{N.get(o).label}{e.label ? <small> — {e.label}</small> : null}</a>)}</div>)}
        </>}
      </section>
    </div>
  )
}

// Link from a blueprint page to its place in the graph, when it has one.
export function graphLinkFor(route) {
  const id = graphNodeForRoute[route]
  return id ? graphHref(id) : null
}
