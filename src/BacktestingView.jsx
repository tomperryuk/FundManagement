import { nodeById, domains } from './systemData.js'
import { intro, role, lifecycle, biases, realism, methods, metrics, platform, governance, evidence, decisions } from './backtesting.js'

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

export default function BacktestingView({ part = 'role' }) {
  if (part === 'role') return (
    <div className="mm">
      <p className="lede">{intro}</p>
      <div className="risks">
        {role.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
      <p className="small">Backtesting runs inside <NodeChip id="research" /> and reads data from the point-in-time layer described in <a href="#/data/pit">Point-in-time & corrections</a>.</p>
    </div>
  )

  if (part === 'lifecycle') return (
    <div className="mm">
      <p className="muted">From idea to promoted signal. Each stage produces evidence the next one relies on.</p>
      <ol className="pipeline">
        {lifecycle.map(([stage, owner, what, out], i) => (
          <li key={stage}><span className="n">{i + 1}</span><div><b>{stage.replace(/^\d+\.\s*/, '')}</b><span className="owner">{owner}</span><p className="small">{what}</p><p className="gate"><span>Output</span>{out}</p></div></li>
        ))}
      </ol>
    </div>
  )

  if (part === 'biases') return (
    <div className="mm">
      <p className="muted">Most disappointing live results trace back to one of these. Each has a specific control rather than a general warning.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Bias</th><th>How it happens</th><th>Control</th></tr></thead>
          <tbody>{biases.map(([b, h, c]) => <tr key={b}><th>{b}</th><td>{h}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )

  if (part === 'realism') return (
    <div className="mm">
      <p className="muted">A backtest is only as credible as its simulation of trading. These are the frictions the engine must model.</p>
      <div className="ts-grid">
        {realism.map(([name, what, how]) => (
          <article key={name} className="ts-card">
            <div className="ts-head"><h4>{name}</h4></div>
            <p className="small">{what}</p>
            <p className="alts">{how}</p>
          </article>
        ))}
      </div>
    </div>
  )

  if (part === 'methods') return (
    <div className="mm">
      <p className="muted">Different methods answer different questions. Fast screens find candidates; the rest guard against fooling ourselves.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Method</th><th>What it does</th><th>When to use</th></tr></thead>
          <tbody>{methods.map(([m, w, u]) => <tr key={m}><th>{m}</th><td>{w}</td><td>{u}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">Metrics reviewed</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Metric</th><th>Why it matters</th><th>Caution</th></tr></thead>
          <tbody>{metrics.map(([m, w, c]) => <tr key={m}><th>{m}</th><td>{w}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )

  if (part === 'platform') return (
    <div className="mm">
      <p className="muted">The platform pieces that make a backtest repeatable and auditable.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Component</th><th>Role</th><th>Detail</th></tr></thead>
          <tbody>{platform.map(([c, r, d]) => <tr key={c}><th>{c}</th><td>{r}</td><td>{d}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="small">Technology choices: see <a href="#/stack/components">Technology stack</a>. Reproducing an old backtest is also a gate in the <a href="#/data-blueprint/delivery">data platform delivery plan</a>.</p>
    </div>
  )

  return (
    <div className="mm">
      <p className="muted">Who is accountable for a backtest, and the evidence a signal needs before it earns capital.</p>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Role</th><th>Responsibility</th></tr></thead>
          <tbody>{governance.map(([r, d]) => <tr key={r}><th>{r}</th><td>{d}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">Promotion evidence checklist</h3>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Evidence</th><th>Requirement</th></tr></thead>
          <tbody>{evidence.map(([e, r]) => <tr key={e}><th>{e}</th><td>{r}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">Open questions</h3>
      <div className="risks">
        {decisions.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
    </div>
  )
}
