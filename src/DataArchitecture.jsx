import { useEffect, useState } from 'react'
import { nodeById, domains } from './systemData.js'
import {
  stages, lanes, governanceBar, snowflake, modelLayers, modelConventions,
  dataDomains, datasets, servingLayers, techLandscape,
} from './dataArchitecture.js'
import { AltDataSection, SecMasterSection } from './DataDeepDives.jsx'

const byId = Object.fromEntries(datasets.map((d) => [d.id, d]))
const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

export default function DataArchitecture() {
  const [domain, setDomain] = useState('all')
  const [sel, setSel] = useState('positions')
  const shown = datasets.filter((d) => domain === 'all' || d.domain === domain)
  const d = byId[sel]
  const pick = (id) => { setSel(id); setDomain('all'); jump('da-datasets') }

  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id && document.getElementById(id)) document.getElementById(id).scrollIntoView({ block: 'start' })
  }, [])

  return (
    <section className="da">
      <p className="eyebrow">Data architecture</p>
      <h2>A modern data platform for the fund</h2>
      <p className="lede">
        Four paths for four speeds of data: real time for trading and live risk, time series for ticks, analytical for
        history and reporting, and operational stores for systems of record. Snowflake runs the governed analytical path.
        Below are the {datasets.length} key datasets, with where each one lives, its recommended data model and how it is served.
      </p>
      <nav className="jump">
        {[['da-platform', 'Platform'], ['da-snowflake', 'Where Snowflake sits'], ['da-model', 'Modelling approach'], ['da-datasets', `Key datasets (${datasets.length})`], ['security-master', 'Security master'], ['alternative-data', 'Alternative data'], ['da-serving', 'Serving layers'], ['da-vendors', 'Vendor landscape']].map(([id, t]) => (
          <button key={id} onClick={() => jump(id)}>{t}</button>
        ))}
      </nav>

      {/* Platform lanes */}
      <section id="da-platform" className="da-sec">
        <h3 className="sec-title">Platform architecture</h3>
        <p className="muted small">Snowflake’s responsibilities are marked <span className="sf-key">Snowflake</span>. Read each lane left to right.</p>
        <div className="lanes-wrap">
          <div className="lanes" style={{ '--n': stages.length }}>
            <div className="lane-label head" />
            {stages.map((s) => <div key={s} className="stage-head">{s}</div>)}
            {lanes.map((l) => (
              <div key={l.id} className="lane-row" style={{ display: 'contents' }}>
                <div className={'lane-label l-' + l.id}>
                  <b>{l.name}</b>
                  <span className="lat">{l.latency}</span>
                  <small>{l.note}</small>
                </div>
                {l.cells.map((cell, i) => (
                  <div key={i} className={'lane-cell l-' + l.id + (cell.some((c) => c.sf) ? ' has-sf' : '')}>
                    {cell.map((c) => {
                      const t = typeof c === 'string' ? c : c.t
                      return <span key={t} className={'tech' + (c.sf ? ' sf' : '')}>{t}</span>
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="gov-bar">
          <b>Governance across every path</b>
          <dl>{governanceBar.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </div>
      </section>

      {/* Snowflake */}
      <section id="da-snowflake" className="da-sec sf-sec">
        <p className="eyebrow">Where Snowflake sits</p>
        <h3>The governed analytical platform, not the trading path</h3>
        <p className="lede">{snowflake.role}</p>
        <div className="sf-scope">
          <div><h4>Snowflake does</h4><ul className="checks">{snowflake.inScope.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div><h4>Snowflake does not</h4><ul className="crosses">{snowflake.outScope.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>
        <div className="sf-cols">
          <div>
            <h4>Features used</h4>
            <table className="tbl"><tbody>{snowflake.features.map(([f, u]) => <tr key={f}><th>{f}</th><td>{u}</td></tr>)}</tbody></table>
          </div>
          <div>
            <h4>Account and workload topology</h4>
            <dl className="questions">{snowflake.topology.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <p className="small"><a className="primary-link" href="#/node/lake/d1">See the platform decision: Snowflake vs Databricks vs self-run →</a></p>
          </div>
        </div>
      </section>

      {/* Modelling */}
      <section id="da-model" className="da-sec">
        <h3 className="sec-title">Modelling approach by layer</h3>
        <div className="tbl-wrap">
          <table className="tbl model-tbl">
            <thead><tr><th>Layer</th><th>Purpose</th><th>Model pattern</th><th>Why</th><th>Technology</th></tr></thead>
            <tbody>{modelLayers.map((r) => <tr key={r[0]}><th>{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td><td className="muted">{r[3]}</td><td>{r[4]}</td></tr>)}</tbody>
          </table>
        </div>
        <h4 className="gap">Conventions every model follows</h4>
        <dl className="conventions">{modelConventions.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </section>

      {/* Datasets */}
      <section id="da-datasets" className="da-sec">
        <h3 className="sec-title">Key datasets</h3>
        <div className="chips">
          <button className={'chip' + (domain === 'all' ? ' on' : '')} onClick={() => setDomain('all')}>All</button>
          {Object.entries(dataDomains).map(([k, v]) => (
            <button key={k} className={'chip' + (domain === k ? ' on' : '')} onClick={() => setDomain(k)}>{v}</button>
          ))}
        </div>
        <div className="ds-layout">
          <ul className="ds-list">
            {shown.map((x) => (
              <li key={x.id}>
                <button className={x.id === sel ? 'on' : ''} onClick={() => setSel(x.id)}>
                  <span className="ds-dom">{dataDomains[x.domain]}</span>
                  <b>{x.name}</b>
                  <small>{x.storage.map((s) => s[1].split(/[ (+]/)[0]).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}</small>
                </button>
              </li>
            ))}
          </ul>
          <article className="ds-detail">
            <p className="eyebrow">{dataDomains[d.domain]}</p>
            <h3>{d.name}</h3>
            <p>{d.desc}</p>
            <dl className="ds-meta">
              <div><dt>Golden source</dt><dd className="chip-row tight">{d.source.map((id) => <NodeChip key={id} id={id} />)}</dd></div>
              <div><dt>Volume</dt><dd>{d.volume}</dd></div>
              <div><dt>Latency</dt><dd>{d.latency}</dd></div>
              <div><dt>Sensitivity</dt><dd>{d.sensitivity}</dd></div>
              <div><dt>Retention</dt><dd>{d.retention}</dd></div>
            </dl>

            <h4>Where it lives</h4>
            <table className="tbl"><tbody>{d.storage.map(([tier, tech, why]) => <tr key={tier + tech}><th>{tier}</th><td><b>{tech}</b><br /><span className="muted small">{why}</span></td></tr>)}</tbody></table>

            <h4 className="gap">Recommended data model</h4>
            <dl className="ds-model">
              <div><dt>Pattern</dt><dd>{d.model.pattern}</dd></div>
              <div><dt>Grain</dt><dd>{d.model.grain}</dd></div>
              <div><dt>Keys</dt><dd><code>{d.model.keys}</code></dd></div>
              <div><dt>Time</dt><dd>{d.model.temporal}</dd></div>
            </dl>
            <div className="ds-tables">
              {d.model.tables.map(([t, cols]) => (
                <div key={t} className="ds-table"><b>{t}</b><code>{cols}</code></div>
              ))}
            </div>

            <div className="ds-cols">
              <div>
                <h4>Served to</h4>
                <table className="tbl"><tbody>{d.serving.map(([u, l]) => <tr key={u}><th>{u}</th><td>{l}</td></tr>)}</tbody></table>
              </div>
              <div>
                <h4>Quality checks</h4>
                <ul className="checks">{d.quality.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            </div>

            <h4 className="gap">Data vendors</h4>
            <div className="examples">{d.vendors.map((v) => <span key={v} className="tag-plain">{v}</span>)}</div>
            <p className="muted small">Delivery: {d.delivery}</p>
            {['instruments', 'corpactions', 'entities', 'calendars'].includes(d.id) && <button className="primary-link as-btn" onClick={() => jump('security-master')}>Read the security master deep dive →</button>}
            {d.id === 'altdata' && <button className="primary-link as-btn" onClick={() => jump('alternative-data')}>Read the alternative data deep dive →</button>}
          </article>
        </div>
      </section>

      <SecMasterSection />
      <AltDataSection />

      {/* Serving */}
      <section id="da-serving" className="da-sec">
        <h3 className="sec-title">Serving layers by use case</h3>
        <div className="tbl-wrap">
          <table className="tbl serving-tbl">
            <thead><tr><th>Use case</th><th>Who</th><th>Latency</th><th>Serving layer</th><th>Data shape</th><th>Key datasets</th></tr></thead>
            <tbody>
              {servingLayers.map(([u, who, lat, layer, shape, ids]) => (
                <tr key={u}>
                  <th>{u}</th><td>{who}</td><td className="nowrap">{lat}</td>
                  <td className={/Snowflake|Snowpark/.test(layer) ? 'sf-cell' : ''}>{layer}</td><td className="muted">{shape}</td>
                  <td><div className="chip-row tight">{ids.map((id) => <button key={id} className="ds-chip" onClick={() => pick(id)}>{byId[id].name}</button>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Vendors */}
      <section id="da-vendors" className="da-sec">
        <h3 className="sec-title">Technology vendor landscape</h3>
        <div className="tech-grid">
          {techLandscape.map(([cat, rec, alts, where]) => (
            <article key={cat} className={'tech-card' + (rec === 'Snowflake' ? ' sf-card' : '')}>
              <p className="eyebrow">{where}</p>
              <h4>{cat}</h4>
              <p className="rec"><span className="pill b-build">Recommended</span> {rec}</p>
              <p className="alts">Alternatives: {alts.join(' · ')}</p>
            </article>
          ))}
        </div>

        <h3 className="sec-title">Data vendor landscape</h3>
        <div className="tbl-wrap">
          <table className="tbl vendors-tbl">
            <thead><tr><th>Dataset</th><th>Area</th><th>Vendors</th><th>Delivery</th><th>Lives in</th></tr></thead>
            <tbody>
              {datasets.map((x) => (
                <tr key={x.id}>
                  <th><button className="link" onClick={() => pick(x.id)}>{x.name}</button></th>
                  <td className="muted">{dataDomains[x.domain]}</td>
                  <td>{x.vendors.join(', ')}</td>
                  <td className="muted">{x.delivery}</td>
                  <td>{x.storage.map((s) => s[1]).join('; ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
