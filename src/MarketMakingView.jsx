import { useState } from 'react'
import { nodeById, domains } from './systemData.js'
import {
  intro, differences, prerequisites, verdicts, componentFit, newCapabilities,
  targetZones, latencyBudget, mmDecisions, entryPath, mmTeams,
} from './marketMaking.js'
import { DecisionCard } from './SystemMap.jsx'
import { useChoices } from './choices.js'

const ORDER = ['reuse', 'extend', 'separate', 'replace', 'none']

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

export default function MarketMakingView({ part = 'model' }) {
  const [filter, setFilter] = useState('all')
  const [choices, choose] = useChoices()

  if (part === 'model') return (
    <div className="mm">
      <p className="lede">{intro}</p>
      <h3 className="sec-title">How the business differs</h3>
      <div className="tbl-wrap">
        <table className="tbl mm-diff">
          <thead><tr><th>Dimension</th><th>Hedge fund platform</th><th>Market-making business</th></tr></thead>
          <tbody>{differences.map(([d, a, b]) => <tr key={d}><th>{d}</th><td className="muted">{a}</td><td>{b}</td></tr>)}</tbody>
        </table>
      </div>
      <h3 className="sec-title">What must exist before the first quote</h3>
      <div className="risks">
        {prerequisites.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>
    </div>
  )

  if (part === 'fit') {
    const counts = ORDER.map((v) => [v, componentFit.filter((r) => r[1] === v).length])
    const rows = componentFit.filter((r) => filter === 'all' || r[1] === filter)
      .sort((a, b) => ORDER.indexOf(a[1]) - ORDER.indexOf(b[1]))
    return (
      <div className="mm">
        <p className="muted">Every component of the fund platform, assessed for a market-making business. Most of the enterprise core carries over with extensions; the trading path is replaced.</p>
        <div className="verdict-bar">
          {counts.map(([v, n]) => (
            <button key={v} className={'verdict-tile v-' + v + (filter === v ? ' on' : '')} onClick={() => setFilter(filter === v ? 'all' : v)} aria-pressed={filter === v}>
              <b>{n}</b><span>{verdicts[v][0]}</span><small>{verdicts[v][1]}</small>
            </button>
          ))}
        </div>
        <div className="tbl-wrap">
          <table className="tbl mm-fit">
            <thead><tr><th>Component</th><th>Verdict</th><th>What changes for market making</th></tr></thead>
            <tbody>{rows.map(([id, v, what]) => (
              <tr key={id}><th><NodeChip id={id} /></th><td><span className={'verdict v-' + v}>{verdicts[v][0]}</span></td><td>{what}</td></tr>
            ))}</tbody>
          </table>
        </div>
        {filter !== 'all' && <p className="small"><button className="link" onClick={() => setFilter('all')}>Show all components</button></p>}
      </div>
    )
  }

  if (part === 'new') return (
    <div className="mm">
      <p className="muted">Capabilities with no equivalent on the fund platform. Together they form the new hot path and its controls.</p>
      <div className="ts-grid">
        {newCapabilities.map(([name, what, tech]) => (
          <article key={name} className="ts-card">
            <div className="ts-head"><h4>{name}</h4><span className="verdict v-new">New</span></div>
            <p className="small">{what}</p>
            <p className="alts">Typical technology: {tech}</p>
          </article>
        ))}
      </div>
    </div>
  )

  if (part === 'target') return (
    <div className="mm">
      <p className="muted">A two-speed design: a new, colocated hot path for quoting, alongside the enterprise core the fund already runs. The two connect only through drop copies, reference data and controlled services.</p>
      <div className="zones">
        {targetZones.map(([zone, where, items, note], i) => (
          <section key={zone} className={'zone-card z' + i}>
            <header><b>{zone}</b><span>{where}</span></header>
            <div className="chip-row">{items.map((x) => <span key={x} className="tech">{x}</span>)}</div>
            <p className="small muted">{note}</p>
          </section>
        ))}
      </div>
      <p className="zone-flow small"><b>Flow:</b> exchange feeds → hot path → exchange gateways; fills → drop copies → Kafka → dealer books, clearing, recon and firm-wide risk. Reference data flows the other way: security master → hot path, precomputed and cached in memory.</p>
      <h3 className="sec-title">Indicative tick-to-trade budget</h3>
      <div className="tbl-wrap">
        <table className="tbl latency">
          <thead><tr><th>Stage</th><th>Kernel-bypass software</th><th>FPGA</th></tr></thead>
          <tbody>{latencyBudget.map(([s, sw, hw], i) => <tr key={s} className={i === latencyBudget.length - 1 ? 'total' : ''}><th>{s}</th><td>{sw}</td><td>{hw}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="source">Indicative ranges for colocated systems; real budgets depend on venue, product, hardware and code. Measure on the wire before committing to a design.</p>
    </div>
  )

  if (part === 'decisions') return (
    <div className="mm">
      <p className="muted">Decisions to make before committing to a market-making business. Choices are saved in this browser.</p>
      {mmDecisions.map((d, i) => <DecisionCard key={d.id} d={d} n={i + 1} anchor={'decision-' + d.id} chosen={choices[d.id]} choose={choose} />)}
    </div>
  )

  return (
    <div className="mm">
      <p className="muted">A gated path: each phase must pass its gate before the next one starts. Timings overlap and depend on licensing and hiring.</p>
      <ol className="pipeline mm-path">
        {entryPath.map(([phase, when, what, gate]) => (
          <li key={phase}><span className="n">{phase.split(' ')[0]}</span><div><b>{phase.split('· ')[1]}</b><span className="owner">{when}</span><p className="small">{what}</p><p className="gate"><span>Gate</span>{gate}</p></div></li>
        ))}
      </ol>
      <h3 className="sec-title">Teams the dealer needs</h3>
      <div className="tbl-wrap">
        <table className="tbl"><thead><tr><th>Team</th><th>Role</th><th>Indicative size</th></tr></thead>
          <tbody>{mmTeams.map(([t, r, s]) => <tr key={t}><th>{t}</th><td>{r}</td><td className="nowrap">{s}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="small">Shared with the fund: core platform & SRE, security & identity, data platform, reference data and architecture. See <a href="#/org/structure">Organisation</a>.</p>
    </div>
  )
}
