import { useState } from 'react'
import Modal from './Modal.jsx'
import Tech from './Tech.jsx'
import { nodeById, domains } from './systemData.js'
import { strategyGroups } from './operatingModel.js'
import { altData, secMaster } from './dataArchitecture.js'

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

const Tables = ({ rows }) => (
  <div className="ds-tables">
    {rows.map(([t, cols, note]) => (
      <div key={t} className="ds-table"><b>{t}</b><code>{cols}</code>{note && <span className="muted small">{note}</span>}</div>
    ))}
  </div>
)

// ───────────────────────── Alternative data ─────────────────────────

export function AltDataSection() {
  const [cat, setCat] = useState(0)
  const [open, setOpen] = useState(false)
  const c = altData.categories[cat]
  return (
    <section id="alternative-data" className="da-sec deep">
      <p className="eyebrow">Deep dive</p>
      <h3 className="deep-title">Alternative data</h3>
      <p className="lede">{altData.intro}</p>

      <h4 className="gap">Dataset categories</h4>
      <div className="alt-cats">
        <ul className="ds-list">
          {altData.categories.map((x, i) => (
            <li key={x[0]}><button className={i === cat ? 'on' : ''} onClick={() => { setCat(i); setOpen(true) }}><b>{x[0]}</b><small>{x[3]}</small></button></li>
          ))}
        </ul>
        <Modal open={open} onClose={() => setOpen(false)} label={c[0]}>
        <article className="ds-detail">
          <h3>{c[0]}</h3>
          <p>{c[1]}</p>
          <dl className="ds-meta">
            <div><dt>Typical delivery</dt><dd>{c[3]}</dd></div>
            <div><dt>Cadence & history</dt><dd>{c[4]}</dd></div>
            <div><dt>Native grain</dt><dd>{c[5]}</dd></div>
            <div><dt>Used by</dt><dd>{c[7].map((g) => strategyGroups[g]).join(', ')}</dd></div>
          </dl>
          <p className="g-line"><span>Main modelling challenge</span>{c[6]}</p>
          <p className="g-line"><span>Compliance watch-outs</span>{c[8]}</p>
          <h4>Example vendors</h4>
          <div className="examples">{c[2].map((v) => <span key={v} className="tag-plain">{v}</span>)}</div>
        </article>
        </Modal>
      </div>

      <h4 className="gap">Delivery mechanisms</h4>
      <div className="delivery-grid">
        {altData.delivery.map(([name, lands, pattern, pros, cons, preferred]) => (
          <article key={name} className={'delivery' + (preferred ? ' pref' : '')}>
            <div className="o-head"><b>{name}</b>{preferred && <span className="pill b-build">Preferred</span>}</div>
            <p className="small muted">{lands}</p>
            <p className="small"><span className="lbl">Pattern</span>{pattern}</p>
            <ul className="pc pros">{pros.map((x) => <li key={x}>{x}</li>)}</ul>
            <ul className="pc cons">{cons.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        ))}
      </div>

      <h4 className="gap">Dataset lifecycle: from discovery to offboarding</h4>
      <ol className="lifecycle-steps">
        {altData.lifecycle.map(([step, owner, what, gate], i) => (
          <li key={step}>
            <span className="n">{i + 1}</span>
            <div><b>{step}</b><span className="owner">{owner}</span><p>{what}</p><p className="gate"><span>Gate</span>{gate}</p></div>
          </li>
        ))}
      </ol>

      <h4 className="gap">Ingestion and governance patterns</h4>
      <div className="risks">
        {altData.patterns.map(([p, problem, how]) => (
          <div key={p} className="risk"><p className="r">{p}</p><p className="muted small">{problem}</p><p className="small">{how}</p></div>
        ))}
      </div>

      <h4 className="gap">How to model alternative data</h4>
      <div className="alt-layers">
        {altData.layers.map(([layer, what, tables]) => (
          <div key={layer} className="alt-layer">
            <b>{layer}</b>
            <p className="small">{what}</p>
            <div className="chip-row">{tables.map((t) => <code key={t} className="tbl-chip">{t}</code>)}</div>
          </div>
        ))}
      </div>
      <Tables rows={altData.tables} />

      <h4 className="gap">Modelling problems and how to handle them</h4>
      <div className="tbl-wrap">
        <table className="tbl"><thead><tr><th>Problem</th><th>Why it matters</th><th>How to model it</th></tr></thead>
          <tbody>{altData.challenges.map(([p, w, h]) => <tr key={p}><th>{p}</th><td className="muted">{w}</td><td>{h}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="two-col gap-top">
        <div>
          <h4>Evaluation scorecard</h4>
          <table className="tbl"><tbody>{altData.scorecard.map(([m, g]) => <tr key={m}><th>{m}</th><td>{g}</td></tr>)}</tbody></table>
        </div>
        <div>
          <h4>Where it sits on the platform</h4>
          <p className="small">Shares and bucket drops land in Snowflake and S3 (bronze), are conformed in silver, and published as point-in-time features in the shared research library. Entitlements come from the dataset registry and IAM.</p>
          <div className="chip-row">{['lake', 'research', 'secmaster', 'iam', 'compliance'].map((id) => <NodeChip key={id} id={id} />)}</div>
          <h4 className="gap">Discovery marketplaces</h4>
          <div className="examples">{altData.marketplaces.map((m) => <span key={m} className="tag-plain">{m}</span>)}</div>
        </div>
      </div>
    </section>
  )
}

// ───────────────────────── Security master ─────────────────────────

export function SecMasterSection() {
  const [ca, setCa] = useState(0)
  return (
    <section id="security-master" className="da-sec deep sm">
      <p className="eyebrow">Deep dive · the key dataset</p>
      <h3 className="deep-title">Security master</h3>
      <p className="lede">{secMaster.intro}</p>
      <div className="chip-row">{['secmaster', 'ibor', 'mdhub', 'accounting', 'oms'].map((id) => <NodeChip key={id} id={id} />)}</div>

      <h4 className="gap">Design principles</h4>
      <div className="sm-principles">
        {secMaster.principles.map(([t, d]) => <div key={t}><b>{t}</b><p className="small muted">{d}</p></div>)}
      </div>

      <h4 className="gap">Entity hierarchy</h4>
      <ol className="hierarchy">
        {secMaster.hierarchy.map(([level, what, example, ids]) => (
          <li key={level}>
            <div className="h-level">{level}</div>
            <div className="h-body"><p>{what}</p><p className="small"><span className="lbl">Example</span>{example}</p><p className="small"><span className="lbl">Identifiers held here</span><code>{ids}</code></p></div>
          </li>
        ))}
      </ol>

      <h4 className="gap">Data model (bitemporal, Data Vault–style)</h4>
      <p className="small muted">Operational copy in Postgres for the trading path; conformed copy in Snowflake (silver) with the SCD2 dimension in gold. Every satellite and link carries valid time and recorded time.</p>
      <Tables rows={secMaster.tables} />

      <h4 className="gap">Processing pipeline</h4>
      <ol className="pipeline">
        {secMaster.pipeline.map(([step, what, tech], i) => (
          <li key={step}><span className="n">{i + 1}</span><div><b>{step}</b><p className="small">{what}</p><p className="small muted mono-ish"><Tech>{tech}</Tech></p></div></li>
        ))}
      </ol>

      <h4 className="gap">Golden-copy source precedence</h4>
      <div className="tbl-wrap">
        <table className="tbl"><thead><tr><th>Attribute group</th><th>First choice</th><th>Then</th><th>Notes</th></tr></thead>
          <tbody>{secMaster.precedence.map((r) => <tr key={r[0]}><th>{r[0]}</th><td><b>{r[1]}</b></td><td>{r[2]}</td><td className="muted">{r[3]}</td></tr>)}</tbody>
        </table>
      </div>

      <h4 className="gap">Corporate actions: lifecycle</h4>
      <ol className="ca-flow">
        {secMaster.caLifecycle.map(([stage, timing, what, ids], i) => (
          <li key={stage}>
            <span className="n">{i + 1}</span>
            <div><b>{stage}</b><span className="owner">{timing}</span><p className="small">{what}</p><div className="chip-row tight">{ids.map((id) => <NodeChip key={id} id={id} />)}</div></div>
          </li>
        ))}
      </ol>

      <h4 className="gap">Corporate actions: what each type does</h4>
      <div className="seg ca-seg" role="group" aria-label="Corporate action type">
        {secMaster.caTypes.map((t, i) => <button key={t[0]} aria-pressed={i === ca} className={i === ca ? 'on' : ''} onClick={() => setCa(i)}>{t[0]}</button>)}
      </div>
      {(() => {
        const [type, kind, sm, pos, px, acct] = secMaster.caTypes[ca]
        return (
          <div className="ca-card">
            <h3>{type}</h3><span className="status s-changed">{kind}</span>
            <dl className="ca-effects">
              <div><dt>Security master</dt><dd>{sm}</dd></div>
              <div><dt>Positions & lots</dt><dd>{pos}</dd></div>
              <div><dt>Prices & adjustment factor</dt><dd>{px}</dd></div>
              <div><dt>Accounting</dt><dd>{acct}</dd></div>
            </dl>
          </div>
        )
      })()}
      <details className="ca-all">
        <summary>Show all {secMaster.caTypes.length} corporate action types as a table</summary>
        <div className="tbl-wrap">
          <table className="tbl ca-tbl"><thead><tr><th>Type</th><th>Kind</th><th>Security master</th><th>Positions & lots</th><th>Prices</th><th>Accounting</th></tr></thead>
            <tbody>{secMaster.caTypes.map((r) => <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i}>{c}</th> : <td key={i}>{c}</td>))}</tr>)}</tbody>
          </table>
        </div>
      </details>

      <h4 className="gap">Keeping historic securities data</h4>
      <div className="risks">
        {secMaster.history.map(([t, d]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{d}</p></div>)}
      </div>

      <h4 className="gap">Example queries</h4>
      <div className="sql-grid">
        {secMaster.sql.map(([t, q]) => <figure key={t}><figcaption>{t}</figcaption><pre><code>{q}</code></pre></figure>)}
      </div>

      <div className="two-col gap-top">
        <div><h4>Quality rules</h4><table className="tbl"><tbody>{secMaster.quality.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table></div>
        <div><h4>Service levels</h4><table className="tbl sla"><tbody>{secMaster.kpis.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
          <p className="small"><a className="primary-link" href="#/node/secmaster/d1">Security master design decisions →</a></p></div>
      </div>
    </section>
  )
}
