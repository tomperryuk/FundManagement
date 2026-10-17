import { useMemo, useState } from 'react'

const terms = [
  // Research & data
  ['Research & data', 'Alternative data', 'Non-traditional datasets (for example, web activity, transactions or geolocation) used alongside conventional market and company data. Use requires documented licensing, permitted purpose, privacy review and point-in-time controls.'],
  ['Research & data', 'Backtest', 'A historical simulation of a strategy using past data. A credible backtest accounts for costs, liquidity, timing, universe changes and biases; it does not establish future performance.'],
  ['Research & data', 'Data lineage', 'The traceable path from a source through transformations and versions to the research, signal, report or decision that consumed it.'],
  ['Research & data', 'Data vintage', 'The exact version of a dataset that was available at a particular historical time, including later corrections where relevant. It helps reproduce what a researcher or model could actually have known.'],
  ['Research & data', 'Entitlement', 'A permission to access or use a dataset, based on its licence, user, team, purpose, geography or redistribution rules. Technical access alone does not grant legal usage rights.'],
  ['Research & data', 'Feature', 'A model input derived from raw data, such as a return, spread, estimate revision or activity measure. Features need definitions, timestamps, versions and quality checks.'],
  ['Research & data', 'Hypothesis', 'A testable investment explanation for why an asset may be mispriced, what could change that view, and what evidence would invalidate it.'],
  ['Research & data', 'Look-ahead bias', 'A research error where a test uses information before it would have been available in real time, making historical results appear better than an implementable strategy.'],
  ['Research & data', 'MNPI', 'Material non-public information. Information controls restrict who can access or trade affected securities, issuers or deals, according to compliance policy.'],
  ['Research & data', 'Point-in-time data', 'Data preserved as it was known at a historical decision time, rather than silently replaced by corrected or subsequently published values.'],
  ['Research & data', 'Provenance', 'Evidence of where data or an analytical result came from, how it was produced, and which versions, transformations and approvals were involved.'],
  ['Research & data', 'Research reproducibility', 'The ability to recreate an analysis or signal from its recorded code, parameters, environment, data vintages and instrument universe.'],
  ['Research & data', 'Signal', 'A versioned analytical output that expresses an investment view or desired position change. A signal is an input to investment decisions, not automatically an order.'],
  ['Research & data', 'Survivorship bias', 'A research error caused by testing only entities that still exist, omitting delisted, failed or otherwise removed names from the historical universe.'],
  ['Research & data', 'Wall crossing', 'A controlled process where a person receives confidential deal information. The issuer or deal is restricted for affected people under compliance rules until formally cleared.'],
  // Portfolio construction & risk
  ['Portfolio & risk', 'Capital allocation', 'The approved capital or risk budget assigned to a strategy, team or fund. It should be versioned and reflected consistently in sizing, limits and reporting.'],
  ['Portfolio & risk', 'CS01', 'Approximate change in a credit position’s value for a one basis point change in credit spread, subject to the model and instrument conventions used.'],
  ['Portfolio & risk', 'Drawdown', 'A decline from a portfolio’s prior peak value over a stated period. Definitions must specify valuation frequency, peak method and whether the measure is gross or net.'],
  ['Portfolio & risk', 'DV01', 'Approximate change in a rates position’s value for a one basis point move in yield, using the applicable pricing model and curve conventions.'],
  ['Portfolio & risk', 'Factor exposure', 'A portfolio’s estimated sensitivity to a systematic driver such as market, sector, size, value, rates or volatility. It depends on the chosen risk model.'],
  ['Portfolio & risk', 'Locate', 'Confirmation that borrow is available or can be arranged for a proposed short sale, under the relevant broker and market rules. Availability can change before execution.'],
  ['Portfolio & risk', 'Mandate', 'The approved strategy scope: permitted instruments, markets, concentration, leverage, liquidity and other investment or regulatory constraints.'],
  ['Portfolio & risk', 'Portfolio construction', 'The process of translating investment views into positions while considering risk, expected costs, liquidity, capital, constraints and interactions across holdings.'],
  ['Portfolio & risk', 'Risk limit', 'An approved boundary on a risk measure or activity. A limit needs a defined calculation, scope, owner, breach action, override policy and escalation route.'],
  ['Portfolio & risk', 'Scenario analysis', 'Estimated portfolio impact under a specified market move or hypothetical event. Scenarios complement statistical measures and do not predict exact losses.'],
  ['Portfolio & risk', 'Value at Risk (VaR)', 'A model-based estimate of potential loss over a defined horizon and confidence level, under stated assumptions. It is not a maximum-loss estimate.'],
  ['Portfolio & risk', 'What-if risk', 'A pre-trade estimate of how a proposed order or position change could affect exposures, limits and portfolio risk, using identified position and market-data snapshots.'],
  // Trading & execution
  ['Trading & execution', 'Algo wheel', 'A governed method for routing eligible orders among brokers or execution algorithms using configured rules, performance evidence and trader oversight.'],
  ['Trading & execution', 'Best execution', 'The obligation and process to seek an appropriate execution outcome under applicable policy and rules, considering factors such as price, cost, speed and likelihood of execution.'],
  ['Trading & execution', 'Child order', 'A smaller executable order created from a larger parent order, often routed to a broker, venue or algorithm. Its fills and state must reconcile to the parent.'],
  ['Trading & execution', 'DMA', 'Direct Market Access: electronic access that lets an authorised user or system submit orders to a venue through a broker or sponsored access arrangement, subject to market-access controls.'],
  ['Trading & execution', 'Drop copy', 'A separate execution-report feed used to independently capture orders and fills, often from a broker or venue, for monitoring and reconciliation.'],
  ['Trading & execution', 'EMS', 'Execution Management System: trader-facing tools for working orders, selecting routes or algorithms, monitoring fills and communicating with brokers or venues.'],
  ['Trading & execution', 'Execution report', 'A message describing an order event such as acknowledgement, fill, cancel, reject or correction. It should be correlated to the relevant order and version.'],
  ['Trading & execution', 'FIX', 'Financial Information eXchange protocol, commonly used to exchange electronic orders and execution messages between trading systems and counterparties.'],
  ['Trading & execution', 'Fill', 'An execution of some or all of an order. A partially filled order can remain open; fills must be represented once in downstream positions and accounting.'],
  ['Trading & execution', 'Implementation shortfall', 'A measure comparing the realised cost or proceeds of execution with a defined decision or arrival-price benchmark. Benchmark, fees and opportunity cost treatment must be explicit.'],
  ['Trading & execution', 'Market impact', 'The price movement attributable to an order’s interaction with available liquidity. Estimates are uncertain and depend on the benchmark and measurement window.'],
  ['Trading & execution', 'OMS', 'Order Management System: records investment orders, their controls, allocations and lifecycle states, and coordinates with execution systems.'],
  ['Trading & execution', 'Parent order / block', 'The investment order representing the desired trade before it is split into child orders or executions. It preserves investment intent across executions.'],
  ['Trading & execution', 'Partial fill', 'An execution for less than the remaining order quantity. The unfilled balance remains subject to the order’s instructions and may be amended or cancelled.'],
  ['Trading & execution', 'RFQ', 'Request for Quote: a process that solicits prices from selected dealers for an instrument or size, commonly used for bonds and OTC products. Quotes and selection rationale may be retained for review.'],
  ['Trading & execution', 'TCA', 'Transaction Cost Analysis: analysis of execution outcomes, costs and trading behavior against chosen benchmarks, segmented where useful by strategy, instrument, broker and market condition.'],
  // Post-trade & operations
  ['Post-trade & operations', 'Affirmation', 'Confirmation by the relevant parties that trade and allocation details are matched and ready for settlement processing. Timing depends on market and instrument cut-offs.'],
  ['Post-trade & operations', 'Allocation', 'Assignment of executed quantities, prices, fees and other economics to funds, books or accounts under approved intent and fair-allocation policy.'],
  ['Post-trade & operations', 'Average price allocation', 'Distribution of a block’s average execution price across accounts, with commissions, fees, rounding and partial-fill treatment applied under policy.'],
  ['Post-trade & operations', 'CCP', 'Central Counterparty: a clearing house that interposes itself between counterparties for eligible trades and manages margin and default processes.'],
  ['Post-trade & operations', 'Clearing / give-up', 'Clearing submits eligible trades to a clearing broker or CCP. A give-up transfers a trade executed through one broker to another broker for clearing under agreed arrangements.'],
  ['Post-trade & operations', 'Collateral', 'Cash or securities pledged or received to secure obligations, including margin. Eligibility, valuation, haircuts, disputes and movements need controls.'],
  ['Post-trade & operations', 'Confirmation', 'The agreed record of trade economics between counterparties. It may be electronic or bilateral and is distinct from settlement completion.'],
  ['Post-trade & operations', 'Corporate action', 'An issuer event that may change securities, entitlements, cash or elections, such as a dividend, merger, split, tender or conversion.'],
  ['Post-trade & operations', 'CTM', 'Central Trade Manager, a DTCC service used by market participants to match and affirm eligible institutional equity and fixed-income trades. Coverage varies by product and workflow.'],
  ['Post-trade & operations', 'IBOR', 'Investment Book of Record: the operational position and cash view used to support investment and risk workflows. It should reconcile to executions and downstream books.'],
  ['Post-trade & operations', 'Margin call', 'A demand to post or return collateral following exposure or valuation changes under a clearing, prime brokerage or bilateral agreement.'],
  ['Post-trade & operations', 'NAV', 'Net Asset Value: fund assets less liabilities at a defined valuation point, calculated under the fund’s accounting and valuation policies.'],
  ['Post-trade & operations', 'Prime broker (PB)', 'A broker providing services such as custody, financing, securities lending, clearing and reporting to investment firms. Scope and records vary by agreement.'],
  ['Post-trade & operations', 'Reconciliation break', 'A difference between records expected to agree, such as internal trades versus broker records. It needs classification, materiality, owner, cause and resolution evidence.'],
  ['Post-trade & operations', 'Settlement', 'Exchange of securities and cash to complete a trade under market-specific rules and timing. A trade can be affirmed but still fail to settle.'],
  ['Post-trade & operations', 'Shadow NAV', 'An independently calculated or internally produced NAV used to challenge, compare or reconcile with an administrator’s NAV. Differences require policy-based investigation.'],
  ['Post-trade & operations', 'SSI', 'Standing Settlement Instruction: verified settlement details for a counterparty, account or instrument. Changes require controlled authentication and approval.'],
  ['Post-trade & operations', 'T+1 / T+2', 'Settlement one or two business days after trade date, respectively, according to the applicable market calendar and product rules. Holidays and exceptions matter.'],
  // Controls, measures & technology
  ['Controls & technology', 'Acceptance criteria', 'Observable conditions a business owner agrees must be met before a delivered capability is accepted for its intended workflow.'],
  ['Controls & technology', 'Change failure rate', 'The proportion of production changes that cause an incident, rollback, hotfix or other defined failure. Define the denominator and failure window consistently.'],
  ['Controls & technology', 'Completeness', 'The proportion of expected records, events or fields received and validated for a defined population and cut-off. The expected population must be known.'],
  ['Controls & technology', 'Cut-off', 'A time by which a business or market process must reach a required state, such as affirmation, settlement instruction, valuation or reporting.'],
  ['Controls & technology', 'End-to-end latency', 'Elapsed time across a complete business flow, measured from defined start and end events using correlated timestamps. Report percentiles and exclusions, not only an average.'],
  ['Controls & technology', 'Freshness', 'How current data is relative to when it was expected or needed. Measure against the source schedule and consumer cut-off, not only the time a pipeline ran.'],
  ['Controls & technology', 'Idempotency', 'A property that makes repeated processing of the same request or event safe, preventing duplicate business effects after retries or recovery.'],
  ['Controls & technology', 'Lineage', 'See “Data lineage”: the recorded path connecting data sources, transformations, versions and downstream use.'],
  ['Controls & technology', 'p95 / p99 latency', 'The elapsed time at or below which 95% or 99% of measured requests completed in the stated window. Define population, measurement points and failed requests.'],
  ['Controls & technology', 'Replay', 'Reprocessing retained events or inputs to recover state or reproduce a result. Replay needs ordering, version and duplicate-protection rules.'],
  ['Controls & technology', 'SLA / SLO', 'A Service Level Agreement is a formal service commitment; a Service Level Objective is an internal reliability or performance target. A metric alone is not an SLA.'],
  ['Controls & technology', 'Terminal state', 'A defined final or safely held status for a business object, such as approved, rejected, filled, cancelled, settled, signed off or an owned exception.'],
  ['Controls & technology', 'Throughput', 'The volume of requests, records, events or orders processed per unit of time, measured with latency, completeness and failure rates to avoid rewarding volume alone.'],
]

const categories = ['All areas', ...new Set(terms.map(([category]) => category))]

export default function Glossary() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All areas')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return terms.filter(([area, name, definition]) =>
      (category === 'All areas' || area === category) &&
      (!q || `${area} ${name} ${definition}`.toLowerCase().includes(q)))
  }, [query, category])

  return <section className="glossary">
    <p className="eyebrow">Reference · research, trading & operations</p>
    <h3 className="sec-title">Key terms in context</h3>
    <p className="muted">Definitions reflect how the terms are used in this blueprint. Policies, market conventions and provider capabilities can vary; validate operational meanings with the relevant owner.</p>
    <div className="glossary-controls">
      <label>Search terms<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="For example: locate, point-in-time, settlement" /></label>
      <label>Area<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(x => <option key={x}>{x}</option>)}</select></label>
      <p aria-live="polite">{filtered.length} of {terms.length} terms</p>
    </div>
    {filtered.length ? <div className="glossary-grid">{filtered.map(([area, term, definition]) => <article className="glossary-entry" key={area + term}>
      <p>{area}</p><h4>{term}</h4><div>{definition}</div>
    </article>)}</div> : <p className="glossary-empty">No terms match that search. Try a shorter word or choose “All areas”.</p>}
  </section>
}
