import { nodeById, domains } from './systemData.js'
import { intro, mapping, layers, namingNote, fit, lenses, generate, risks, compareIntro, compare, chooseVault, chooseMesh, compareVerdict, compareRevisit } from './dataPerspectives.js'

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

export default function PerspectivesView({ part = 'vault' }) {
  if (part === 'vault') return (
    <div className="mm">
      <p className="lede">{intro}</p>
      <h3 className="sec-title">Ontology to Data Vault</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Ontology or flow concept</th><th>Data Vault construct</th><th>Example</th><th>Note</th></tr></thead>
          <tbody>{mapping.map(([c, d, e, n]) => <tr key={c}><th>{c}</th><td>{d}</td><td><code>{e}</code></td><td className="muted">{n}</td></tr>)}</tbody>
        </table>
      </div>
      <aside className="flow-callout"><b>{namingNote[0]}.</b> {namingNote[1]}</aside>
      <h3 className="sec-title">Where the layers sit</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Layer</th><th>Holds</th><th>Ontology’s role</th><th>Blueprint layer</th></tr></thead>
          <tbody>{layers.map(([l, h, o, b]) => <tr key={l}><th>{l}</th><td>{h}</td><td>{o}</td><td className="muted">{b}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="small">Related: <a href="#/data/modelling">Modelling approach</a>, <a href="#/secmaster">Security master</a> and <a href="#/data/pit">Point-in-time & corrections</a>.</p>
    </div>
  )

  if (part === 'fit') return (
    <div className="mm">
      <p className="muted">Use Data Vault where several sources and changing keys need a history of what each said. Use simpler patterns elsewhere.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Data area</th><th>Recommended pattern</th><th>Why</th><th>Components</th></tr></thead>
          <tbody>{fit.map(([a, p, w, ids]) => <tr key={a}><th>{a}</th><td>{p}</td><td className="muted">{w}</td><td><div className="chip-row tight">{ids.map((id) => <NodeChip key={id} id={id} />)}</div></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )

  if (part === 'compare') return (
    <div className="mm">
      <p className="lede">{compareIntro}</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Point</th><th>Data Vault</th><th>Data mesh</th></tr></thead>
          <tbody>{compare.map(([p, v, m]) => <tr key={p}><th>{p}</th><td>{v}</td><td>{m}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">Why you would choose each</h3>
      <div className="ts-grid">
        <article className="ts-card"><div className="ts-head"><h4>Choose Data Vault when</h4></div><ul className="small">{chooseVault.map((x) => <li key={x}>{x}</li>)}</ul></article>
        <article className="ts-card"><div className="ts-head"><h4>Choose data mesh when</h4></div><ul className="small">{chooseMesh.map((x) => <li key={x}>{x}</li>)}</ul></article>
      </div>
      <h3 className="sec-title">What this means for the firm</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <tbody>{compareVerdict.map(([t, d]) => <tr key={t}><th>{t}</th><td>{d}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="small">{compareRevisit} Related: <a href="#/node/lake/d5">Where is Data Vault used?</a>, <a href="#/org/decisions">Who owns data?</a> and <a href="#/data/teams">Team workspaces</a>.</p>
    </div>
  )

  if (part === 'lenses') return (
    <div className="mm">
      <p className="muted">Other ways to look at the same design. None replaces the layers above; each explains one part of it.</p>
      <div className="ts-grid">
        {lenses.map(([name, how, adds, caution]) => (
          <article key={name} className="ts-card">
            <div className="ts-head"><h4>{name}</h4></div>
            <p className="small">{how}</p>
            <p className="small"><b>Adds:</b> {adds}</p>
            <p className="alts">Caution: {caution}</p>
          </article>
        ))}
      </div>
    </div>
  )

  return (
    <div className="mm">
      <p className="muted">Treat the ontology as source code. The physical models, tests and context for people and AI agents are generated from it.</p>
      <ol className="pipeline">
        {generate.map(([s, w]) => <li key={s}><span className="n">{s.split(' ')[0]}</span><div><b>{s.split('· ')[1]}</b><p className="small">{w}</p></div></li>)}
      </ol>
      <h3 className="sec-title">Risks and mitigations</h3>
      <div className="risks">
        {risks.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
      <p className="small">Decisions are recorded on the <a href="#/node/lake/d5">data platform</a> design and in the <a href="#/register">Decision register</a>. The ontology’s ownership is covered in <a href="#/ai/context">Ontology, AI & SDLC</a>.</p>
    </div>
  )
}
