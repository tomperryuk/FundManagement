import { useMemo, useState } from 'react'
import { valueSteps, evidenceKinds } from './valueChain.js'
import { estateBaseline } from './firmOperatingModel.js'
import { roadmap } from './data.js'
import { EvidenceBadge } from './ValueChain.jsx'

// Everything still unconfirmed, drawn from the same data as the value chain and the estate baseline.
const roles = text => text.split(/[\/·,]| and /).map(x => x.trim()).filter(Boolean)
const gateName = g => roadmap[g].phase.split(' · ')[0]

export default function ValidationView() {
  const [owner, setOwner] = useState('all')
  const items = useMemo(() => ({
    steps: valueSteps.filter(s => s.evidence === 'validate').sort((a, b) => a.gate - b.gate),
    estate: estateBaseline.filter(([, status]) => status === 'Needs validation'),
  }), [])
  const owners = useMemo(() => [...new Set([...items.steps.flatMap(s => roles(s.owner)), ...items.estate.flatMap(e => roles(e[3]))])].sort(), [items])
  const match = text => owner === 'all' || roles(text).includes(owner)
  const steps = items.steps.filter(s => match(s.owner))
  const estate = items.estate.filter(e => match(e[3]))
  return <section className="validation">
    <p className="outcome"><b>{items.estate.length} estate areas and {items.steps.length} of {valueSteps.length} value-chain steps</b> depend on facts that have not been confirmed internally. Each has a named evidence owner and a delivery gate it must be resolved before.</p>
    <div className="validation-filter"><label className="map-select">Evidence owner<select value={owner} onChange={e => setOwner(e.target.value)}><option value="all">All owners</option>{owners.map(o => <option key={o}>{o}</option>)}</select></label><p className="small muted" role="status">Showing {estate.length} estate areas and {steps.length} value-chain steps.</p></div>

    <h3 className="sec-title">Value-chain steps that need validation, by gate</h3>
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Step</th><th>Needed by</th><th>Owner</th><th>What to confirm</th><th>Biggest gap</th></tr></thead><tbody>
      {steps.map(s => <tr key={s.id}><th><a href={`#/valuechain/steps/${s.id}`}><b>{s.n}</b> {s.name}</a></th><td>{gateName(s.gate)}<br /><span className="small muted">{roadmap[s.gate].title}</span></td><td>{s.owner}</td><td>{s.evidenceNote}</td><td>{s.gap}</td></tr>)}
      {!steps.length && <tr><td colSpan={5}>No value-chain steps for this owner.</td></tr>}
    </tbody></table></div>

    <h3 className="sec-title">Estate areas that need validation</h3>
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Area</th><th>What is known</th><th>Evidence owner</th><th>Next evidence</th></tr></thead><tbody>
      {estate.map(([area, , known, who, evidence]) => <tr key={area}><th>{area}</th><td>{known}</td><td>{who}</td><td>{evidence}</td></tr>)}
      {!estate.length && <tr><td colSpan={4}>No estate areas for this owner.</td></tr>}
    </tbody></table></div>
    <p className="small"><EvidenceBadge kind="validate" /> {evidenceKinds.validate[2]} Record outcomes in the <a href="#/register">decision register</a>; see <a href="#/operating/baseline">Actual vs proposed</a> for public sources.</p>
  </section>
}
