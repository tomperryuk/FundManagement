import { roadmap } from './data.js'
import { gateUnlocks } from './valueChain.js'
import { StepChip } from './ValueChain.jsx'

export default function Roadmap() {
  return (
    <section>
      <p className="eyebrow">Delivery sequence · gated, not date commitments</p>
      <h2>Prove the workflow, then scale the platform</h2>
      <p className="lede">Sequence depends on the current estate, product owners, contracts and control gaps. Start with a representative research-to-trade-to-reconciliation slice; expand when business and control owners accept the evidence.</p>
      <div className="timeline">
        {roadmap.map((r, i) => (
          <article className="card" key={r.phase}>
            <span className="tag">{r.phase}</span>
            <h3>{r.title}</h3>
            <ul>{r.items.map((x) => <li key={x}>{x}</li>)}</ul>
            <div className="gate-unlocks"><b>Unlocks along the value chain</b><ul>{gateUnlocks[i].map(([id, what]) => <li key={id}><StepChip id={id} /> {what}</li>)}</ul></div>
          </article>
        ))}
      </div>
    </section>
  )
}
