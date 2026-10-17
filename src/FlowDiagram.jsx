// Renders a flow from designFlows.js: rows of steps with arrows and connector captions. Stacks on small screens.
export default function FlowDiagram({ flow }) {
  return (
    <figure className="flow-diagram" aria-label={flow.title}>
      <figcaption><h3 className="sec-title">{flow.title}</h3>{flow.intro && <p className="muted small">{flow.intro}</p>}</figcaption>
      {flow.rows.map((row, ri) => (
        <div key={row.label}>
          {row.between && <p className="flow-between"><span aria-hidden="true">↓</span>{row.between}</p>}
          <section className={'flow-row tone-' + row.tone}>
            <h4>{row.label}</h4>
            <ol className={row.parallel ? 'parallel' : ''}>
              {row.steps.map((s) => (
                <li key={s.t}>
                  {s.to ? <a href={s.to}><b>{s.t}</b>{s.d && <span>{s.d}</span>}</a> : <div><b>{s.t}</b>{s.d && <span>{s.d}</span>}</div>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      ))}
      {flow.loop && <p className="flow-loop"><span aria-hidden="true">↺</span>{flow.loop}</p>}
      {flow.callout && <aside className="flow-callout"><b>{flow.callout[0]}.</b> {flow.callout[1]}</aside>}
    </figure>
  )
}
