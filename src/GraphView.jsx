import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Network, DataSet } from 'vis-network/standalone'
import { graphNodeForRoute, slug } from './graphRoutes.js'
import { decisionCatalogue } from './decisionCatalogue.js'
import { useDecisionState } from './choices.js'

// Routes: #/graph (directory), #/graph/<id> (an item's profile) and #/graph/<from>~<to> (route between two items).
// The URL is the single source of truth for the selection. The drawn graph opens on demand over the page.
const COLORS = { component: '#2f6fae', external: '#7a7a74', subcomponent: '#8fb3d6', decision: '#c2662d', option: '#e3b28e', step: '#2e8b57', gate: '#1f5f3c', team: '#7b4fa3', owner: '#b07cc6', dataset: '#c9a227', technology: '#4a9a9a' }
const TYPE_NAMES = { component: 'Component', external: 'External party', subcomponent: 'Part', decision: 'Decision', step: 'Value-chain step', gate: 'Delivery gate', team: 'Team', owner: 'Accountable owner', dataset: 'Dataset', technology: 'Technology' }
// [outgoing phrase, incoming phrase]: "source <out> target", "target <in> source".
const REL = {
  interface: ['sends data to', 'receives data from'], has_part: ['includes', 'is part of'], implemented_with: ['is built with', 'is used in'],
  golden_source_of: ['is the golden source of', 'has its golden source in'], used_by: ['is used by', 'uses'],
  builds: ['builds', 'is built by'], accountable_for: ['is accountable for', 'has accountable owner'],
  decides: ['shapes', 'is shaped by'], needed_by: ['must be settled by', 'needs a decision on'], affects: ['affects', 'is affected by'],
  supports: ['supports', 'is supported by'], proven_by: ['is proven at', 'proves'], mentions: ['mentions', 'is mentioned by'],
}
const REL_ORDER = Object.keys(REL)
// Business sections of a profile: [section, [[edge type, direction, heading]...]]. Empty headings are hidden.
const SECTIONS = [
  ['Ownership', [['builds', 'in', 'Built by'], ['accountable_for', 'in', 'Accountable owner'], ['builds', 'out', 'Builds'], ['accountable_for', 'out', 'Accountable for']]],
  ['Business value', [['supports', 'out', 'Supports these value-chain steps'], ['supports', 'in', 'Supported by'], ['proven_by', 'out', 'Proven at'], ['proven_by', 'in', 'Proves these steps'], ['affects', 'out', 'Affects these steps'], ['affects', 'in', 'Affected by these decisions']]],
  ['Data', [['golden_source_of', 'out', 'Golden source of'], ['golden_source_of', 'in', 'Golden source'], ['used_by', 'in', 'Uses'], ['used_by', 'out', 'Used by'], ['interface', 'out', 'Sends data to'], ['interface', 'in', 'Receives data from']]],
  ['Decisions', [['decides', 'in', 'Shaped by these decisions'], ['decides', 'out', 'Shapes'], ['needed_by', 'out', 'Must be settled by'], ['needed_by', 'in', 'Decisions to settle by this gate']]],
  ['Structure & technology', [['has_part', 'out', 'Made up of'], ['has_part', 'in', 'Part of'], ['implemented_with', 'out', 'Built with'], ['implemented_with', 'in', 'Used in']]],
]
// Lower weight = more meaningful hop when tracing a route; loose mentions are a last resort.
const WEIGHT = { interface: 1, has_part: 1, golden_source_of: 1, used_by: 1, builds: 1, accountable_for: 1, decides: 1, implemented_with: 1.5, supports: 2, proven_by: 2, needed_by: 2, affects: 2.5, mentions: 4 }
const LENSES = [
  { id: 'flow', title: 'Data flow', types: ['component', 'external'], edges: ['interface'] },
  { id: 'data', title: 'Data ownership', types: ['component', 'external', 'dataset'], edges: ['golden_source_of', 'used_by'] },
  { id: 'decisions', title: 'Decisions', types: ['decision', 'component', 'external', 'gate'], edges: ['decides', 'needed_by'] },
  { id: 'delivery', title: 'Value chain & delivery', types: ['step', 'gate', 'component', 'external'], edges: ['supports', 'proven_by'] },
  { id: 'people', title: 'Teams & owners', types: ['team', 'owner', 'component', 'external'], edges: ['builds', 'accountable_for'] },
  { id: 'tech', title: 'Technology', types: ['component', 'subcomponent', 'technology'], edges: ['has_part', 'implemented_with'] },
  { id: 'all', title: 'Everything', types: ['component', 'external', 'decision', 'dataset', 'team', 'owner', 'step', 'gate', 'technology'], edges: REL_ORDER.filter(t => t !== 'mentions') },
]
const lensById = Object.fromEntries(LENSES.map(l => [l.id, l]))
const FOCUS_EDGES = new Set(REL_ORDER.filter(t => t !== 'mentions'))
const FACTS = ['scope', 'measure', 'status', 'run_model', 'consult', 'topology', 'stores', 'golden_source', 'providers', 'volume', 'latency', 'sensitivity', 'retention', 'selection_owner', 'recommendation', 'context', 'revisit', 'tech', 'title', 'tasks']
const STATUS = { open: 'Open', proposed: 'Under review', agreed: 'Agreed' }
const EXAMPLES = [['comp:oms', 'comp:accounting'], ['ds:positions-tax-lots', 'comp:investorportal'], ['team:data-platform', 'gate:3'], ['dec:which-oms-vendor', 'step:trade-execute']]
const nice = s => s.replace(/_/g, ' ')
const cap = s => s[0].toUpperCase() + s.slice(1)
export const graphHref = (id, to) => `#/graph${id ? '/' + id : ''}${to ? '~' + to : ''}`
const decode = s => { try { return decodeURIComponent(s) } catch { return s } }
const pref = (key, fallback, ok) => { try { const v = localStorage.getItem(key); return ok(v) ? v : fallback } catch { return fallback } }
const save = (key, v) => { try { localStorage.setItem(key, v) } catch { /* preference only */ } }
const decisionBySlug = new Map(decisionCatalogue.map(d => [slug(d.q), d]))
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const groupBy = (list, key) => list.reduce((m, x) => { const k = key(x) || 'Other'; (m[k] ??= []).push(x); return m }, {})

