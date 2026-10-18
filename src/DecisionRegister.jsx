import { Fragment, useMemo, useState } from 'react'
import { decisionCatalogue } from './decisionCatalogue.js'
import { domains, nodeById } from './systemData.js'
import { useChoices } from './choices.js'
import { valueSteps, decisionSteps } from './valueChain.js'
import { StepChip } from './ValueChain.jsx'
import { roadmap } from './data.js'
import DecisionEditor, { DecisionSyncNotice } from './DecisionEditor.jsx'

const STATUS = { all: 'All', open: 'Open', proposed: 'Under review', agreed: 'Agreed', dev: 'Different option' }
const areas = { ...Object.fromEntries(Object.entries(domains).filter(([id]) => id !== 'external').map(([id, d]) => [id, d.name])), organisation: 'Organisation', extension: 'Optional extension' }
const clean = value => String(value || '').replaceAll('|', '\\|').replaceAll('\n', ' ')

export default function DecisionRegister() {
  const [choices, choose, shared] = useChoices()
  const [domain, setDomain] = useState('all')
  const [scope, setScope] = useState('core')
  const [status, setStatus] = useState('all')
  const [step, setStep] = useState('all')
  const [sort, setSort] = useState('component')
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(() => !window.matchMedia('(max-width: 760px)').matches)
  const decisions = useMemo(() => decisionCatalogue.map(d => ({ ...d, node: nodeById[d.nodeId], area: d.scope === 'platform' ? nodeById[d.nodeId].domain : d.scope, ...decisionSteps(d) })), [])
  const inScope = decisions.filter(d => scope === 'all' || d.scope !== 'extension')
  const rows = inScope.filter(d => domain === 'all' || d.area === domain)
    .filter(d => step === 'all' || d.steps.some(x => x.id === step))
    .filter(d => status === 'all' || (status === 'dev' ? choices[d.id] && choices[d.id] !== d.rec : (shared.records[d.id]?.status || 'open') === status))
    .filter(d => !q.trim() || [d.q, d.context, d.node?.label, d.rec, shared.records[d.id]?.rationale, shared.records[d.id]?.owner, ...d.options.map(o => o.name)].join(' ').toLowerCase().includes(q.trim().toLowerCase()))
  if (sort === 'gate') rows.sort((a, b) => (a.gate ?? 9) - (b.gate ?? 9) || b.steps.length - a.steps.length)
  const selected = inScope.filter(d => choices[d.id]).length
  const agreed = inScope.filter(d => shared.records[d.id]?.status === 'agreed').length
  const copyMarkdown = async () => {
    const lines = ['| Component | Value-chain steps | Needed by | Decision | Recommended | Selected | Status | Owner | Rationale | Updated by | Updated |', '|---|---|---|---|---|---|---|---|---|---|---|']
    rows.forEach(d => { const r = shared.records[d.id]; lines.push('| ' + [d.node?.label || areas[d.area], d.steps.map(v => v.name).join(', '), d.gate !== null ? roadmap[d.gate].phase.split(' · ')[0] : '', d.q, d.rec, r?.choice || 'Open', STATUS[r?.status || 'open'], r?.owner, r?.rationale, r?.updatedBy, r?.updatedAt].map(clean).join(' | ') + ' |') })
    try { await navigator.clipboard.writeText(lines.join('\n')); setCopied(`Copied ${rows.length} decisions`) } catch { setCopied('Copy unavailable · use Download instead') }
  }
  const download = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), decisions: rows.map(d => ({ id: d.id, question: d.q, recommended: d.rec, record: shared.records[d.id] || null })) }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = url; link.download = 'fund-platform-decisions.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="register">
    <p className="eyebrow">Shared architecture decision register</p><h2>Review choices and record agreement</h2>
    <p className="lede">Compare the proposed recommendations, select an option for review, then record an owner and rationale before marking it agreed. Both permitted reviewers can edit; each saved change records who changed it and when.</p>
    <DecisionSyncNotice />
    <dl className="map-stats register-stats"><div><dt>In scope</dt><dd>{inScope.length}</dd></div><div><dt>Open</dt><dd>{inScope.length - selected}</dd></div><div><dt>Under review</dt><dd>{selected - agreed}</dd></div><div><dt>Agreed</dt><dd>{agreed}</dd></div></dl>
    <label className="register-search-label">Find a decision<input className="search" type="search" placeholder="Search decisions, rationale or owners…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search decisions" /></label>
    <details className="register-filter-panel" open={filtersOpen} onToggle={e => setFiltersOpen(e.currentTarget.open)}><summary>Filter by scope, area & status{(domain !== 'all' || status !== 'all' || scope !== 'core' || step !== 'all' || sort !== 'component') ? ' · filters applied' : ''}</summary><div className="toolbar register-tools">
      <div className="toolbar-group"><span className="toolbar-label">Scope</span><div className="chips">{[['core', 'Core blueprint'], ['all', 'Include optional extension']].map(([id, label]) => <button key={id} className={'chip' + (scope === id ? ' on' : '')} aria-pressed={scope === id} onClick={() => { setScope(id); setDomain('all') }}>{label}</button>)}</div></div>
      <div className="toolbar-group"><span className="toolbar-label">Area</span><div className="chips"><button className={'chip' + (domain === 'all' ? ' on' : '')} aria-pressed={domain === 'all'} onClick={() => setDomain('all')}>All</button>{Object.entries(areas).filter(([id]) => scope === 'all' || id !== 'extension').map(([id, label]) => <button key={id} className={'chip' + (domain === id ? ' on' : '')} aria-pressed={domain === id} onClick={() => setDomain(id)}>{label}</button>)}</div></div>
      <div className="toolbar-group"><span className="toolbar-label">Value-chain step</span><div className="chips"><button className={'chip' + (step === 'all' ? ' on' : '')} aria-pressed={step === 'all'} onClick={() => setStep('all')}>All</button>{valueSteps.map(v => <button key={v.id} className={'chip' + (step === v.id ? ' on' : '')} aria-pressed={step === v.id} onClick={() => setStep(v.id)}>{v.n} · {v.name}</button>)}</div></div>
      <div className="toolbar-group"><span className="toolbar-label">Order by</span><div className="chips">{[['component', 'Component'], ['gate', 'Earliest gate needed']].map(([id, label]) => <button key={id} className={'chip' + (sort === id ? ' on' : '')} aria-pressed={sort === id} onClick={() => setSort(id)}>{label}</button>)}</div></div>
      <div className="toolbar-group"><span className="toolbar-label">Status</span><div className="chips">{Object.entries(STATUS).map(([id, label]) => <button key={id} className={'chip' + (status === id ? ' on' : '')} aria-pressed={status === id} onClick={() => setStatus(id)}>{label}</button>)}</div></div>
    </div></details>
    <div className="register-actions"><p role="status">Showing {rows.length} of {inScope.length} decisions.</p><button className="secondary-action" onClick={copyMarkdown}>Copy shown decisions</button><button className="secondary-action" onClick={download}>Download shown decisions & history</button><span role="status">{copied}</span></div>
    <div className="tbl-wrap"><table className="tbl register-tbl"><thead><tr><th>Component</th><th>Decision</th><th>Proposed recommendation</th><th>Shared selection</th></tr></thead><tbody>{rows.map(d => <Fragment key={d.id}>
      <tr className={choices[d.id] ? choices[d.id] === d.rec ? 'ok' : 'dev' : ''}>
        <td data-label="Component"><span className="dom" style={{ '--c': domains[d.area]?.color || 'var(--accent)' }}>{areas[d.area]}</span><a className="comp-link" href={d.link}>{d.node?.label || areas[d.area]}</a></td>
        <td data-label="Decision"><a className="q-link" href={d.link}>{d.q}</a><span className="muted small">{d.context}</span>{d.gate !== null && <span className="small step-of">Needed by {roadmap[d.gate].phase.split(' · ')[0]}{d.steps.length > 0 && ' · '}{d.steps.map(v => <StepChip key={v.id} id={v.id} />)}</span>}<details className="small"><summary>Compare options ({d.options.length})</summary><ul>{d.options.map(o => <li key={o.name}>{o.name}</li>)}</ul><a href={d.link}>Full options & trade-offs →</a></details></td>
        <td data-label="Proposed recommendation"><b>{d.rec}</b><span className="muted small">Revisit: {d.revisit}</span></td>
        <td data-label="Shared selection"><label className="sr-only" htmlFor={`choice-${d.id}`}>Selected option for {d.q}</label><select id={`choice-${d.id}`} value={choices[d.id] || ''} disabled={!shared.editable} onChange={e => choose(d.id, e.target.value || null)}><option value="">Open</option>{d.options.map(o => <option key={o.name}>{o.name}</option>)}</select><span className="small">{STATUS[shared.records[d.id]?.status || 'open']}</span></td>
      </tr>
      <tr className="register-review-row"><td colSpan={4}><details><summary>Review owner, rationale & history</summary><DecisionEditor decision={d} /></details></td></tr>
    </Fragment>)}{!rows.length && <tr><td colSpan={4}>No decisions match these filters. <button className="link" onClick={() => { setDomain('all'); setStatus('all'); setStep('all'); setQ('') }}>Clear filters</button></td></tr>}</tbody></table></div>
  </section>
}
