import { useState } from 'react'
import Modal from './Modal.jsx'
import { nodeById, domains } from './systemData.js'
import { decisionCatalogue } from './decisionCatalogue.js'
import { roadmap } from './data.js'
import { useChoices } from './choices.js'
import { valueSteps, stepById, foundation, evidenceKinds, decisionSteps, gateUnlocks, roles } from './valueChain.js'

const gateLabel = g => roadmap[g].phase.split(' · ')[0]

export function EvidenceBadge({ kind }) {
  const [label, cls, tip] = evidenceKinds[kind]
  return <span className={'evidence ' + cls} title={tip}>{label}</span>
}

export function StepChip({ id }) {
  const s = stepById[id]
  return <a className="step-chip" href={`#/valuechain/steps/${id}`}><b>{s.n}</b>{s.name}</a>
}

function stepDecisions(id) {
  return decisionCatalogue.map(d => ({ d, ...decisionSteps(d) })).filter(x => x.steps.some(s => s.id === id))
}

function StepDetail({ step }) {
  const [, , shared] = useChoices()
  const decisions = stepDecisions(step.id)
  const agreed = decisions.filter(x => shared.records[x.d.id]?.status === 'agreed').length
  return <div className="step-detail">
    <p className="eyebrow">Step {step.n} of {valueSteps.length} · value chain</p>
    <h3>{step.name}</h3>
    <p className="lede">{step.question}</p>
    <dl className="step-facts">
      <div><dt>Accountable</dt><dd>{step.owner}</dd></div>
      <div><dt>Proven by</dt><dd>{roadmap[step.gate].title} · {gateLabel(step.gate)}</dd></div>
      <div><dt>Evidence</dt><dd><EvidenceBadge kind={step.evidence} /> <span className="small muted">{step.evidenceNote}</span></dd></div>
      <div><dt>Proposed measure</dt><dd>{step.measure}</dd></div>
      <div><dt>Biggest gap</dt><dd>{step.gap}</dd></div>
    </dl>
    <h4>Components on this step</h4>
    <div className="chip-row">{step.nodes.map(id => <a key={id} className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[nodeById[id].domain].color }}>{nodeById[id].label}</a>)}</div>
    <p className="small"><a href={`#/map?step=${step.id}`}>Highlight on the platform map →</a></p>
    <h4>Decisions that affect it · {agreed} of {decisions.length} agreed</h4>
    {decisions.length ? <ul className="step-decisions">{decisions.map(({ d, gate }) => <li key={d.id}><a href={d.link}>{d.q}</a> <span className="small muted">needed by {gateLabel(gate)} · {shared.records[d.id]?.status === 'agreed' ? 'agreed' : 'open'}</span></li>)}</ul> : <p className="small muted">No decisions are tagged to this step.</p>}
    <h4>Go deeper</h4>
    <ul className="step-links">{[...step.links, ...step.enablers].filter(([l], i, a) => a.findIndex(x => x[0] === l) === i).map(([label, link]) => <li key={label}><a href={link}>{label}</a></li>)}</ul>
  </div>
}

export function ValueChainStrip({ compact = false }) {
  const [open, setOpen] = useState(null)
  const step = open && stepById[open]
  return <section className={'value-chain' + (compact ? ' compact' : '')} aria-label="Value chain">
    <ol className="vc-strip">
      {valueSteps.map(s => <li key={s.id}>
        <button className="vc-step" onClick={() => setOpen(s.id)} aria-haspopup="dialog">
          <span className="vc-n">{s.n}</span>
          <b>{s.name}</b>
          <span className="vc-short">{s.short}</span>
          {!compact && <span className="vc-measure"><i>Measure</i>{s.measure.split(';')[0]}</span>}
          <span className="vc-foot"><EvidenceBadge kind={s.evidence} /><span className="vc-gate">{gateLabel(s.gate)}</span></span>
        </button>
      </li>)}
    </ol>
    <p className="vc-loop small muted">Steps 1, 2 and 8 form the multi-manager loop: capital is raised, teams are set up and run, and outcomes decide where capital goes next.</p>
    <div className="arch-foundation"><b>{foundation.name}</b><span>{foundation.note} {foundation.nodes.map(id => nodeById[id].label).join(' · ')}</span></div>
    <Modal open={Boolean(step)} onClose={() => setOpen(null)} label={step ? `Value chain step: ${step.name}` : ''}>{step && <StepDetail step={step} />}</Modal>
  </section>
}