export default function GraphView({ node }) {
  const [G, setG] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    import('./graphData.json').then(m => setG(m.default), () => setFailed(true))
  }, [])
  if (failed) return <p role="alert">Connections could not be loaded. Please reload.</p>
  if (!G) return <p role="status" className="muted">Loading connections…</p>
  const [from, to] = node ? decode(node).split('~') : []
  return <Explorer G={G} selected={from || null} target={to || null} />
}

function Explorer({ G, selected, target }) {
  // Option nodes only ever hang off their decision, which already lists its options.
  const nodes = useMemo(() => G.nodes.filter(n => n.type !== 'option'), [G])
  const edges = useMemo(() => G.edges.filter(e => REL[e.type]), [G])
  const N = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes])
  const adjacency = useMemo(() => {
    const a = new Map(nodes.map(n => [n.id, []]))
    edges.forEach(e => { a.get(e.source)?.push([e.target, e]); a.get(e.target)?.push([e.source, e]) })
    return a
  }, [nodes, edges])
  const shared = useDecisionState()
  const ctx = { G, nodes, edges, N, adjacency, records: shared?.records || {} }

  const sel = selected && N.has(selected) ? selected : null
  const tgt = sel && target && N.has(target) && target !== sel ? target : null
  const [loose, setLoose] = useState(false)
  const route = useMemo(() => tgt ? shortestRoute(sel, tgt, adjacency, loose) : null, [sel, tgt, adjacency, loose])
  const [graphOpen, setGraphOpen] = useState(false)
  // Following a link inside the explorer starts the new item at the top of the explorer.
  useEffect(() => { const el = document.querySelector('.kgx'); if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' }) }, [sel, tgt])
  const n = sel ? N.get(sel) : null

  return (
    <div className="kgx">
      <div className="kgx-bar">
        <NodeSearch nodes={nodes} label="Search" placeholder="Search systems, decisions, data, teams" onPick={id => { window.location.hash = graphHref(id) }} big />
        <button className="kgx-btn" onClick={() => setGraphOpen(true)}>◎ {route ? 'Draw this route' : n ? 'Show as graph' : 'Graph view'}</button>
      </div>

      {selected && !n && <p className="muted">That item is not in the graph. <a href={graphHref()}>See all items</a>.</p>}
      {!selected && <Directory ctx={ctx} />}
      {route && <Route route={route} ctx={ctx} from={sel} to={tgt} />}
      {target && sel && !route && <div className="kgx-card">
        <p>{tgt ? <>No route connects <b>{n.label}</b> and <b>{N.get(tgt).label}</b>{loose ? '.' : ' through direct relationships.'}</> : 'That route target is not in the graph.'}</p>
        <p className="kg-links">{tgt && !loose && <button className="link" onClick={() => setLoose(true)}>Try again including loose mentions</button>}<a href={graphHref(sel)}>Back to {n.label}</a></p>
      </div>}
      {n && !target && <Profile n={n} ctx={ctx} />}

      {graphOpen && <GraphPanel ctx={ctx} sel={sel} route={route} onClose={() => setGraphOpen(false)} />}
    </div>
  )
}

// ---------- Business view ----------

const TABS = [['chain', 'Value chain'], ['component', 'Systems'], ['decision', 'Decisions'], ['dataset', 'Data'], ['people', 'Teams']]

function Directory({ ctx }) {
  const { nodes, N, adjacency } = ctx
  const [tab, setTabState] = useState(() => pref('fpb-graph-tab', 'chain', v => TABS.some(([id]) => id === v)))
  const setTab = id => { setTabState(id); save('fpb-graph-tab', id) }
  const of = t => nodes.filter(n => n.type === t)
  const linked = (id, type, dir) => adjacency.get(id).filter(([, e]) => e.type === type && (dir === 'out' ? e.source === id : e.target === id)).map(([o]) => N.get(o))
  const link = n => n && <a href={graphHref(n.id)}>{n.label}</a>

  // Every tab uses the same card: what it is, a short description, its key links and one footer fact.
  let groups, card, hint
  if (tab === 'chain') {
    hint = 'The eight steps of the value chain and the systems behind each one.'
    groups = { '': of('step') }
    card = (s, i) => ({ kicker: `Step ${i + 1}`, text: s.measure, label: 'Supported by', items: linked(s.id, 'supports', 'in'), footer: linked(s.id, 'proven_by', 'out')[0] && <>Proven at {link(linked(s.id, 'proven_by', 'out')[0])}</> })
  } else if (tab === 'component') {
    hint = 'Every system on the platform and the outside parties it works with, by business area.'
    groups = groupBy([...of('component'), ...of('external')], n => n.type === 'external' ? 'External parties' : n.group)
    card = n => ({ text: n.description, label: 'Supports', items: linked(n.id, 'supports', 'out'), footer: linked(n.id, 'builds', 'in')[0] && <>Built by {link(linked(n.id, 'builds', 'in')[0])}</> })
  } else if (tab === 'decision') {
    hint = 'The open design decisions, by area, with their status in the shared decision register.'
    groups = groupBy(of('decision'), n => n.category)
    card = n => ({ text: n.context, label: 'Shapes', items: linked(n.id, 'decides', 'out'), footer: <>{n.selected && <>Recommended: <b>{n.selected}</b></>}{linked(n.id, 'needed_by', 'out')[0] && <> · by {link(linked(n.id, 'needed_by', 'out')[0])}</>}</> })
  } else if (tab === 'dataset') {
    hint = 'The key datasets, by domain: where each is mastered and which systems use it.'
    groups = groupBy(of('dataset'), n => n.category)
    card = n => ({ text: n.description || (n.stores && `Stored in ${n.stores}`), label: 'Used by', items: linked(n.id, 'used_by', 'out'), footer: linked(n.id, 'golden_source_of', 'in')[0] && <>Golden source: {link(linked(n.id, 'golden_source_of', 'in')[0])}</> })
  } else {
    hint = 'Who builds each system and who is accountable for it.'
    groups = { 'Delivery teams': of('team'), 'Accountable owners': of('owner') }
    card = n => n.type === 'team'
      ? { kicker: n.topology ? `${n.topology} team` : 'Team', label: 'Builds', items: linked(n.id, 'builds', 'out'), footer: plural(linked(n.id, 'builds', 'out').length, 'system') }
      : { kicker: 'Accountable owner', label: 'Accountable for', items: linked(n.id, 'accountable_for', 'out'), footer: plural(linked(n.id, 'accountable_for', 'out').length, 'system') }
  }

  return <section aria-label="Browse">
    <div className="kgx-tabs" role="tablist" aria-label="Browse by">{TABS.map(([id, title]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{title}</button>)}</div>
    <p className="kgx-hint-line muted">{hint}</p>
    {Object.entries(groups).map(([g, list]) => <section key={g} className="kgx-group">
      {g && <h4 className="kgx-group-head">{g} <span>{list.length}</span></h4>}
      <ol className="kgx-cards">{list.map((n, i) => <Card key={n.id} n={n} ctx={ctx} {...card(n, i)} />)}</ol>
    </section>)}
  </section>
}

function Card({ n, ctx, kicker, text, label, items, footer }) {
  return <li className="kgx-card" style={{ '--kind': COLORS[n.type] }}>
    {kicker && <span className="kgx-num">{kicker}</span>}
    <h4><a href={graphHref(n.id)}>{n.label}</a>{n.type === 'decision' && <> <DecisionChip n={n} ctx={ctx} /></>}</h4>
    {text && <p className="small muted kgx-clamp">{text}</p>}
    {items?.length > 0 && <div className="kgx-card-links">
      {label && <span className="kgx-card-label">{label}</span>}
      <Pills ctx={ctx} items={items} limit={4} />
    </div>}
    {footer && <p className="small kgx-gate">{footer}</p>}
  </li>
}

function Pills({ ctx, items, limit = 99, note }) {
  const [all, setAll] = useState(false)
  return <ul className="kgx-pills">
    {(all ? items : items.slice(0, limit)).map((n, i) => <li key={n.id + i}>
      <a href={graphHref(n.id)} title={note?.(i)?.title}><span className="dot" style={{ background: COLORS[n.type] }} />{n.label}{note?.(i)?.text && <small>{note(i).text}</small>}</a>
      {n.type === 'decision' && <DecisionChip n={n} ctx={ctx} />}
    </li>)}
    {!all && items.length > limit && <li><button className="link" onClick={() => setAll(true)}>+{items.length - limit} more</button></li>}
  </ul>
}

function DecisionChip({ n, ctx }) {
  const d = decisionBySlug.get(slug(n.label))
  const r = d && ctx.records[d.id]
  const status = r?.status || 'open'
  return <span className={`kgx-chip ${status}`} title={r?.choice ? `Shared selection: ${r.choice}` : `Recommended: ${n.selected}`}>{STATUS[status]}</span>
}

function Profile({ n, ctx }) {
  const { N, adjacency } = ctx
  const [copied, setCopied] = useState(false)
  const copy = () => navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }, () => {})
  const decision = n.type === 'decision' ? decisionBySlug.get(slug(n.label)) : null
  const record = decision && ctx.records[decision.id]
  const blueprint = decision ? decision.link : n.route ? `#/${n.route}` : null
  const rows = (type, dir) => adjacency.get(n.id).filter(([, e]) => e.type === type && (dir === 'out' ? e.source === n.id : e.target === n.id))
    .sort((a, b) => N.get(a[0]).label.localeCompare(N.get(b[0]).label))
  const groups = SECTIONS.map(([, parts]) => parts.map(([type, dir, heading]) => [heading, rows(type, dir)]).filter(([, r]) => r.length)).filter(g => g.length)
  const mentions = [...rows('mentions', 'out'), ...rows('mentions', 'in')]
  const facts = FACTS.filter(k => n[k] != null && n[k] !== '' && !(n.type === 'gate' && k === 'title'))

  return <article className="kgx-profile">
    <a className="kgx-back small" href={graphHref()}>← All items</a>
    <header className="kgx-head">
      <span className="kg-kind"><span className="dot" style={{ background: COLORS[n.type] }} />{TYPE_NAMES[n.type] || nice(n.type)}{n.group ? ` · ${n.group}` : n.category ? ` · ${n.category}` : ''}</span>
      <h3>{n.label} {decision && <DecisionChip n={n} ctx={ctx} />}</h3>
      {(n.description || n.title || n.context) && <p className="kgx-lede">{n.description || n.title || n.context}</p>}
      <p className="kg-links">
        {blueprint && <a href={blueprint}>{decision ? 'Compare options and record a choice →' : 'Open in the blueprint →'}</a>}
        <button className="link" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
      </p>
    </header>

    <dl className="kgx-rels">
      {decision && <div className="kgx-row">
        <dt>Options</dt>
        <dd><ul className="kgx-pills">{(n.options || []).map(o => <li key={o} className={o === record?.choice ? 'chosen' : undefined}>
          {o}{o === n.selected && <small>recommended</small>}{o === record?.choice && <small>shared choice</small>}
        </li>)}</ul></dd>
      </div>}
      {groups.map((g, gi) => g.map(([heading, list], i) => <div key={heading} className={i === 0 && (gi > 0 || decision) ? 'kgx-row first' : 'kgx-row'}>
        <dt>{heading}</dt>
        <dd><Pills ctx={ctx} items={list.map(([o]) => N.get(o))} limit={8}
          note={i => { const e = list[i][1]; return e.label ? { text: e.label, title: [e.detail, e.protocol, e.frequency].filter(Boolean).join(' · ') } : null }} /></dd>
      </div>))}
    </dl>
    {!groups.length && <p className="muted">No relationships recorded yet.</p>}

    <div className="kgx-connect">
      <NodeSearch nodes={ctx.nodes.filter(x => x.id !== n.id)} label={`How does ${n.label} connect to something else?`} placeholder="Pick another item" onPick={id => { window.location.hash = graphHref(n.id, id) }} />
    </div>

    {(facts.length > 0 || mentions.length > 0) && <details className="kgx-more">
      <summary>More details</summary>
      {facts.length > 0 && <dl className="kg-facts">{facts.map(k => <div key={k}><dt>{nice(k)}</dt><dd>{Array.isArray(n[k]) ? <ul>{n[k].map((x, i) => <li key={i}>{x}</li>)}</ul> : String(n[k])}</dd></div>)}</dl>}
      {mentions.length > 0 && <><h5>Also mentioned alongside</h5><Pills ctx={ctx} items={mentions.map(([o]) => N.get(o))} /></>}
    </details>}
  </article>
}

