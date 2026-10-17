import { domains } from './systemData.js'

const layers = [
  ['Investment teams', 'PMs, analysts and quantitative researchers', 'Own investment decisions, research context and proposed risk.'],
  ['Research & portfolio construction', 'Point-in-time data → idea / signal → sizing → what-if', 'Shared discovery by default; restricted information and team-confidential work stay walled.'],
  ['Trading & execution', 'PMS → pre-trade controls → OMS → EMS / broker / venue', 'The OMS owns order state; fills are captured once, allocated under policy, and reconciled.'],
  ['Books, risk & control', 'IBOR / P&L · risk · compliance · capital allocation', 'Independent control functions consume the same governed events and challenge breaks.'],
  ['Operations & investors', 'Confirmation → clearing / settlement → cash → NAV → reporting', 'Operations resolve exceptions; the administrator remains an external party and is reconciled.'],
]

const paths = [
  {
    id: 'research', title: 'Research workflow', color: '#2b8a9b',
    steps: [
      ['Discover', 'Approved market, reference, fundamental and alternative data; shared notes and prior work.'],
      ['Form a thesis', 'Discretionary: record catalyst, horizon, invalidation and evidence. Quant: define hypothesis, universe, features and evaluation window.'],
      ['Test point-in-time', 'Version data, code and parameters; include survivorship, corporate actions, borrow, costs, liquidity and capacity.'],
      ['Review & control', 'Peer review; compliance review for data / MNPI; independent model validation where the model is material.'],
      ['Promote gradually', 'Research → paper / shadow → limited production → approved scale, with owner, monitoring and rollback.'],
      ['Learn from trading', 'Compare expected with realised fills, costs, P&L and risk; feed the evidence back into the thesis or model.'],
    ],
    note: 'Discretionary research can feed a PM decision without becoming a production “signal”. Systematic signals require reproducible data and code versions plus a named production owner.',
  },
  {
    id: 'trading', title: 'Trading workflow', color: '#1961ac',
    steps: [
      ['Propose', 'PM turns a view or model target into an order with book, instrument, side, size and rationale.'],
      ['Check before release', 'Validate mandate, restricted / wall-crossed status, limits, ownership, borrow / locate, cash and market-access rules.'],
      ['Stage & execute', 'OMS records order state; trader or strategy selects algo, broker, venue, RFQ or DMA route.'],
      ['Capture & allocate', 'Ingest executions and drop copies; allocate blocks by approved intent and fair-allocation policy.'],
      ['Book & reconcile', 'Update IBOR, cash, P&L and risk; match broker / PB / administrator records; age breaks to named owners.'],
      ['Close & improve', 'Independent valuation, NAV checks, TCA and risk review; feed realised outcomes back to research.'],
    ],
    note: 'The controls are synchronous before market release. Trade capture, booking and reconciliation are durable workflows with explicit replay, exception handling and audit—not fire-and-forget messages.',
  },
]

const choices = [
  ['Buy / configure', 'Core OMS / EMS, fund accounting / administrator services, market and reference data, identity, surveillance, standard factor models.', 'Use where the workflow is common, regulated, or expensive to maintain. Keep exit paths and data access contractual.'],
  ['Build / own', 'Canonical team / book / instrument mappings, research data versions, cross-team analytics, capital allocation logic, event adapters and exception workflows.', 'Own the differentiating integration and control logic. Avoid replacing proven vendor books of record without a specific gap.'],
  ['Integrate / validate', 'Photon, existing risk tools, administrator, prime brokers, market venues and data vendors.', 'Treat vendor capability as a hypothesis until coverage, data rights, latency, audit, recovery and support are tested.'],
]

