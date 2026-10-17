import { useMemo, useState } from 'react'
import { allDecisions } from './designData.js'
import { domains, nodeById } from './systemData.js'
import { useChoices } from './choices.js'

const STATUS = { all: 'All', open: 'Open', decided: 'Decided', dev: 'Differs from recommendation' }
const domainOrder = ['front', 'risk', 'data', 'ops', 'channels', 'platform']

export default function DecisionRegister() {
  const [choices, choose] = useChoices()
  const [domain, setDomain] = useState('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState('')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return allDecisions
      .map((d) => ({ ...d, node: nodeById[d.nodeId], chosen: choices[d.id], n: +d.id.split('-').pop() }))
      .filter((d) => domain === 'all' || d.node.domain === domain)
      .filter((d) => status === 'all' || (status === 'open' ? !d.chosen : status === 'decided' ? d.chosen : d.chosen && d.chosen !== d.rec))
      .filter((d) => !needle || [d.q, d.context, d.node.label, d.rec, ...d.options.map((o) => o.name)].join(' ').toLowerCase().includes(needle))
      .sort((a, b) => domainOrder.indexOf(a.node.domain) - domainOrder.indexOf(b.node.domain))
  }, [choices, domain, status, q])

  const total = allDecisions.length
  const decided = allDecisions.filter((d) => choices[d.id]).length
  const deviations = allDecisions.filter((d) => choices[d.id] && choices[d.id] !== d.rec).length

  const copyMarkdown = () => {
    const lines = ['| Component | Decision | Recommended | Chosen | Revisit when |', '|---|---|---|---|---|']
    rows.forEach((d) => lines.push(`| ${d.node.label} | ${d.q} | ${d.rec} | ${d.chosen || 'Open'} | ${d.revisit} |`))
    const text = lines.join('\n')
    const done = () => { setCopied('Copied'); setTimeout(() => setCopied(''), 1800) }
    navigator.clipboard?.writeText(text).then(done, () => setCopied('Copy failed: clipboard unavailable'))
  }

  return (
    <section className="register">
      <p className="eyebrow">Architecture decision register</p>
      <h2>Design decisions</h2>
      <p className="lede">
        Every significant design decision on the platform, with a recommended option and when to revisit it. Record your
        choice on each component’s page or here. Choices are saved in this browser only, so copy the table to share it.
      </p>

      <dl className="map-stats register-stats">
        <div><dt>Decisions</dt><dd>{total}</dd></div>
        <div><dt>Decided</dt><dd>{decided}</dd></div>
        <div><dt>Open</dt><dd>{total - decided}</dd></div>
        <div><dt>Differ from recommendation</dt><dd>{deviations}</dd></div>
      </dl>

      <div className="toolbar register-tools">
        <div className="toolbar-group">
          <span className="toolbar-label">Area</span>
          <div className="chips">
            <button className={'chip' + (domain === 'all' ? ' on' : '')} onClick={() => setDomain('all')}>All</button>
            {domainOrder.map((k) => (
              <button key={k} className={'chip' + (domain === k ? ' on' : '')} onClick={() => setDomain(k)}>{domains[k].name}</button>
            ))}
          </div>
        </div>
        <div className="toolbar-group">
          <span className="toolbar-label">Status</span>
          <div className="chips">
            {Object.entries(STATUS).map(([k, v]) => (
              <button key={k} className={'chip' + (status === k ? ' on' : '')} onClick={() => setStatus(k)}>{v}</button>
            ))}
          </div>
          <input id="register-search" className="search" type="search" placeholder="Search decisions, options, vendors…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search decisions" />
          <button className="primary copy" onClick={copyMarkdown}>{copied || 'Copy as Markdown'}</button>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl register-tbl">
          <thead>
            <tr><th>Component</th><th>Decision</th><th>Options</th><th>Recommended</th><th>Your choice</th></tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className={d.chosen ? (d.chosen !== d.rec ? 'dev' : 'ok') : ''}>
                <td>
                  <span className="dom" style={{ '--c': domains[d.node.domain].color }}>{domains[d.node.domain].name}</span>
                  <a className="comp-link" href={`#/node/${d.nodeId}`}>{d.node.label}</a>
                </td>
                <td>
                  <a className="q-link" href={`#/node/${d.nodeId}/d${d.n}`}>{d.q}</a>
                  <span className="muted small">{d.context}</span>
                </td>
                <td className="small">{d.options.map((o) => o.name).join(' · ')}</td>
                <td><b>{d.rec}</b><span className="muted small">Revisit: {d.revisit}</span></td>
                <td>
                  <select id={`choice-${d.id}`} value={d.chosen || ''} onChange={(e) => choose(d.id, e.target.value || null)} aria-label={`Your choice for: ${d.q}`}>
                    <option value="">Open</option>
                    {d.options.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="5" className="muted">No decisions match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
