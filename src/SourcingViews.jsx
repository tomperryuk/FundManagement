import { useMemo, useState } from 'react'
import { nodes, nodeById, domains } from './systemData.js'
import { designs } from './designData.js'
import { criteria, options, componentSourcing, techLayers } from './sourcing.js'

const internal = nodes.filter((n) => !n.external)
const domainOrder = ['channels', 'data', 'front', 'risk', 'ops', 'platform']
const PATHS = ['Build', 'Hybrid', 'License', 'Buy']

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

// ───────────────────────── Options ─────────────────────────

export function Options() {
  const [weights, setWeights] = useState(() => Object.fromEntries(criteria.map((c) => [c.id, c.weight])))
  const [domain, setDomain] = useState('all')

  const ranked = useMemo(() => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1
    return options
      .map((o) => ({ ...o, total: criteria.reduce((s, c) => s + o.scores[c.id] * weights[c.id], 0) / total }))
      .sort((a, b) => b.total - a.total)
  }, [weights])
  const top = ranked[0]

  const rows = internal
    .filter((n) => domain === 'all' || n.domain === domain)
    .sort((a, b) => domainOrder.indexOf(a.domain) - domainOrder.indexOf(b.domain))
  const counts = PATHS.map((p) => [p, internal.filter((n) => componentSourcing[n.id][5] === p).length])

  return (
    <section className="opt">
      <p className="eyebrow">Sourcing options</p>
      <h2>Build, buy or license</h2>
      <p className="lede">
        Four platform strategies scored against what matters to the firm, then broken down component by component so
        you can see what each strategy means in practice. Adjust the weights to test your own priorities; the matrix
        highlights the column for whichever strategy ranks first.
      </p>

      <div className="weights">
        {criteria.map((c) => (
          <label key={c.id} htmlFor={'w-' + c.id}>
            <span>{c.name} <b>{weights[c.id]}</b></span>
            <input id={'w-' + c.id} type="range" min="0" max="5" value={weights[c.id]} onChange={(e) => setWeights({ ...weights, [c.id]: +e.target.value })} />
          </label>
        ))}
      </div>

      <div className="opt-grid">
        {ranked.map((o, idx) => (
          <article key={o.id} className={'opt-card' + (idx === 0 ? ' top' : '') + (o.id === 'hybrid' ? ' recd' : '')}>
            <div className="score">
              <span>{o.total.toFixed(2)}</span>
              <div className="bar"><i style={{ width: `${(o.total / 5) * 100}%` }} /></div>
            </div>
            <p className="eyebrow">{idx === 0 ? 'Ranks first with these weights' : `Ranks ${idx + 1}`}</p>
            <h3>{o.name}</h3>
            <p className="muted">{o.tagline}</p>
            <div className="examples">{o.examples.map((x) => <span key={x} className="tag-plain">{x}</span>)}</div>
            <div className="opt-pc">
              <ul className="pc pros">{o.pros.map((p) => <li key={p}>{p}</li>)}</ul>
              <ul className="pc cons">{o.cons.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
            <p className="small"><b>Best for:</b> {o.best}</p>
            <p className={'fit-note' + (o.id === 'hybrid' ? ' rec' : '')}><span>For Verition</span>{o.fit}</p>
          </article>
        ))}
      </div>

      <h3 className="sec-title">What each option means, component by component</h3>
      <div className="opt-summary">
        <p>Under the recommended hybrid path:</p>
        {counts.map(([p, n]) => <span key={p} className={'path p-' + p.toLowerCase()}>{n} {p}</span>)}
      </div>
      <div className="chips">
        <button className={'chip' + (domain === 'all' ? ' on' : '')} onClick={() => setDomain('all')}>All components</button>
        {domainOrder.map((k) => <button key={k} className={'chip' + (domain === k ? ' on' : '')} onClick={() => setDomain(k)}>{domains[k].name}</button>)}
      </div>
      <div className="tbl-wrap">
        <table className={'tbl matrix hl-' + top.column}>
          <thead>
            <tr>
              <th>Component</th><th>Edge</th><th>Effort</th>
              <th className="c-suite">Integrated suite</th><th className="c-bob">Best-of-breed</th><th className="c-build">Build</th>
              <th className="c-rec">Recommended (hybrid)</th><th>Design</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => {
              const [diff, effort, suite, bob, build, path, detail] = componentSourcing[n.id]
              const dcount = designs[n.id]?.decisions.length || 0
              return (
                <tr key={n.id}>
                  <th><NodeChip id={n.id} /></th>
                  <td><span className={'lvl l-' + diff.toLowerCase()}>{diff}</span></td>
                  <td className="mono-cell">{effort}</td>
                  <td className="c-suite">{suite}</td>
                  <td className="c-bob">{bob}</td>
                  <td className="c-build">{build}</td>
                  <td className="c-rec"><span className={'path p-' + path.toLowerCase()}>{path}</span> {detail}</td>
                  <td className="nowrap">
                    <a className="q-link" href={`#/node/${n.id}`}>Open</a>
                    {dcount > 0 && <a className="q-link muted-link" href={`#/node/${n.id}/d1`}>{dcount} decisions</a>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="muted small">Edge: how much the component differentiates investment results or control. Effort: S under 3 months, M 3–9 months, L 9–18 months with a dedicated team.</p>
    </section>
  )
}

// ───────────────────────── Tech stack ─────────────────────────

export function Stack() {
  const [focus, setFocus] = useState(null)
  const techFor = (id) => techLayers.flatMap(([, , , items]) => items.filter((t) => t[5].includes(id)).map((t) => t[0]))

  return (
    <section className="ts">
      <p className="eyebrow">Technology stack</p>
      <h2>The stack, layer by layer</h2>
      <p className="lede">
        Every technology in the reference design: what it does, why it was chosen, the alternatives, and which
        components use it. Choose a component to highlight its technologies, or jump to its full design.
      </p>

      <div className="ts-focus">
        <span className="toolbar-label">Highlight a component</span>
        <select id="stack-focus" value={focus || ''} onChange={(e) => setFocus(e.target.value || null)} aria-label="Highlight technologies used by a component">
          <option value="">None</option>
          {domainOrder.map((k) => (
            <optgroup key={k} label={domains[k].name}>
              {internal.filter((n) => n.domain === k).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </optgroup>
          ))}
        </select>
        {focus && <a className="primary-link" href={`#/node/${focus}`}>Open {nodeById[focus].label} design →</a>}
      </div>

      <nav className="jump">
        {techLayers.map(([id, name]) => <button key={id} onClick={() => document.getElementById('tl-' + id)?.scrollIntoView({ behavior: 'smooth' })}>{name}</button>)}
        <button onClick={() => document.getElementById('ts-components')?.scrollIntoView({ behavior: 'smooth' })}>Stack by component</button>
      </nav>

      {techLayers.map(([id, name, desc, items]) => (
        <section key={id} id={'tl-' + id} className="ts-layer">
          <header><h3 className="sec-title">{name}</h3><p className="muted">{desc}</p></header>
          <div className="ts-grid">
            {items.map(([tname, licence, role, why, alts, used]) => (
              <article key={tname} className={'ts-card' + (focus ? (used.includes(focus) ? ' lit' : ' faded') : '')}>
                <div className="ts-head"><h4>{tname}</h4><span className="lic">{licence}</span></div>
                <p className="ts-role">{role}</p>
                <p className="muted small">{why}</p>
                <p className="alts">Alternatives: {alts.join(' · ')}</p>
                <div className="chip-row">{used.map((u) => <NodeChip key={u} id={u} />)}</div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section id="ts-components" className="ts-layer">
        <header><h3 className="sec-title">Stack by component</h3><p className="muted">The recommended stack inside each component, from its detailed design.</p></header>
        <div className="comp-stack-grid">
          {[...internal].sort((a, b) => domainOrder.indexOf(a.domain) - domainOrder.indexOf(b.domain)).map((n) => {
            const d = designs[n.id]
            const [, , , , , path] = componentSourcing[n.id]
            return (
              <article key={n.id} className={'cs-card' + (focus === n.id ? ' lit' : '')} style={{ '--c': domains[n.domain].color }}>
                <header>
                  <p className="eyebrow">{domains[n.domain].name}</p>
                  <h4><a href={`#/node/${n.id}`}>{n.label}</a></h4>
                  <span className={'path p-' + path.toLowerCase()}>{path}</span>
                </header>
                <dl>
                  {(d?.stack || []).slice(0, 5).map(([layer, choice]) => <div key={layer}><dt>{layer}</dt><dd>{choice}</dd></div>)}
                </dl>
                <p className="cs-tech small muted">Platform technologies: {techFor(n.id).join(', ') || '—'}</p>
                <div className="cs-links">
                  <a className="q-link" href={`#/node/${n.id}`}>Full design</a>
                  {d && <a className="q-link" href={`#/node/${n.id}/d1`}>{d.decisions.length} design decisions</a>}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </section>
  )
}
