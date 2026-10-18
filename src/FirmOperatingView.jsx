import {
  evidenceStates, estateBaseline, teamLifecycle, capitalCycle, decisionRights,
  entityRelationships, failurePlaybooks, costModel, collaborationPolicy,
  serviceCatalogue, operatingScenarios,
} from './firmOperatingModel.js'
import FlowDiagram from './FlowDiagram.jsx'

const statusClass = status => ['Publicly confirmed', 'Internally confirmed'].includes(status) ? 'fact' : status === 'Proposed design' ? 'inference' : 'confirm'
const entityFlow = {
  title: 'Relationships to confirm in the actual structure',
  intro: 'A reference relationship map, not a statement of Verition’s legal or fund structure. Funds, counterparties and service providers must be identified from executed documents.',
  rows: [
    { label: 'Investment ownership', tone: 'data', steps: [{ t: 'Investors / share classes' }, { t: 'Fund structures', d: 'Feeder/master/parallel only where applicable' }, { t: 'Books & team allocations', d: 'Governed investment hierarchy' }] },
    { label: 'Contracts & oversight', tone: 'control', parallel: true, between: 'The relevant fund/legal entity contracts with, or appoints, each provider', steps: [{ t: 'Manager / adviser', d: 'Investment authority & delegation' }, { t: 'PB / custodian / bank / OTC', d: 'Accounts, financing & obligations' }, { t: 'Administrator / TA / auditor', d: 'Books, register & assurance' }] },
  ],
  callout: ['Booking rule', 'Identify the asset-owning fund, contracting legal entity, book, account, agreement and jurisdiction for each activity. Team, fund and manager are distinct concepts.'],
}

