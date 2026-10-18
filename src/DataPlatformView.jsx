import { useState } from 'react'
import FlowDiagram from './FlowDiagram.jsx'
import { blueprintFlow, blueprintSources, platformCapabilities, implementationApproaches, platformDeliveryGates, productContract } from './dataPlatformBlueprint.js'
import { datasets } from './dataArchitecture.js'

const groups = [...new Set(platformCapabilities.map(x => x.group))]
const datasetNames = Object.fromEntries(datasets.map(x => [x.id, x.name]))
const groupDescriptions = {
  Capture: 'Receive complete, versioned deliveries and events with accountable contracts.',
  Store: 'Preserve authoritative records and history in stores suited to their workloads.',
  Process: 'Create correct projections, point-in-time history and dependable data products.',
  Govern: 'Apply quality, ownership, lineage, licences and access across every path.',
  Consume: 'Provide stable metrics, APIs and reproducible research workspaces.',
  Operate: 'Deliver controlled change, observe business impact and recover safely.',
}

export default function DataPlatformView({ part = 'overview', component }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('All')
  const target = platformCapabilities.find(x => x.id === component)
  const visible = platformCapabilities.filter(x =>
    (!target || x.id === target.id) && (group === 'All' || group === x.group) &&
    `${x.capability} ${x.name} ${x.recommended} ${x.alternatives} ${x.owner}`.toLowerCase().includes(query.trim().toLowerCase()))

  return <section className="data-blueprint">
    <p className="operating-proposal"><b>Target blueprint · proposed choices.</b> Start from the installed estate and agreed business outcomes. One product may implement several capabilities; a capability does not imply a separate purchase. Technology options require workload, licence, security, recovery and cost validation.</p>

    {part === 'overview' && <>
      <FlowDiagram flow={blueprintFlow} />
      <h3 className="sec-title">Capabilities map to owned components</h3>
      <div className="blueprint-capability-map">{groups.map(name => <article key={name}><h4>{name}</h4><p>{groupDescriptions[name]}</p><ul>{platformCapabilities.filter(x => x.group === name).map(x => <li key={x.id}><a href={`#/data-blueprint/components/${x.id}`}>{x.name} →</a></li>)}</ul></article>)}</div>
      <h3 className="sec-title">Recommended platform boundary</h3>
      <div className="operating-cards">{[
        ['Business authority', 'OMS owns order state, IBOR owns the approved investment position view, accounting owns official accounting records, and domain masters own identities/approvals. The platform distributes and reconciles their outputs.'],
        ['Analytical home', 'Use Snowflake as the primary analytical candidate, retaining raw evidence on controlled object storage where licensed. Select table/catalog options deliberately and retain the current estate where it meets accepted needs.'],
        ['Specialist paths', 'Add a managed event backbone, stateful processing and tick store only for measured live or time-series needs. Keep dedicated execution infrastructure independent of warehouse or AI availability.'],
        ['Common control plane', 'Identity, entitlements, data contracts, quality, ontology/lineage, support, delivery and cost policies apply across stores and engines. Native product features implement part of the control plane.'],
      ].map(([name, text]) => <article key={name}><h4>{name}</h4><p>{text}</p></article>)}</div>
      <p className="small">Continue to <a href="#/data-blueprint/components">components and technology options</a>, <a href="#/data-blueprint/options">implementation approaches</a>, or the detailed <a href="#/data/platform">four data paths</a>.</p>
    </>}

    {part === 'components' && <>
      <h3 className="sec-title">Component catalogue & technology options</h3>
      <p className="muted">Each card connects a business capability to its responsibilities, interface contract, candidate technologies, owner and acceptance evidence. “Conditional” components enter the implementation only when a real workload justifies them.</p>
      {target && <p className="small">Showing <b>{target.name}</b>. <a href="#/data-blueprint/components">View the full catalogue →</a></p>}
      <div className="blueprint-controls"><label>Find a capability or technology<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="For example: point-in-time, Kafka, lineage" /></label><label>Capability area<select value={group} onChange={e => setGroup(e.target.value)}><option>All</option>{groups.map(x => <option key={x}>{x}</option>)}</select></label><p aria-live="polite">{visible.length} {visible.length === 1 ? 'component' : 'components'}</p></div>
      <div className={'blueprint-components' + (target ? ' focused' : '')}>{visible.map(x => <article key={x.id} id={`capability-${x.id}`}>
        <header><span className="eyebrow">{x.group} · {x.scope}</span><h4>{x.name}</h4><p className="blueprint-capability">Capability: {x.capability}</p></header>
        <p>{x.responsibility}</p>
        <div className="blueprint-choice"><b>Recommended starting point</b><p>{x.recommended}</p></div>
        <p className="small"><b>Alternatives:</b> {x.alternatives}</p>
        {x.id === 'contracts' && <p className="small"><a className="primary-link" href="#/contracts/design">Read the schema-contract implementation design →</a></p>}
        <details open={Boolean(target)}><summary>Trade-offs, ownership & acceptance</summary><dl><div><dt>Interface / output</dt><dd>{x.contract}</dd></div><div><dt>Trade-off</dt><dd>{x.tradeoff}</dd></div><div><dt>Accountability</dt><dd>{x.owner}</dd></div><div><dt>Acceptance evidence</dt><dd>{x.gate}</dd></div></dl><p className="small">Related datasets: {x.datasets.map((id, i) => <span key={id}>{i > 0 && ' · '}<a href={`#/datasets/${id}`}>{datasetNames[id]}</a></span>)}</p></details>
      </article>)}</div>
      {!visible.length && <p className="glossary-empty">No components match. Clear the search or choose another capability area.</p>}
    </>}

    {part === 'options' && <>
      <h3 className="sec-title">Three implementation approaches</h3>
      <p className="muted">The architecture sets contracts, authority and service outcomes. Choose a primary analytical platform after representative workload trials; keep specialist execution and operational services where their needs differ.</p>
      <div className="operating-baseline">{implementationApproaches.map(x => <article key={x.name}><header><h4>{x.name}</h4><span className="evidence inference">{x.status}</span></header><dl><div><dt>Best fit</dt><dd>{x.fit}</dd></div><div><dt>Components</dt><dd>{x.stack}</dd></div><div><dt>Strengths</dt><dd>{x.strengths}</dd></div><div><dt>Trade-offs</dt><dd>{x.tradeoff}</dd></div><div><dt>Decision rule</dt><dd>{x.decide}</dd></div></dl></article>)}</div>
      <h3 className="sec-title">Selection trials that matter</h3>
      <div className="operating-cards">{[
        ['Research', 'Run point-in-time joins, corrections, delisted-universe queries and a reproducible backtest under realistic team concurrency. Compare time to useful results and cost.'],
        ['Live / tick workloads', 'Replay order/fill and feed gaps, restore processor state, query actual as-of/depth workloads, and reconcile outputs. Measure latency distributions at business-relevant load.'],
        ['Operations / Finance', 'Close a representative period, reconcile prices/positions/cash to official sources, apply a restatement and trace a report line to the approved source snapshot.'],
        ['Governance / recovery', 'Exercise prohibited access, policy revocation, external-engine reads, backup restore and primary-region loss. Record actual recovery and business reconciliation.'],
      ].map(([name, text]) => <article key={name}><h4>{name}</h4><p>{text}</p></article>)}</div>
      <p className="small">Related decisions: <a href="#/node/lake">data platform</a>, <a href="#/perspectives/fit">modelling pattern fit</a>, <a href="#/options/strategies">broader sourcing strategies</a>, <a href="#/register">shared decision register</a>.</p>
    </>}

    {part === 'delivery' && <>
      <h3 className="sec-title">Delivery gates, ownership & operation</h3>
      <p className="muted">Sequence capabilities around a usable end-to-end product. Architecture approval requires business acceptance and evidence of operational support and recovery, alongside technical delivery.</p>
      <ol className="operating-steps">{platformDeliveryGates.map(([name, owner, work, gate], i) => <li key={name}><span>{i + 1}</span><div><h4>{name}</h4><p className="small"><b>Accountable roles:</b> {owner}</p><p>{work}</p><p className="operating-gate"><b>Exit gate:</b> {gate}</p></div></li>)}</ol>
      <h3 className="sec-title">Minimum product contract</h3>
      <div className="tbl-wrap"><table className="tbl operating-table"><thead><tr><th>Contract area</th><th>Required content</th></tr></thead><tbody>{productContract.map(([name, text]) => <tr key={name}><th>{name}</th><td>{text}</td></tr>)}</tbody></table></div>
      <h3 className="sec-title">Deployment and recovery decisions</h3>
      <div className="operating-cards">{[
        ['Environment boundaries', 'Separate research/sandbox, validation and production identities, datasets, credentials and release gates. Team workspaces share entitled data while retaining proprietary research isolation.'],
        ['Regional topology', 'Choose cloud and regions from entity obligations, data rights, market access and recovery needs. Add cross-region copies and secondary writers only with agreed consistency, fencing and resumption rules.'],
        ['Recovery by domain', 'Source adapters restore checkpoints; streams restore state and replay; warehouses restore snapshots or recompute; external order/cash state is reconciled before affected business activity resumes. RTO/RPO are approved per flow.'],
        ['Change and exit', 'Version contracts, transformations, policies and artefacts. Parallel-run changes, retain corrections and signed-off outputs, and decommission only after consumers accept equivalent results and archive/recovery obligations.'],
      ].map(([name, text]) => <article key={name}><h4>{name}</h4><p>{text}</p></article>)}</div>
      <p className="small">Acceptance measures: <a href="#/lifecycle/metrics">business-wide success measures</a>. Operating ownership: <a href="#/operating/services">service catalogue</a>. Failure response: <a href="#/operating/resilience">recovery playbooks</a>. Detailed team isolation: <a href="#/data/teams">team workspaces</a>.</p>
    </>}

    <details className="blueprint-sources"><summary>Primary technical references · checked 18 Oct 2026</summary><p className="small muted">These references support product capabilities. The blueprint’s preferred combinations and trade-offs are design recommendations; exact editions, regions, integration support and licence rights require diligence.</p><ul>{blueprintSources.map(([name, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{name} ↗</a></li>)}</ul></details>
  </section>
}
