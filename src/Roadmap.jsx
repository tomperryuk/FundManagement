import { roadmap } from './data.js'

export default function Roadmap() {
  return (
    <section>
      <p className="eyebrow">Delivery sequence · gated, not date commitments</p>
      <h2>Prove the workflow, then scale the platform</h2>
      <p className="lede">Sequence depends on the current estate, product owners, contracts and control gaps. Start with a representative research-to-trade-to-reconciliation slice; expand when business and control owners accept the evidence.</p>
      <div className="timeline">
        {roadmap.map((r) => (
          <article className="card" key={r.phase}>
            <span className="tag">{r.phase}</span>
            <h3>{r.title}</h3>
            <ul>{r.items.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        ))}
      </div>
    </section>
  )
}
