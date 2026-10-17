import { useEffect, useMemo, useState } from 'react'
import { VIEW, domains, edgeKinds, zones, nodes, nodeById, edges, edgeById, flows } from './systemData.js'
import { routeEdges } from './router.js'
import { designs } from './designData.js'
import { useChoices } from './choices.js'
import { riskPlatform } from './operatingModel.js'

const ROUTES = routeEdges(nodes, edges, VIEW.w, VIEW.h)
const DEEP_DIVES = {
  secmaster: ['#/secmaster', 'Security master deep dive'],
  research: ['#/altdata', 'Alternative data deep dive'],
  lake: ['#/altdata', 'Alternative data deep dive'],
  risk: ['#/fit/risk', 'Photon fit & diligence'],
}
const KIND_IDS = Object.keys(edgeKinds)

// Hash routes: #/node/<id>, #/node/<id>/<componentIndex>, #/node/<id>/d<decisionNumber>
function readHash() {
  const m = window.location.hash.match(/^#\/node\/([\w-]+)(?:\/(d?)(\d+))?/)
  if (!m || !nodeById[m[1]]) return null
  const isDecision = m[2] === 'd'
  return { id: m[1], comp: m[3] != null && !isDecision ? +m[3] : null, decision: isDecision ? +m[3] : null }
}

export function useDrill() {
  const [drill, setDrill] = useState(readHash)
  useEffect(() => {
    const on = () => setDrill(readHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (id, comp = null) => {
    window.location.hash = id ? `/node/${id}${comp != null ? '/' + comp : ''}` : '/map'
    window.scrollTo({ top: 0 })
  }
  return [drill, go]
}

export default function SystemMap() {
  const [drill, go] = useDrill()
  const [flowId, setFlowId] = useState(null)
  const [step, setStep] = useState(0)
  const [kinds, setKinds] = useState(() => new Set(KIND_IDS))
  const [sel, setSel] = useState(null) // { type: 'node' | 'edge', id }

  const openFlow = (id) => { setFlowId(id); setStep(0); setSel(null); go(null) }

  if (drill) return <NodeDetail key={drill.id} id={drill.id} comp={drill.comp} decision={drill.decision} go={go} openFlow={openFlow} />
  return (
    <MapView
      flowId={flowId} setFlowId={setFlowId} step={step} setStep={setStep}
      kinds={kinds} setKinds={setKinds} sel={sel} setSel={setSel} go={go}
    />
  )
}

// ─────────────────────────── Map ───────────────────────────

function MapView({ flowId, setFlowId, step, setStep, kinds, setKinds, sel, setSel, go }) {
  const [hover, setHover] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [showPhoton, setShowPhoton] = useState(false)
  const flow = flows.find((f) => f.id === flowId)

  useEffect(() => {
    if (!playing || !flow) return
    if (step >= flow.steps.length - 1) { setPlaying(false); return }
    const t = setTimeout(() => setStep(step + 1), 2200)
    return () => clearTimeout(t)
  }, [playing, step, flow, setStep])

  const focusNode = hover || (sel?.type === 'node' ? sel.id : null)

  const { hiEdges, hiNodes, current } = useMemo(() => {
    if (flow) {
      const done = flow.steps.slice(0, step + 1).map(([e]) => e)
      const hn = new Set()
      done.forEach((id) => { hn.add(edgeById[id].from); hn.add(edgeById[id].to) })
      return { hiEdges: new Set(done), hiNodes: hn, current: done[done.length - 1] }
    }
    if (focusNode) {
      const he = new Set(), hn = new Set([focusNode])
      edges.forEach((e) => {
        if (e.from === focusNode || e.to === focusNode) { he.add(e.id); hn.add(e.from); hn.add(e.to) }
      })
      return { hiEdges: he, hiNodes: hn, current: null }
    }
    if (sel?.type === 'edge') {
      const e = edgeById[sel.id]
      return { hiEdges: new Set([e.id]), hiNodes: new Set([e.from, e.to]), current: e.id }
    }
    return { hiEdges: null, hiNodes: null, current: null }
  }, [flow, step, focusNode, sel])

  const visibleEdges = edges.filter((e) => {
    if (flow) return true
    if (!kinds.has(e.kind)) return false
    if (e.kind === 'ui') return hiEdges?.has(e.id)
    return true
  })
  const shownEdges = flow ? visibleEdges.filter((e) => e.kind !== 'ui' || hiEdges.has(e.id)) : visibleEdges

  const pickFlow = (id) => { setFlowId(id === flowId ? null : id); setStep(0); setPlaying(false); setSel(null) }
  const toggleKind = (k) => {
    const next = new Set(kinds)
    next.has(k) ? next.delete(k) : next.add(k)
    setKinds(next)
  }
  const flowStepIndex = flow ? Object.fromEntries(flow.steps.slice(0, step + 1).map(([e], i) => [e, i + 1])) : {}

  return (
    <section className="map-page">
      <div className="map-head">
        <div>
          <p className="eyebrow">Reference architecture</p>
          <h2>End-to-end platform map</h2>
          <p className="lede">
            Candidate components, ownership boundaries and interfaces for a multi-strategy, multi-manager platform.
            Aligned to Verition’s operating model; current internal systems still require confirmation. Hover to trace
            connections, click to inspect, and open a component for its options and trade-offs.
          </p>
        </div>
        <dl className="map-stats">
          <div><dt>Components</dt><dd>{nodes.filter((n) => !n.external).length}</dd></div>
          <div><dt>External parties</dt><dd>{nodes.filter((n) => n.external).length}</dd></div>
          <div><dt>Interfaces</dt><dd>{edges.length}</dd></div>
        </dl>
      </div>

      <div className="toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Trace a flow</span>
          <div className="chips">
            {flows.map((f) => (
              <button key={f.id} className={'chip' + (f.id === flowId ? ' on' : '')} onClick={() => pickFlow(f.id)}>
                {f.name}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-group">
          <span className="toolbar-label">Verition context</span>
          <button className={'chip' + (showPhoton ? ' on' : '')} aria-pressed={showPhoton} onClick={() => { setShowPhoton(!showPhoton); setSel(null) }}>
            Photon integration candidates
          </button>
          <a className="primary-link" href="#/fit/risk">Photon detail →</a>
        </div>
        {!flow && (
          <div className="toolbar-group">
            <span className="toolbar-label">Show interfaces</span>
            <div className="chips">
              {KIND_IDS.map((k) => (
                <button key={k} className={'chip kind' + (kinds.has(k) ? ' on' : '')} onClick={() => toggleKind(k)} style={{ '--k': edgeKinds[k].color }}>
                  <i />{edgeKinds[k].name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="map-layout">
        <div className="map-scroll" onClick={(ev) => { if (ev.target.tagName === 'svg') setSel(null) }}>
          <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="map" role="img" aria-label="End-to-end hedge fund platform diagram">
            <defs>
              {KIND_IDS.map((k) => (
                <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill={edgeKinds[k].color} />
                </marker>
              ))}
            </defs>

            {zones.map((z) => (
              <g key={z.id} className={'zone' + (z.external ? ' ext' : '')}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="4" />
                <text x={z.x + 12} y={z.y + 15}>{z.label}</text>
              </g>
            ))}

            {shownEdges.map((e) => {
              const r = ROUTES[e.id]
              const on = hiEdges?.has(e.id)
              const cls = ['edge', `k-${e.kind}`, hiEdges && !on ? 'dim' : '', on ? 'hi' : '', current === e.id ? 'current' : ''].join(' ')
              return (
                <g key={e.id} className={cls} onClick={(ev) => { ev.stopPropagation(); setSel({ type: 'edge', id: e.id }) }}>
                  <path className="hit" d={r.d} />
                  <path
                    className="line" d={r.d} stroke={edgeKinds[e.kind].color}
                    markerEnd={`url(#arr-${e.kind})`} markerStart={e.bidir ? `url(#arr-${e.kind})` : undefined}
                  />
                </g>
              )
            })}

            {nodes.map((n) => {
              const dim = hiNodes && !hiNodes.has(n.id)
              const isSel = sel?.type === 'node' && sel.id === n.id
              const lines = (n.map || n.label).split('\n')
              const color = domains[n.domain].color
              return (
                <g
                  key={n.id}
                  className={['node', n.external ? 'ext' : '', n.wide ? 'wide' : '', dim ? 'dim' : '', isSel ? 'sel' : '', hiNodes?.has(n.id) ? 'hi' : '', showPhoton && riskPlatform.partial.includes(n.id) ? 'photon-candidate' : ''].join(' ')}
                  transform={`translate(${n.x},${n.y})`}
                  style={{ '--c': color }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${n.label}. Press Enter to open details.`}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(n.id)}
                  onBlur={() => setHover(null)}
                  onClick={(ev) => { ev.stopPropagation(); setSel({ type: 'node', id: n.id }) }}
                  onDoubleClick={() => go(n.id)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter') go(n.id) }}
                >
                  <rect className="box" width={n.w} height={n.h} rx="3" />
                  {!n.external && <rect className="cap" width={n.w} height="3" />}
                  {n.wide ? (
                    <>
                      <text className="nl" x="16" y={n.h / 2 + 4.5}>{n.label}</text>
                      <text className="ns" x="168" y={n.h / 2 + 4}>{n.sub}</text>
                    </>
                  ) : (
                    <>
                      {lines.map((l, i) => (
                        <text key={i} className="nl" x={n.w / 2} y={(lines.length > 1 ? 21 : 27) + i * 14} textAnchor="middle">{l}</text>
                      ))}
                      <text className="ns" x={n.w / 2} y={lines.length > 1 ? 50 : 43} textAnchor="middle">{n.sub}</text>
                    </>
                  )}
                </g>
              )
            })}

            {shownEdges.filter((e) => hiEdges?.has(e.id)).map((e) => {
              const [x, y] = ROUTES[e.id].mid
              const n = flowStepIndex[e.id]
              const text = flow ? (e.id === current ? `${n}. ${e.label}` : String(n)) : e.label
              const w = text.length * 5.7 + 14
              return (
                <g key={'l' + e.id} className={'elabel' + (e.id === current ? ' current' : '')} transform={`translate(${x},${y})`} style={{ '--k': edgeKinds[e.kind].color }}>
                  <rect x={-w / 2} y="-9" width={w} height="18" rx="9" />
                  <text textAnchor="middle" y="3.5">{text}</text>
                </g>
              )
            })}
          </svg>
        </div>

        <aside className="inspector">
          {flow ? (
            <FlowPanel flow={flow} step={step} setStep={setStep} playing={playing} setPlaying={setPlaying} close={() => pickFlow(flow.id)} go={go} />
          ) : sel?.type === 'node' ? (
            <NodePanel n={nodeById[sel.id]} go={go} />
          ) : sel?.type === 'edge' ? (
            <EdgePanel e={edgeById[sel.id]} setSel={setSel} />
          ) : (
            showPhoton ? <PhotonPanel /> : <Legend />
          )}
        </aside>
      </div>
    </section>
  )
}

function PhotonPanel() {
  return <div className="panel">
    <p className="eyebrow">Photon · proposed integration</p>
    <h3>Candidate footprint</h3>
    <p>{riskPlatform.thesis}</p>
    <ul>{riskPlatform.partial.map(id => <li key={id}><a href={`#/node/${id}`}>{nodeById[id].label}</a></li>)}</ul>
    <p className="hint">Dashed outlines identify areas to assess. They do not establish Photon’s actual production deployment.</p>
    <a className="primary-link" href="#/fit/risk">Detailed fit, data feeds and diligence →</a>
  </div>
}

function Legend() {
  return (
    <div className="panel">
      <p className="eyebrow">How to read the map</p>
      <ul className="legend">
        {Object.entries(domains).map(([k, d]) => (
          <li key={k}><span className={'swatch' + (k === 'external' ? ' ext' : '')} style={{ '--c': d.color }} />{d.name}</li>
        ))}
      </ul>
      <ul className="legend lines">
        {KIND_IDS.map((k) => (
          <li key={k}><span className="line-swatch" style={{ '--k': edgeKinds[k].color }} />{edgeKinds[k].name}</li>
        ))}
      </ul>
      <p className="hint">Dashed boxes are external parties. Double-headed arrows are two-way exchanges. User-access links appear when you focus a channel.</p>
      <p className="hint"><b>Click</b> a box to inspect it. <b>Double-click</b>, or press <kbd>Enter</kbd>, to open its detailed design.</p>
    </div>
  )
}

function NodePanel({ n, go }) {
  const links = edges.filter((e) => e.from === n.id || e.to === n.id)
  return (
    <div className="panel">
      <p className="eyebrow" style={{ color: domains[n.domain].color }}>{domains[n.domain].name}</p>
      <h3>{n.label}</h3>
      <p>{n.summary}</p>
      {n.build && <p className="build"><span className={'pill b-' + n.build[0].toLowerCase()}>{n.build[0]}</span></p>}
      {links.length > 0 && (
        <>
          <h4>Interfaces ({links.length})</h4>
          <ul className="link-list">
            {links.slice(0, 8).map((e) => {
              const other = nodeById[e.from === n.id ? e.to : e.from]
              const arrow = e.bidir ? '⇄' : e.from === n.id ? '→' : '←'
              return <li key={e.id}><span className="arrow">{arrow}</span><span><b>{other.label}</b><br /><small>{e.label}</small></span></li>
            })}
            {links.length > 8 && <li className="more">+ {links.length - 8} more in the detailed view</li>}
          </ul>
        </>
      )}
      <button className="primary" onClick={() => go(n.id)}>Open detailed design</button>
    </div>
  )
}

function EdgePanel({ e, setSel }) {
  const a = nodeById[e.from], b = nodeById[e.to]
  return (
    <div className="panel">
      <p className="eyebrow" style={{ color: edgeKinds[e.kind].color }}>{edgeKinds[e.kind].name}</p>
      <h3>{e.label}</h3>
      <p className="route">
        <button className="link" onClick={() => setSel({ type: 'node', id: a.id })}>{a.label}</button>
        <span>{e.bidir ? '⇄' : '→'}</span>
        <button className="link" onClick={() => setSel({ type: 'node', id: b.id })}>{b.label}</button>
      </p>
      <dl className="kv">
        <dt>Payload</dt><dd>{e.payload}</dd>
        <dt>Protocol</dt><dd>{e.protocol}</dd>
        <dt>Cadence</dt><dd>{e.cadence}</dd>
      </dl>
    </div>
  )
}

function FlowPanel({ flow, step, setStep, playing, setPlaying, close, go }) {
  const [edgeId, text] = flow.steps[step]
  const e = edgeById[edgeId]
  return (
    <div className="panel flow">
      <div className="panel-top">
        <p className="eyebrow">Flow · step {step + 1} of {flow.steps.length}</p>
        <button className="x" onClick={close} aria-label="Close flow">×</button>
      </div>
      <h3>{flow.name}</h3>
      <p className="muted">{flow.summary}</p>
      <div className="step-now" style={{ '--k': edgeKinds[e.kind].color }}>
        <p className="route small">
          <button className="link" onClick={() => go(e.from)}>{nodeById[e.from].label}</button>
          <span>{e.bidir ? '⇄' : '→'}</span>
          <button className="link" onClick={() => go(e.to)}>{nodeById[e.to].label}</button>
        </p>
        <p>{text}</p>
        <p className="proto">{e.protocol}</p>
      </div>
      <div className="row">
        <button disabled={step === 0} onClick={() => { setPlaying(false); setStep(step - 1) }}>← Back</button>
        <button className="primary" onClick={() => {
          if (step >= flow.steps.length - 1) { setStep(0); setPlaying(true) } else setPlaying(!playing)
        }}>
          {playing ? 'Pause' : step >= flow.steps.length - 1 ? 'Replay' : 'Play'}
        </button>
        <button disabled={step === flow.steps.length - 1} onClick={() => { setPlaying(false); setStep(step + 1) }}>Next →</button>
      </div>
      <ol className="flow-steps">
        {flow.steps.map(([id, t], i) => (
          <li key={i} className={i === step ? 'now' : i < step ? 'done' : ''}>
            <button onClick={() => { setPlaying(false); setStep(i) }}>
              <span className="n">{i + 1}</span>
              <span>{nodeById[edgeById[id].from].label} {edgeById[id].bidir ? '⇄' : '→'} {nodeById[edgeById[id].to].label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ─────────────────────────── Drill-down ───────────────────────────

function NodeDetail({ id, comp, decision, go, openFlow }) {
  const n = nodeById[id]
  const d = domains[n.domain]
  const touching = edges.filter((e) => e.from === id || e.to === id)
  const inbound = touching.filter((e) => e.to === id || (e.bidir && e.from === id && nodeById[e.to].x < n.x))
  const outbound = touching.filter((e) => !inbound.includes(e))
  const inFlows = flows.filter((f) => f.steps.some(([eid]) => touching.some((e) => e.id === eid)))
  const c = comp != null ? n.components[comp] : null
  const zone = n.external ? 'External parties' : d.name

  const design = designs[id]

  useEffect(() => {
    if (comp != null) document.getElementById('component-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [comp])
  useEffect(() => {
    if (decision != null) document.getElementById(`decision-${id}-${decision}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [id, decision])
  const jump = (sid) => document.getElementById(sid)?.scrollIntoView({ block: 'start', behavior: 'smooth' })

  const Iface = ({ e }) => {
    const other = nodeById[e.from === id ? e.to : e.from]
    return (
      <button className="iface" onClick={() => go(other.id)} style={{ '--k': edgeKinds[e.kind].color }}>
        <span className="iface-name">{other.label}</span>
        <span className="iface-label">{e.bidir ? '⇄ ' : ''}{e.label}</span>
      </button>
    )
  }

  return (
    <article className="detail-page" style={{ '--c': d.color }}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <button className="link" onClick={() => go(null)}>Platform map</button>
        <span>›</span>
        <span>{zone}</span>
        <span>›</span>
        {c ? <button className="link" onClick={() => go(id)}>{n.label}</button> : <b>{n.label}</b>}
        {c && <><span>›</span><b>{c.name}</b></>}
      </nav>

      <header className="detail-head">
        <div>
          <p className="eyebrow">{zone}</p>
          <h2>{n.label}</h2>
          <p className="lede">{n.summary}</p>
        </div>
        {n.build && (
          <div className="build-card">
            <span className={'pill b-' + n.build[0].toLowerCase()}>{n.build[0]}</span>
            <p>{n.build[1]}</p>
          </div>
        )}
      </header>

      <nav className="jump" aria-label="On this page">
        <button onClick={() => jump('sec-components')}>Components</button>
        {design && <button onClick={() => jump('sec-design')}>Reference design</button>}
        {design && <button onClick={() => jump('sec-decisions')}>Design decisions ({design.decisions.length})</button>}
        <button onClick={() => jump('sec-operations')}>Interfaces & operations</button>
        {DEEP_DIVES[id] && <a className="deep-link" href={DEEP_DIVES[id][0]}>{DEEP_DIVES[id][1]} →</a>}
      </nav>

      {/* Level 2: context + internals */}
      <section className="context" id="sec-components">
        <div className="ctx-col">
          <h4>Receives from</h4>
          {inbound.length ? inbound.map((e) => <Iface key={e.id} e={e} />) : <p className="muted small">{n.domain === 'platform' ? 'Cross-cutting: used by every component.' : 'No inbound interfaces.'}</p>}
        </div>
        <div className="ctx-core">
          <div className="core-head"><span>{n.label}</span><small>{n.components.length ? `${n.components.length} internal components · select one` : n.external ? 'External party' : ''}</small></div>
          {n.components.length > 0 ? (
            <div className="comp-grid">
              {n.components.map((x, i) => (
                <button key={x.name} className={'comp' + (comp === i ? ' on' : '')} onClick={() => go(id, comp === i ? null : i)}>
                  <b>{x.name}</b>
                  <span>{x.desc}</span>
                  {x.tech && <small>{x.tech}</small>}
                </button>
              ))}
            </div>
          ) : (
            <div className="examples">
              {(n.examples || []).map((x) => <span key={x} className="tag-plain">{x}</span>)}
            </div>
          )}
        </div>
        <div className="ctx-col">
          <h4>Sends to</h4>
          {outbound.length ? outbound.map((e) => <Iface key={e.id} e={e} />) : <p className="muted small">{n.domain === 'platform' ? 'Cross-cutting: used by every component.' : 'No outbound interfaces.'}</p>}
        </div>
      </section>

      {/* Level 3: component detail */}
      {c && (
        <section className="comp-detail" id="component-detail">
          <p className="eyebrow">Component · {n.label}</p>
          <h3>{c.name}</h3>
          <p>{c.desc}</p>
          <ul>{c.details.map((x) => <li key={x}>{x}</li>)}</ul>
          {c.tech && <p className="tech"><span>Typical technology</span>{c.tech}</p>}
          <div className="row">
            <button disabled={comp === 0} onClick={() => go(id, comp - 1)}>← Previous component</button>
            <button disabled={comp === n.components.length - 1} onClick={() => go(id, comp + 1)}>Next component →</button>
          </div>
        </section>
      )}

      {design && <DesignSection id={id} design={design} go={go} />}

      <div className="detail-grid" id="sec-operations">
        <Block title="Responsibilities">
          <ul>{n.responsibilities.map((x) => <li key={x}>{x}</li>)}</ul>
        </Block>

        {n.entities && (
          <Block title="Key data entities">
            <table className="tbl">
              <tbody>{n.entities.map(([e, f]) => <tr key={e}><th>{e}</th><td><code>{f}</code></td></tr>)}</tbody>
            </table>
          </Block>
        )}

        {touching.length > 0 && (
          <Block title={`Interfaces (${touching.length})`} wide>
            <div className="tbl-wrap">
              <table className="tbl ifaces">
                <thead><tr><th>Direction</th><th>Counterpart</th><th>What flows</th><th>Protocol</th><th>Cadence</th></tr></thead>
                <tbody>
                  {touching.map((e) => {
                    const other = nodeById[e.from === id ? e.to : e.from]
                    const dir = e.bidir ? 'Two-way' : e.from === id ? 'Out' : 'In'
                    return (
                      <tr key={e.id}>
                        <td><span className="dir" style={{ '--k': edgeKinds[e.kind].color }}>{dir}</span></td>
                        <td><button className="link" onClick={() => go(other.id)}>{other.label}</button></td>
                        <td><b>{e.label}</b><br /><span className="muted">{e.payload}</span></td>
                        <td>{e.protocol}</td>
                        <td>{e.cadence}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Block>
        )}

        {n.controls && (
          <Block title="Controls">
            <ul className="checks">{n.controls.map((x) => <li key={x}>{x}</li>)}</ul>
          </Block>
        )}

        {n.slas && (
          <Block title="Service levels">
            <table className="tbl sla"><tbody>{n.slas.map(([m, t]) => <tr key={m}><th>{m}</th><td>{t}</td></tr>)}</tbody></table>
          </Block>
        )}

        {n.risks && (
          <Block title="Failure modes & mitigations" wide>
            <div className="risks">
              {n.risks.map(([r, m]) => (
                <div key={r} className="risk"><p className="r">{r}</p><p className="m">{m}</p></div>
              ))}
            </div>
          </Block>
        )}

        {n.vendors && (
          <Block title="Vendor landscape">
            <div className="examples">{n.vendors.map((v) => <span key={v} className="tag-plain">{v}</span>)}</div>
          </Block>
        )}

        {inFlows.length > 0 && (
          <Block title="Appears in flows">
            <ul className="flow-links">
              {inFlows.map((f) => <li key={f.id}><button className="link" onClick={() => openFlow(f.id)}>{f.name} →</button></li>)}
            </ul>
          </Block>
        )}
      </div>
    </article>
  )
}

function Block({ title, wide, children }) {
  return (
    <section className={'block' + (wide ? ' wide' : '')}>
      <h4>{title}</h4>
      {children}
    </section>
  )
}

// ─────────────────────────── Design & decisions ───────────────────────────

function DesignSection({ id, design, go }) {
  const [choices, choose] = useChoices()
  const decided = design.decisions.filter((x) => choices[x.id]).length
  return (
    <>
      <section className="design" id="sec-design">
        <div className="design-shape">
          <h4>Reference design · what it looks like</h4>
          <p>{design.shape}</p>
        </div>
        <div className="design-stack">
          <h4>Recommended stack</h4>
          <table className="tbl stack-tbl">
            <tbody>
              {design.stack.map(([layer, choice, why]) => (
                <tr key={layer}><th>{layer}</th><td><b>{choice}</b><br /><span className="muted">{why}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="decisions" id="sec-decisions">
        <div className="decisions-head">
          <h4>Design decisions</h4>
          <p className="muted small">{decided} of {design.decisions.length} decided in this browser · pick an option to record your choice</p>
        </div>
        {design.decisions.map((x, i) => (
          <DecisionCard key={x.id} d={x} n={i + 1} anchor={`decision-${id}-${i + 1}`} chosen={choices[x.id]} choose={choose} />
        ))}
      </section>
    </>
  )
}

export function DecisionCard({ d, n, anchor, chosen, choose }) {
  const deviates = chosen && chosen !== d.rec
  return (
    <article className="decision" id={anchor}>
      <header>
        <span className="d-num">D{n}</span>
        <div>
          <h3>{d.q}</h3>
          <p className="muted">{d.context}</p>
        </div>
        <span className={'d-status ' + (chosen ? (deviates ? 'dev' : 'ok') : 'open')}>
          {chosen ? (deviates ? 'Decided · differs from recommendation' : 'Decided') : 'Open'}
        </span>
      </header>
      <div className="options" style={{ '--cols': d.options.length }}>
        {d.options.map((o) => {
          const isRec = o.name === d.rec
          const isChosen = o.name === chosen
          return (
            <div key={o.name} className={'option-card' + (isRec ? ' rec' : '') + (isChosen ? ' chosen' : '')}>
              <div className="o-head">
                <b>{o.name}</b>
                {isRec && <span className="pill b-build">Recommended</span>}
              </div>
              <p className="o-fit"><span>Best when</span>{o.fit}</p>
              <ul className="pc pros">{o.pros.map((p) => <li key={p}>{p}</li>)}</ul>
              <ul className="pc cons">{o.cons.map((p) => <li key={p}>{p}</li>)}</ul>
              <button className={'choose' + (isChosen ? ' on' : '')} onClick={() => choose(d.id, o.name)} aria-pressed={isChosen}>
                {isChosen ? 'Chosen · click to clear' : 'Choose this'}
              </button>
            </div>
          )
        })}
      </div>
      <footer>
        <p><span className="lbl">Recommendation</span><b>{d.rec}.</b> {d.why}</p>
        <p><span className="lbl">Revisit when</span>{d.revisit}</p>
      </footer>
    </article>
  )
}