// Compact leadership summary: the five decisions needed earliest and the next gates.
export function ExecSummary() {
  const [, , shared] = useChoices()
  const top = decisionCatalogue.filter(d => d.scope !== 'extension').map(d => ({ d, ...decisionSteps(d) }))
    .filter(x => x.gate !== null && shared.records[x.d.id]?.status !== 'agreed')
    .sort((a, b) => a.gate - b.gate || b.steps.length - a.steps.length).slice(0, 5)
  return <section className="exec-summary">
    <h3 className="sec-title">Leadership summary</h3>
    <div className="exec-grid">
      <article>
        <h4>Decisions needed earliest</h4>
        <ol>{top.map(({ d, steps, gate }) => <li key={d.id}><a href={d.link}>{d.q}</a><span className="small muted"> · {gateLabel(gate)}{steps.length ? ' · ' + steps.map(s => s.name).join(', ') : ''}</span></li>)}</ol>
        <a className="small" href="#/register">Open the decision register →</a>
      </article>
      <article>
        <h4>Delivery gates</h4>
        <ol>{roadmap.slice(0, 4).map((r, i) => <li key={r.phase}><b>{r.title}</b><span className="small muted"> · {gateLabel(i)} · unlocks {gateUnlocks[i].map(([id]) => stepById[id].name).join(', ')}</span></li>)}</ol>
        <a className="small" href="#/roadmap">Open the roadmap →</a>
      </article>
      <article>
        <h4>What is confirmed</h4>
        <p className="small">{valueSteps.filter(s => s.evidence === 'validate').length} of {valueSteps.length} steps depend on facts still to be validated internally, {valueSteps.filter(s => s.evidence === 'proposed').length} are proposed designs and {valueSteps.filter(s => s.evidence === 'public').length} rests on a public statement.</p>
        <a className="small" href="#/operating/baseline">Review actual versus proposed →</a>
      </article>
    </div>
  </section>
}

export default function ValueChainView({ part = 'steps', arg }) {
  if (part === 'steps') return <div className="vc-page">
    <p className="lede">Eight steps take the firm from raising capital to reviewing outcomes and reallocating it. Select a step for its owner, components, decisions, measure and gap; use the table to compare them.</p>
    <ValueChainStrip />
    <div className="tbl-wrap"><table className="tbl vc-table">
      <thead><tr><th>Step</th><th>Accountable</th><th>Key components</th><th>Proven by</th><th>Evidence</th></tr></thead>
      <tbody>{valueSteps.map(s => <tr key={s.id} id={s.id} className={arg === s.id ? 'ok' : ''}>
        <th><b>{s.n}</b> {s.name}<span className="muted small">{s.question}</span></th>
        <td>{s.owner}</td>
        <td>{s.nodes.slice(0, 4).map(id => <a key={id} className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[nodeById[id].domain].color }}>{nodeById[id].label}</a>)}</td>
        <td className="nowrap">{gateLabel(s.gate)}</td>
        <td><EvidenceBadge kind={s.evidence} /></td>
      </tr>)}</tbody>
    </table></div>
  </div>

  if (part === 'measures') return <div className="vc-page">
    <p className="lede">One headline measure per step, so the chain reads as a scorecard. These are proposed measures; baselines must be measured before targets are set.</p>
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Step</th><th>Proposed headline measure</th><th>Evidence behind the step</th><th>Biggest gap</th></tr></thead>
      <tbody>{valueSteps.map(s => <tr key={s.id}><th><b>{s.n}</b> {s.name}</th><td>{s.measure}</td><td><EvidenceBadge kind={s.evidence} /><span className="small muted">{s.evidenceNote}</span></td><td>{s.gap}</td></tr>)}</tbody>
    </table></div>
    <p className="small">Full measure tiers and per-lifecycle scorecards: <a href="#/lifecycle/metrics">Measures across the business</a>.</p>
    <h3 className="sec-title">Evidence states</h3>
    <ul className="evidence-key">{Object.entries(evidenceKinds).map(([k, [label, cls, tip]]) => <li key={k}><span className={'evidence ' + cls}>{label}</span> {tip}</li>)}</ul>
  </div>

  if (part === 'roles') return <div className="vc-page">
    <p className="lede">Start from your role: the steps you touch and the pages most useful to you.</p>
    <div className="role-grid">{roles.map(r => <article key={r.name} className="role-card">
      <h4>{r.name}</h4><p className="small">{r.does}</p>
      <div className="chip-row">{r.steps.map(id => <StepChip key={id} id={id} />)}</div>
      <ul className="step-links">{r.pages.map(([l, h]) => <li key={l}><a href={h}>{l}</a></li>)}</ul>
    </article>)}</div>
  </div>

  return <div className="vc-page">
    <p className="lede">Value arrives in gates, and each gate makes particular steps work end to end. Use this to ask what a gate buys, not just what it builds.</p>
    <div className="gate-list">{roadmap.map((r, i) => <article key={r.phase} className="gate-card">
      <span className="tag">{r.phase}</span><h4>{r.title}</h4>
      <ul>{gateUnlocks[i].map(([id, what]) => <li key={id}><StepChip id={id} /> {what}</li>)}</ul>
    </article>)}</div>
    <p className="small"><a href="#/roadmap">Open the roadmap →</a></p>
  </div>
}