function GridTable({ headings, rows }) {
  return <div className="tbl-wrap"><table className="tbl operating-table"><thead><tr>{headings.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(([first, ...rest]) => <tr key={first}><th>{first}</th>{rest.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>
}

export default function FirmOperatingView({ part = 'baseline' }) {
  return <section className="firm-operating">
    <p className="operating-proposal"><b>Proposed operating model.</b> Responsibilities below are reference roles to confirm against actual delegated authority, contracts and policies. The baseline marks the evidence available; no unverified internal setup is presented as confirmed.</p>

    {part === 'baseline' && <>
      <h3 className="sec-title">Actual setup versus proposed design</h3>
      <p className="muted">Establish one evidence-backed inventory before selecting or replacing systems. Record the item, scope, status, owner, dated evidence, review date, dependency and retain/integrate/replace decision. Public facts below were checked against primary sources on 18 Oct 2026.</p>
      <div className="operating-cards">{evidenceStates.map(([name, meaning]) => <article key={name}><span className={'evidence ' + statusClass(name)}>{name}</span><p>{meaning}</p></article>)}</div>
      <div className="operating-baseline">{estateBaseline.map(([area, status, known, owner, evidence, url]) => <article key={area}>
        <header><h4>{area}</h4><span className={'evidence ' + statusClass(status)}>{status}</span></header>
        <p>{known}</p><dl><div><dt>Evidence owner</dt><dd>{owner}</dd></div><div><dt>Next evidence / validation</dt><dd>{evidence}</dd></div></dl>
        {url && <a className="small" href={url} target="_blank" rel="noreferrer">Primary public source ↗</a>}
      </article>)}</div>
      <aside className="flow-callout"><b>Acceptance gate.</b> A proposed design becomes an accepted implementation record only after its owner verifies scope and dated evidence. Use the <a href="#/register">decision register</a> for design choices and outstanding rationale; it is not a substitute for a production inventory or executed contract.</aside>
    </>}

    {part === 'teams' && <>
      <h3 className="sec-title">Investment-team lifecycle</h3>
      <p className="muted">One named onboarding/transition lead coordinates the gates. The CIO owns investment sponsorship; each control owner accepts their own readiness evidence. Repeat the relevant gates when adding a new asset class, market, counterparty or material model.</p>
      <ol className="operating-steps">{teamLifecycle.map(([name, owner, work, gate], i) => <li key={name}><span>{i + 1}</span><div><h4>{name}</h4><p className="small"><b>Accountable role:</b> {owner}</p><p>{work}</p><p className="operating-gate"><b>Exit gate:</b> {gate}</p></div></li>)}</ol>
      <p className="small">Supporting design: <a href="#/data/teams">team workspaces</a>, <a href="#/node/capital">capital allocation</a>, <a href="#/operating/scenarios">worked scenarios</a>.</p>
    </>}

    {part === 'capital' && <>
      <h3 className="sec-title">Capital and risk decisions</h3>
      <p className="muted">Dynamic allocation needs a controlled decision loop from independent evidence to effective limits and verified exposures. Thresholds, stop powers and override authorities must come from approved policy.</p>
      <ol className="operating-steps">{capitalCycle.map(([name, text], i) => <li key={name}><span>{i + 1}</span><div><h4>{name}</h4><p>{text}</p></div></li>)}</ol>
      <h3 className="sec-title">Proposed decision-rights matrix</h3>
      <GridTable headings={['Decision', 'Accountable authority', 'Contributors / boundary', 'Required evidence']} rows={decisionRights} />
      <p className="small">See <a href="#/lifecycle/metrics">business-wide success measures</a> and <a href="#/org/forums">governance forums</a> for review and escalation.</p>
    </>}

    {part === 'entities' && <>
      <FlowDiagram flow={entityFlow} />
      <GridTable headings={['Relationship', 'What to establish', 'Proposed owner', 'Evidence']} rows={entityRelationships} />
      <aside className="flow-callout"><b>Minimum relationship record.</b> Stable IDs, legal names, relationship type, fund/entity/account scope, effective and recorded dates, agreement/version, owner, jurisdiction, evidence location and approval state. Netting, asset segregation and cross-border permissions require review of the actual agreements.</aside>
    </>}

    {part === 'resilience' && <>
      <h3 className="sec-title">Failure and recovery playbooks</h3>
      <p className="muted">For every critical flow, agree maximum tolerable business disruption, recovery time objective (RTO), recovery point objective (RPO), cut-offs, dependencies, fallback authority and regional support. Set values from measured business impact; no numeric objective is implied here.</p>
      <div className="operating-baseline">{failurePlaybooks.map(x => <article key={x.name}><h4>{x.name}</h4><dl><div><dt>Trigger / scope</dt><dd>{x.trigger}</dd></div><div><dt>Safe operating state</dt><dd>{x.safe}</dd></div><div><dt>Accountability</dt><dd>{x.owner}</dd></div><div><dt>Recovery & acceptance</dt><dd>{x.recovery}</dd></div></dl></article>)}</div>
      <aside className="flow-callout"><b>Exercise and evidence.</b> Rehearse each playbook using representative external order/cash states, interrupted delivery and restored data. Record actual recovery time, actual loss/duplication window, approvals and open actions. A technology restart alone does not establish business recovery.</aside>
    </>}

    {part === 'economics' && <>
      <h3 className="sec-title">Economics and cost allocation</h3>
      <p className="muted">Build an evidence-backed cost model by capability, team, fund and provider. Distinguish actual cash spend, allocated shared cost and marginal cost of growth; show assumptions explicitly.</p>
      <GridTable headings={['Cost area', 'Capture at this grain', 'Recommended treatment / decision', 'Owner']} rows={costModel} />
      <div className="operating-cards">{[
        ['Showback', 'Publish usage and costs without charging teams directly. Good for exposing waste and establishing a baseline; central budgets still need ownership.'],
        ['Chargeback', 'Allocate permitted shared costs using agreed usage or capacity drivers. Clear accountability, but more measurement disputes and risk of bypassing common services.'],
        ['Hybrid recommendation', 'Assign directly attributable usage to the sponsor, keep mandatory common controls centrally funded where appropriate, and apply approved shared drivers only where contracts permit.'],
      ].map(([name, text]) => <article key={name}><h4>{name}</h4><p>{text}</p></article>)}</div>
      <p className="small"><b>Useful outputs:</b> cost per active team/data product/research workload; budget versus actual; duplicate licence spend; idle compute; financing cost by PB; cost and capacity of onboarding the next team. CFO approves the allocation policy and contractual treatment.</p>
    </>}

    {part === 'collaboration' && <>
      <h3 className="sec-title">Collaboration, confidentiality and attribution</h3>
      <p className="muted">Verition publicly describes collaboration across investment teams. This proposed design supports it through shared entitled data and controlled, explicit sharing of proprietary research. Internal sharing, attribution and compensation rules still need owner approval.</p>
      <GridTable headings={['Information area', 'Proposed operating rule', 'Accountable owner']} rows={collaborationPolicy} />
      <p className="small">Require a sharing record with originator, object/version, recipient scope, permitted use, licence/restriction checks and expiry/review. Revoke or re-evaluate access when people, deals or vendor rights change. See <a href="#/data/teams">team workspaces</a> and <a href="#/ai/guardrails">AI access guardrails</a>.</p>
      <a className="small" href="https://www.verition.com/investment-philosophy" target="_blank" rel="noreferrer">Published investment philosophy ↗</a>
    </>}

    {part === 'services' && <>
      <h3 className="sec-title">Service catalogue and support</h3>
      <p className="muted">Every service needs a business owner, delivery owner, operational support route and consumer agreement. Regional coverage follows the supported market hours and cut-offs; assign handover acceptance explicitly.</p>
      <div className="operating-baseline">{serviceCatalogue.map(([name, owner, promise, accept, link]) => <article key={name}><h4><a href={link}>{name} →</a></h4><dl><div><dt>Accountability</dt><dd>{owner}</dd></div><div><dt>Service promise</dt><dd>{promise}</dd></div><div><dt>Consumer agreement</dt><dd>{accept}</dd></div></dl></article>)}</div>
      <aside className="flow-callout"><b>Minimum service record.</b> Consumers, contract, supported region/hours, expected population, cut-off, approved SLO/error budget, escalation contacts, L1/L2/L3 split, dependencies, change/maintenance policy, recovery runbook, cost owner and review date. Severity follows business impact, not only a technical alert level.</aside>
      <p className="small"><b>Regional handover:</b> outgoing owner transfers live orders, data gaps, aged breaks, payments and imminent cut-offs; incoming owner acknowledges receipt. Material incidents have one named incident commander across regions.</p>
    </>}

    {part === 'scenarios' && <>
      <h3 className="sec-title">Worked examples across the firm</h3>
      <p className="muted">Reference walkthroughs to review with investment, control, operations and technology owners. They describe proposed hand-offs and evidence, not historical Verition events.</p>
      {operatingScenarios.map(x => <article className="operating-scenario" key={x.name}><h4>{x.name}</h4><p><b>Successful end state:</b> {x.outcome}</p><ol className="operating-steps">{x.stages.map(([name, text], i) => <li key={name}><span>{i + 1}</span><div><h5>{name}</h5><p>{text}</p></div></li>)}</ol><p className="operating-gate"><b>Evidence pack:</b> {x.evidence}</p><div className="chip-row">{x.links.map(([href, label]) => <a className="node-chip" href={href} key={href}>{label} →</a>)}</div></article>)}
    </>}
  </section>
}