function Route({ route, ctx, from, to }) {
  const { N } = ctx
  return <article className="kgx-profile">
    <a className="kgx-back small" href={graphHref(from)}>← Back to {N.get(from).label}</a>
    <header className="kgx-head">
      <span className="kg-kind">Route · {route.length - 1} step{route.length === 2 ? '' : 's'}</span>
      <h3>How {N.get(from).label} connects to {N.get(to).label}</h3>
      <p className="kg-links"><a href={graphHref(to, from)}>Reverse the route</a></p>
    </header>
    <ol className="kgx-route">{route.map(([id, e], i) => {
      const m = N.get(id), prev = i > 0 ? route[i - 1][0] : null
      return <li key={id}>
        {e && <span className="kgx-hop">{REL[e.type][e.source === prev ? 0 : 1]}{e.label ? <em> · {e.label}</em> : null}</span>}
        <a className="kgx-stop" href={graphHref(id)}><span className="dot" style={{ background: COLORS[m.type] }} /><b>{m.label}</b><small>{TYPE_NAMES[m.type]}</small></a>
      </li>
    })}</ol>
  </article>
}

// ---------- Drawn graph (opened on demand) ----------

function GraphPanel({ ctx, sel, route, onClose }) {
  const { nodes, edges, N, adjacency } = ctx
  const [lens, setLensId] = useState(() => pref('fpb-graph-lens', 'flow', v => Boolean(lensById[v])))
  const [chosenMode, setMode] = useState(sel ? 'focus' : 'map')
  const [theme, setTheme] = useState(0)
  const box = useRef(null)
  const net = useRef(null)
  const closeBtn = useRef(null)
  const ds = useRef({ nodes: new DataSet(), edges: new DataSet() })
  const view = lensById[lens]
  const types = useMemo(() => new Set(view.types), [view])
  const lensEdges = useMemo(() => new Set(view.edges), [view])
  // A selection the lens does not show (say, a decision on the data-flow map) is drawn in its neighbourhood instead.
  const n = sel ? N.get(sel) : null
  const mode = chosenMode === 'map' && sel && !types.has(N.get(sel).type) ? 'focus' : chosenMode
  const setLens = id => { setLensId(id); setMode('map'); save('fpb-graph-lens', id) }

  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const back = document.activeElement
    closeBtn.current?.focus()
    const key = e => { if (e.key === 'Escape') close.current() }
    document.addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; back?.focus?.() }
  }, [])

  const { ns, es, ring } = useMemo(() => {
    if (route) return { ns: route.map(([id]) => N.get(id)), es: route.slice(1).map(([, e]) => e), ring: null }
    let ids
    if (mode === 'focus' && sel) {
      ids = new Set([sel])
      for (const [o, e] of adjacency.get(sel)) if (FOCUS_EDGES.has(e.type)) ids.add(o)
    } else ids = new Set(nodes.filter(n => types.has(n.type)).map(n => n.id))
    if (sel) ids.add(sel)
    const allowed = mode === 'focus' && sel ? FOCUS_EDGES : lensEdges
    const es = edges.filter(e => allowed.has(e.type) && ids.has(e.source) && ids.has(e.target))
    // On the map, a selection lights up its visible neighbours and dims the rest.
    const ring = mode === 'map' && sel ? new Set([sel, ...es.flatMap(e => e.source === sel ? [e.target] : e.target === sel ? [e.source] : [])]) : null
    return { ns: [...ids].map(i => N.get(i)), es, ring }
  }, [route, mode, sel, adjacency, nodes, edges, N, types, lensEdges])

  // Re-colour labels when the site theme changes.
  useEffect(() => {
    const bump = () => setTheme(t => t + 1)
    const mo = new MutationObserver(bump)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener?.('change', bump)
    return () => { mo.disconnect(); mq?.removeEventListener?.('change', bump) }
  }, [])

  const modeRef = useRef(mode)
  modeRef.current = mode
  useEffect(() => {
    const network = new Network(box.current, ds.current, {
      physics: { solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -45, springLength: 110 }, stabilization: { iterations: 250 } },
      interaction: { hover: true, tooltipDelay: 120, selectConnectedEdges: false }, edges: { smooth: false },
    })
    net.current = network
    network.on('click', p => { if (p.nodes[0]) window.location.hash = graphHref(p.nodes[0]) })
    network.on('doubleClick', p => { if (p.nodes[0]) { setMode('focus'); window.location.hash = graphHref(p.nodes[0]) } })
    return () => { network.destroy(); net.current = null }
  }, [])

  useEffect(() => {
    const css = getComputedStyle(document.documentElement)
    const ink = css.getPropertyValue('--text').trim() || '#222'
    const muted = css.getPropertyValue('--muted').trim() || '#777'
    const bg = css.getPropertyValue('--bg').trim() || '#fff'
    const small = !ring && es.length <= 40
    const ends = new Set(route ? [route[0][0], route.at(-1)[0]] : [sel])
    const { nodes: dn, edges: de } = ds.current
    dn.clear(); de.clear()
    dn.add(ns.map((n, i) => {
      const dim = ring && !ring.has(n.id)
      const c = (COLORS[n.type] || '#999') + (dim ? '30' : '')
      return {
        id: n.id, label: n.label.length > 34 ? n.label.slice(0, 32) + '…' : n.label, title: `${n.label} · ${TYPE_NAMES[n.type] || n.type}`,
        color: { background: c, border: ends.has(n.id) ? '#f0c040' : c, highlight: { background: '#f0c040', border: '#b08000' } },
        borderWidth: ends.has(n.id) ? 3 : 1,
        font: { color: dim ? muted + '66' : ink, size: route ? 15 : small ? 13 : 12, strokeWidth: small || route ? 3 : 0, strokeColor: bg }, widthConstraint: small || route ? { maximum: 150 } : undefined,
        shape: n.type === 'decision' ? 'diamond' : n.type === 'technology' ? 'square' : n.type === 'gate' ? 'triangle' : 'dot',
        size: 6 + Math.min(22, Math.sqrt(n.degree || 1) * 3),
        // A route is laid out left to right so it reads as a sentence.
        ...(route ? { x: i * 230, y: (i % 2) * 70, fixed: true, physics: false } : {}),
      }
    }))
    de.add(es.map((e, i) => {
      const lit = !ring || e.source === sel || e.target === sel
      return {
        id: i, from: e.source, to: e.target, arrows: 'to',
        title: [cap(REL[e.type][0]), e.label, e.protocol, e.frequency].filter(Boolean).join(' · '),
        label: small || route || ring && lit ? e.label || REL[e.type][0] : undefined,
        font: { size: 10, color: muted, strokeWidth: 4, strokeColor: bg, align: 'middle' },
        color: { color: lit ? (e.type === 'interface' || route ? '#2f6fae' : '#8a94a6') + (route ? '' : 'aa') : '#8a94a622', highlight: '#f0c040' },
        dashes: e.type === 'mentions', width: route ? 2 : e.type === 'interface' ? 1.6 : 0.8,
      }
    }))
    if (route) setTimeout(() => net.current?.fit({ animation: { duration: 300 } }), 50)
    else if (sel) { net.current?.selectNodes([sel]); setTimeout(() => net.current?.focus(sel, { scale: modeRef.current === 'focus' ? 1 : 1.1, animation: { duration: 400 } }), 400) }
    else setTimeout(() => net.current?.fit(), 400)
  }, [ns, es, ring, route, sel, theme])

  const shownTypes = [...new Set(ns.map(x => x.type))]

  return <div className="kgx-overlay" role="dialog" aria-modal="true" aria-label="Graph view">
    <div className="kgx-overlay-bar">
      {route ? <b>Route · {route.length - 1} steps</b> : <>
        {sel && <div className="kg-seg" role="group" aria-label="What to draw">
          <button aria-pressed={mode === 'focus'} onClick={() => setMode('focus')}>Around {n.label}</button>
          <button aria-pressed={mode === 'map'} onClick={() => setMode('map')}>Whole map</button>
        </div>}
        {mode === 'map' && <label className="kgx-lens">Show <select value={lens} onChange={e => setLens(e.target.value)}>{LENSES.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label>}
      </>}
      <button className="kgx-btn primary" ref={closeBtn} onClick={onClose}>Close</button>
    </div>
    <div className="kgx-overlay-body">
      <div className="kg-canvas" ref={box} role="img" aria-label="Graph drawing. The page behind lists every relationship shown here." />
      <ul className="kg-legend kgx-float-legend">{shownTypes.map(t => <li key={t}><span className="dot" style={{ background: COLORS[t] }} />{TYPE_NAMES[t]}</li>)}</ul>
      {n && !route && <div className="kgx-float-card">
        <span className="kg-kind"><span className="dot" style={{ background: COLORS[n.type] }} />{TYPE_NAMES[n.type]}</span>
        <b>{n.label}</b>
        <button className="link" onClick={onClose}>See its connections →</button>
      </div>}
      <p className="kgx-hint small muted">Click an item to select it · drag to move · scroll to zoom</p>
    </div>
  </div>
}