export default function ArchitectureOverview() {
  return (
    <section className="arch-overview">
      <p className="eyebrow">Architecture brief · reference design</p>
      <h2>A shared platform for independent investment teams</h2>
      <p className="lede">
        This is a proposed target architecture aligned to Verition’s publicly described multi-strategy, collaborative
        model. It is not an inventory of Verition’s current systems. Public facts, design inferences and open decisions
        are separated below so the design can be reviewed without treating assumptions as commitments.
      </p>

      <div className="arch-evidence">
        <article><span className="evidence fact">Publicly stated</span><b>Business context</b><p>Four strategy groups; collaboration across teams; dynamic capital allocation; multi-tier internal and external risk controls; Northern Trust investor portal.</p><a href="https://www.verition.com/" target="_blank" rel="noreferrer">Verition website</a></article>
        <article><span className="evidence inference">Design inference</span><b>Architecture response</b><p>Shared research and data services with precise access walls; common trade / position interfaces; specialist execution and risk paths by asset class.</p><span>Proposed here; validate with stakeholders.</span></article>
        <article><span className="evidence confirm">Confirm internally</span><b>Current estate & constraints</b><p>Existing OMS / EMS / PMS, Photon scope, administrator and PB interfaces, legal-entity perimeter, cloud / residency, latency needs, data rights and operating ownership.</p><a href="#open-questions">See open questions ↓</a></article>
      </div>

      <h3 className="sec-title">Architecture at a glance</h3>
      <p className="muted small">Each investment team uses the same governed core. Asset-class specialists plug into the edges where their workflow requires it.</p>
      <div className="arch-flow">
        {layers.map(([name, users, detail], i) => <article key={name} className="arch-layer" style={{ '--c': Object.values(domains)[i % Object.values(domains).length].color }}>
          <span className="arch-index">0{i + 1}</span><div><h4>{name}</h4><b>{users}</b><p>{detail}</p></div>
        </article>)}
      </div>
      <div className="arch-foundation"><b>Shared foundation under every layer</b><span>Identity & entitlements · instrument / entity master · governed event contracts · analytical lakehouse · audit & observability · resilience & recovery</span></div>

      <h3 className="sec-title">Two connected workflows</h3>
      <div className="workflow-grid">
        {paths.map((path) => <article key={path.id} className="workflow-card" style={{ '--c': path.color }}>
          <h3>{path.title}</h3><ol>{path.steps.map(([title, detail], i) => <li key={title}><span>{i + 1}</span><div><b>{title}</b><p>{detail}</p></div></li>)}</ol><p className="workflow-note">{path.note}</p>
        </article>)}
      </div>

      <h3 className="sec-title">Where to buy, build and integrate</h3>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Approach</th><th>Use it for</th><th>Trade-off / guardrail</th></tr></thead><tbody>
        {choices.map(([approach, use, tradeoff]) => <tr key={approach}><th>{approach}</th><td>{use}</td><td>{tradeoff}</td></tr>)}
      </tbody></table></div>

      <h3 className="sec-title" id="open-questions">Architecture decisions to resolve first</h3>
      <div className="open-decision-grid">
        <article><b>1 · What is already in production?</b><p>Inventory PMS / OMS / EMS, accounting, risk, market data, administrator, PBs, contracts, owners and interfaces. Prefer retain / integrate / replace decisions by capability, not a platform-wide rip-and-replace.</p></article>
        <article><b>2 · What does Photon actually cover?</b><p>Confirm licensed scope, asset-class coverage, data interfaces, latency, source access, support, recovery, roadmap and commercial rights. Keep it a risk consumer until reconciled to the official books and accepted by risk owners.</p></article>
        <article><b>3 · Where are the hard boundaries?</b><p>Agree investment-team confidentiality, MNPI / wall-crossing, fund and entity segregation, licensed data redistribution, regional residency, and who can override each control.</p></article>
        <article><b>4 · Which workflows need special treatment?</b><p>Measure quant order rates and latency; instrument and counterparty mix; financing and collateral; primary-market allocation; NAV timing; external reporting obligations.</p></article>
      </div>
      <p className="arch-next">Use <b>Platform Map</b> for component ownership and interfaces, <b>Data Architecture</b> for datasets and serving paths, <b>Trade Lifecycle</b> for stage-level controls, and <b>Decision Register</b> to record the selected options.</p>
    </section>
  )
}
