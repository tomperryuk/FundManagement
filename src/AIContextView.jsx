import { nodeById, domains } from './systemData.js'
import { intro, definition, layers, valueSpots, useCases, notForAI, sdlc, sdlcMeasures, guardrails, decisions, path } from './aiContext.js'

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

export default function AIContextView({ part = 'context' }) {
  if (part === 'context') return (
    <div className="mm">
      <p className="lede">{intro}</p>
      <div className="risks">
        {definition.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
      <h3 className="sec-title">What the context layer holds</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Layer</th><th>Holds</th><th>Builds on</th><th>Owner</th></tr></thead>
          <tbody>{layers.map(([l, h, b, o]) => <tr key={l}><th>{l}</th><td>{h}</td><td>{nodeById[b] ? <NodeChip id={b} /> : b}</td><td className="nowrap">{o}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">Where it adds value</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Component</th><th>Value</th><th>Example</th><th>Priority</th></tr></thead>
          <tbody>{valueSpots.map(([id, v, e, p]) => <tr key={id}><th><NodeChip id={id} /></th><td>{v}</td><td className="muted">{e}</td><td className="nowrap">{p}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )

  if (part === 'usecases') return (
    <div className="mm">
      <p className="muted">Where AI can help once the context layer exists. Each use keeps a named human decision-maker.</p>
      <div className="ts-grid">
        {useCases.map(([name, ids, what, control, posture]) => (
          <article key={name} className="ts-card">
            <div className="ts-head"><h4>{name}</h4><span className="lic">{posture}</span></div>
            <p className="small">{what}</p>
            <p className="alts">Control: {control}</p>
            <div className="chip-row">{ids.map((id) => <NodeChip key={id} id={id} />)}</div>
          </article>
        ))}
      </div>
      <h3 className="sec-title">Keep deterministic</h3>
      <div className="risks">
        {notForAI.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
    </div>
  )

  if (part === 'sdlc') return (
    <div className="mm">
      <p className="muted">AI-assisted engineering on the same paved road. This blueprint (components, interfaces, principles and decisions) is itself useful context for design and coding assistants.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Stage</th><th>How AI helps</th><th>Context it needs</th><th>Control</th></tr></thead>
          <tbody>{sdlc.map(([s, h, c, k]) => <tr key={s}><th>{s}</th><td>{h}</td><td className="muted">{c}</td><td>{k}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">How to measure it</h3>
      <div className="tbl-wrap">
        <table className="tbl"><tbody>{sdlcMeasures.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
      </div>
      <p className="small">Delivery teams and responsibilities: see <a href="#/org/structure">Organisation</a>.</p>
    </div>
  )

  if (part === 'guardrails') return (
    <div className="mm">
      <p className="muted">Controls that let AI and the context layer be used safely in a regulated investment firm. Confirm against current policy and counsel.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Risk</th><th>Control</th><th>Owner</th></tr></thead>
          <tbody>{guardrails.map(([r, c, o]) => <tr key={r}><th>{r}</th><td>{c}</td><td className="nowrap">{o}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">Decisions to make</h3>
      <div className="risks">
        {decisions.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
    </div>
  )

  return (
    <div className="mm">
      <p className="muted">A gated path: each phase passes its gate before the next one starts. Timings are indicative.</p>
      <ol className="pipeline">
        {path.map(([phase, when, what, gate]) => (
          <li key={phase}><span className="n">{phase.split(' ')[0]}</span><div><b>{phase.split('· ')[1]}</b><span className="owner">{when}</span><p className="small">{what}</p><p className="gate"><span>Gate</span>{gate}</p></div></li>
        ))}
      </ol>
    </div>
  )
}