function NodeSearch({ nodes, label, placeholder, onPick, big }) {
  const id = useId()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const hits = useMemo(() => {
    const s = q.toLowerCase().trim()
    if (!s) return []
    const score = n => n.label.toLowerCase().startsWith(s) ? 3 : n.label.toLowerCase().includes(s) ? 2 : (n.description || '').toLowerCase().includes(s) ? 1 : 0
    return nodes.map(n => [score(n), n]).filter(([s]) => s).sort((a, b) => b[0] - a[0] || (b[1].degree || 0) - (a[1].degree || 0)).slice(0, 12).map(([, n]) => n)
  }, [nodes, q])
  const choose = n => { setQ(''); onPick(n.id) }
  const key = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); choose(hits[active]) }
    else if (e.key === 'Escape') setQ('')
  }
  return <div className={big ? 'kg-search big' : 'kg-search'}>
    <label htmlFor={id}>{label}</label>
    <input id={id} type="search" value={q} onChange={e => { setQ(e.target.value); setActive(0) }} onKeyDown={key} placeholder={placeholder} autoComplete="off"
      role="combobox" aria-expanded={hits.length > 0} aria-controls={`${id}-list`} aria-activedescendant={hits[active] ? `${id}-${active}` : undefined} />
    {q.trim() && <ul className="kg-results" id={`${id}-list`} role="listbox">
      {hits.length ? hits.map((h, i) => <li key={h.id} id={`${id}-${i}`} role="option" aria-selected={i === active} onMouseDown={e => { e.preventDefault(); choose(h) }} onMouseEnter={() => setActive(i)}>
        <span className="dot" style={{ background: COLORS[h.type] }} />{h.label} <small>{TYPE_NAMES[h.type]}</small>
      </li>) : <li className="muted">No match</li>}
    </ul>}
  </div>
}

// Weighted shortest route (Dijkstra; the graph is a few hundred nodes). Returns [[id, edge used to arrive], ...].
function shortestRoute(from, to, adjacency, loose) {
  const dist = new Map([[from, 0]]), back = new Map(), done = new Set()
  while (true) {
    let cur = null
    for (const [id, d] of dist) if (!done.has(id) && (cur === null || d < dist.get(cur))) cur = id
    if (cur === null) return null
    if (cur === to) break
    done.add(cur)
    for (const [o, e] of adjacency.get(cur)) {
      if (e.type === 'mentions' && !loose) continue
      const d = dist.get(cur) + WEIGHT[e.type]
      if (!dist.has(o) || d < dist.get(o)) { dist.set(o, d); back.set(o, [cur, e]) }
    }
  }
  const route = []
  for (let id = to; id !== from; id = back.get(id)[0]) route.unshift([id, back.get(id)[1]])
  return [[from, undefined], ...route]
}

// Link from a blueprint page to its place in the graph, when it has one.
export function graphLinkFor(route) {
  const id = graphNodeForRoute[route]
  return id ? graphHref(id) : null
}
