import { nodeById, domains } from './systemData.js'
import { intro, role, flows, dailyCycle, liquidity, controls, decisions } from './treasury.js'

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

export default function TreasuryView({ part = 'role' }) {
  if (part === 'role') return (
    <div className="mm">
      <p className="lede">{intro}</p>
      <div className="risks">
        {role.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
      <h3 className="sec-title">Where cash flows meet other components</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Flow</th><th>From</th><th>To</th><th>Treasury’s part</th></tr></thead>
          <tbody>{flows.map(([f, a, b, d]) => <tr key={f}><th>{f}</th><td><NodeChip id={a} /></td><td><NodeChip id={b} /></td><td>{d}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="small">Treasury runs mainly on <NodeChip id="settlement" /> and <NodeChip id="collateral" />. See <a href="#/lifecycle/stages">Trade stages</a> for settlement and financing in the trade lifecycle.</p>
    </div>
  )

  if (part === 'cycle') return (
    <div className="mm">
      <p className="muted">A typical treasury day. Timings follow bank cut-offs and market hours in each region.</p>
      <ol className="pipeline">
        {dailyCycle.map(([stage, when, what, out], i) => (
          <li key={stage}><span className="n">{i + 1}</span><div><b>{stage}</b><span className="owner">{when}</span><p className="small">{what}</p><p className="gate"><span>Output</span>{out}</p></div></li>
        ))}
      </ol>
    </div>
  )

  if (part === 'liquidity') return (
    <div className="mm">
      <p className="muted">The areas treasury manages and how each connects to the rest of the platform.</p>
      <div className="ts-grid">
        {liquidity.map(([name, what, link]) => (
          <article key={name} className="ts-card">
            <div className="ts-head"><h4>{name}</h4></div>
            <p className="small">{what}</p>
            <p className="alts">{link}</p>
          </article>
        ))}
      </div>
    </div>
  )

  return (
    <div className="mm">
      <p className="muted">Cash is where operational fraud happens, so these controls are the part investors’ due diligence tests first.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Risk</th><th>Control</th><th>Owner</th></tr></thead>
          <tbody>{controls.map(([r, c, o]) => <tr key={r}><th>{r}</th><td>{c}</td><td className="nowrap">{o}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">Open questions</h3>
      <div className="risks">
        {decisions.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
      <p className="small">Ownership: see <a href="#/org/ownership">Component ownership</a>.</p>
    </div>
  )
}
