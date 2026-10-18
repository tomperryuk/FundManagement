// Reference processes and proposed responsibilities. No row asserts an internally
// confirmed Verition implementation without named evidence and owner acceptance.
export const evidenceStates = [
  ['Publicly confirmed', 'A dated primary source supports the statement; it does not establish internal implementation.'],
  ['Internally confirmed', 'A named business/system owner has accepted a dated record, contract or control artefact. No new internal confirmations are asserted on this page.'],
  ['Proposed design', 'A recommended process, responsibility or technology choice that needs owner acceptance.'],
  ['Needs validation', 'An important unknown with a proposed evidence owner; it must be resolved before the dependent delivery gate.'],
]

export const estateBaseline = [
  ['Investment structure', 'Publicly confirmed', 'Four published strategy groups and a multi-manager model.', 'CIO office', 'Validate internal team roster, mandates, books and capital authority.', 'https://www.verition.com/'],
  ['Collaboration and capital', 'Publicly confirmed', 'Published collaboration, dynamic capital allocation and internal/external risk controls.', 'CIO / CRO', 'Validate operating rules, decision authorities and control evidence.', 'https://www.verition.com/investment-philosophy'],
  ['PMS / OMS / EMS', 'Needs validation', 'This blueprint does not yet record an owner-verified inventory of installed products or supported versions.', 'Head of Trading / CTO', 'Product, version, scope, owner, vendor support, API/export rights and dependency inventory.'],
  ['Risk engines / Photon', 'Needs validation', 'Photon is a reported licence in this blueprint; exact product, coverage and interfaces remain unconfirmed.', 'CRO / Risk Technology', 'Executed licence, implementation architecture, asset coverage and independent comparison results.'],
  ['Administrator / transfer agent', 'Needs validation', 'A public Northern Trust portal link does not establish contracted accounting, NAV or transfer-agent responsibilities.', 'COO / CFO', 'Service agreements by fund/entity, authoritative books, data delivery, sign-off and service responsibilities.'],
  ['PBs / custodians / banks', 'Needs validation', 'Actual counterparties, legal agreements, accounts and connectivity are to be inventoried.', 'Treasury / COO', 'Account-to-fund mappings, financing terms, statement formats, cut-offs and verified instructions.'],
  ['Data / cloud / research estate', 'Needs validation', 'This blueprint proposes technologies and providers; existing contracts, hosting and usage rights need confirmation.', 'CDO / CTO', 'Licence inventory, production deployments, regional restrictions, consumption/cost baseline and support ownership.'],
  ['Controls / resilience / economics', 'Needs validation', 'Service objectives, approval rules, recovery tolerances and expense/payout rules are design proposals.', 'COO / CFO / CRO / CCO', 'Accepted policies, measured baselines, incident/recovery evidence and applicable fund/team contracts.'],
]

export const teamLifecycle = [
  ['Assess & sponsor', 'CIO / strategy head', 'Investment thesis, track record, capacity, risk fit and expected platform requirements.', 'Sponsor accepts a mandate hypothesis; CRO challenges risk, COO estimates operating needs, CFO sizes costs.'],
  ['Prepare the team', 'COO / onboarding lead', 'Approved people, fund/book/account structure, data rights, access, broker links and support plan.', 'Mandate, limits, capital, entitlements and operational owners are recorded; each setup task has an approver.'],
  ['Prove readiness', 'Head of Trading / COO', 'Representative trades through checks, execution, booking, reconciliation, cash and reporting; research evidence and model approvals where needed.', 'PM, Trading, Operations, Risk and Compliance accept the workflow; failures and exceptions have been exercised.'],
  ['Ramp under limits', 'CIO / PM; CRO independently monitors', 'Versioned capital allocation, bounded activity and live performance/cost/risk evidence.', 'Capital step-ups require agreed evidence on execution, capacity, exposures and operational completion; no automatic scale-up from backtest returns.'],
  ['Operate & review', 'Strategy head / PM', 'Daily positions, risk, cash, borrow, control exceptions and performance; periodic capital/capacity review.', 'Services meet approved objectives; restrictions, stale inputs and unresolved breaks are visible to decision makers.'],
  ['Reduce / suspend / transfer', 'CIO and CRO within approved authority; Trading executes', 'Capital/limit change, reduction instructions, hedge/borrow/financing impact and exception plan.', 'Systems acknowledge the correct allocation/limit version; open orders and positions are reconciled before further action.'],
  ['Wind down & close', 'COO / named transition owner', 'Approved liquidation or transfer, residual exposure, financing/cash cleanup, records retention and access removal.', 'Positions and obligations are closed or assigned to an accepting owner; Finance signs off accounting/payouts and controlled access is revoked.'],
]

export const capitalCycle = [
  ['Observe', 'CRO, Finance and PM supply independently traceable risk, performance, capital usage, liquidity and capacity evidence. Flag stale or incomplete inputs.'],
  ['Assess portfolio fit', 'CIO considers incremental return/risk, correlation and crowding across teams, stress concentration, financing and operational capacity. Record dissent and uncertainty.'],
  ['Decide & approve', 'Apply delegated authority for increases, reductions, pauses and exceptions. Record team/fund scope, effective time, rationale, approvers and expiry/review date.'],
  ['Propagate', 'Publish the versioned capital decision to portfolio sizing, risk limits, compliance and execution controls. Require acknowledgements and an escalation path for stale local copies.'],
  ['Execute changes', 'PM/Trading manage reduction or redeployment while Treasury/Operations check cash, borrow, margin and settlement effects. Monitor open orders as well as filled positions.'],
  ['Verify & learn', 'Reconcile intended and effective limits, capital and exposures. Compare realised effects to the decision and feed results into the next committee review.'],
]

export const decisionRights = [
  ['Investment sizing / capital', 'CIO / delegated investment authority', 'PM proposes; CRO challenges risk and may act within approved stop/limit authority.', 'Decision, scope, effective time and downstream acknowledgements.'],
  ['Risk limits / breach response', 'CRO under approved risk policy', 'Investment teams and Trading act on instructions; exceptions require the documented approval route.', 'Breach evidence, instruction, approval, expiry and post-action verification.'],
  ['Compliance restriction / release', 'CCO / delegated Compliance authority', 'Technical operators apply policy; investment seniority does not itself permit a control bypass.', 'Restriction and release provenance, audience, effective time and check history.'],
  ['Order handling / market release', 'Head of Trading / authorised trader', 'PM supplies intent; Operations and Technology provide state and service evidence.', 'Order state, checks, execution instructions and venue/broker acknowledgements.'],
  ['NAV / valuation approval', 'CFO / Valuation Committee', 'PM marks may be inputs; Finance retains independent challenge and sign-off.', 'Source hierarchy, overrides, material differences and signed-off valuation pack.'],
]

export const entityRelationships = [
  ['Investor ↔ fund/share class', 'Ownership, dealing rights, fee terms and capital activity; feeder structures only where applicable.', 'Investor Services / appointed TA', 'Fund documents, register and share reconciliation.'],
  ['Manager/adviser ↔ fund', 'Investment-management authority, delegation and service contracts; manager entity differs from the asset-owning fund.', 'Legal / COO', 'Executed agreements and approved legal structure.'],
  ['Fund ↔ strategy/team/book', 'Approved investment allocation and booking scope with effective dates; a team is not itself a legal entity.', 'CIO office / CFO', 'Fund/book hierarchy, mandate and allocation records.'],
  ['Fund/legal entity ↔ counterparty account', 'PB, custody, clearing, bank and OTC agreements; cash/collateral and netting boundaries follow the legal documents.', 'Treasury / Legal / Operations', 'Account master, ISDA/CSA/PB agreements and verified SSIs.'],
  ['Fund ↔ administrator/TA/auditor', 'Accounting, register, NAV, reporting and assurance responsibilities by appointment.', 'COO / CFO', 'Service scope, sign-off matrix and agreed delivery interfaces.'],
  ['Person/service ↔ jurisdiction/data rights', 'Who can operate, approve and consume data from each location; assess applicable entity obligations and contracted restrictions.', 'CCO / Legal / CDO', 'Entity/regulatory inventory, approved access policy and vendor licence terms.'],
]

export const failurePlaybooks = [
  { name: 'Stale or missing market/reference data', trigger: 'Expected delivery or quality threshold missed; consumers identify affected instruments and decisions.', safe: 'Mark affected products stale, quarantine invalid updates and pause dependent signals or new orders under approved policy. Use a pre-approved fallback only when its coverage and valuation basis are valid.', owner: 'Data product owner restores delivery; Trading / CRO / CCO / Finance decide business restrictions within their domains.', recovery: 'Reconcile expected population and vintages, replay corrections idempotently, recompute affected risk/marks and notify downstream owners before release.' },
  { name: 'Risk unavailable or inconsistent', trigger: 'Freshness, position coverage or independent comparison fails.', safe: 'Show last-known as-of and missing scope. Restrict risk-increasing activity under policy; use validated local controls and only pre-authorised reduction/manual procedures.', owner: 'CRO owns risk acceptance; Risk Technology restores service; Trading implements activity restrictions.', recovery: 'Rebuild the correct position/input/model snapshot, resolve material differences, confirm limit version and obtain risk-owner resumption approval.' },
  { name: 'Broker / venue connection loss', trigger: 'Session disconnect, missing acknowledgements or order-state divergence.', safe: 'Treat uncertain live orders as live until reconciled. Reconnect, query status and use broker cancellation procedures; validate state before rerouting so a replacement does not duplicate exposure.', owner: 'Head of Trading owns order actions; Trading Support / connectivity owner restore the session.', recovery: 'Reconcile open orders, fills, corrections and sequence gaps with broker/drop copy; prove downstream position completeness before normal routing resumes.' },
  { name: 'Payment / settlement failure', trigger: 'Rejected instruction, missing acknowledgement, cash deficit or market cut-off at risk.', safe: 'Hold suspect instructions; independently verify changes, reserve cash and escalate deadlines. Avoid duplicate payment retries until external status is known.', owner: 'Treasury / Settlement Operations; CFO / COO for material exposure and cut-off decisions.', recovery: 'Obtain bank/custodian status, correct through maker-checker approval, reconcile actual cash and settlement, and retain external acknowledgements.' },
  { name: 'Regional / major service outage', trigger: 'Critical dependency or region fails; business-impact threshold triggers incident command.', safe: 'Activate a named incident commander and regional handover. Fence failed writers, protect keys/access and restrict affected activity while authorised staff use documented continuity procedures.', owner: 'COO coordinates business continuity; CTO restores technology; process/control owners accept resumption.', recovery: 'Restore in dependency order, establish one active writer, verify data-loss window and external order/cash states, replay/reconcile and obtain business sign-off.' },
]

export const costModel = [
  ['Market / alternative data', 'Dataset, entitled user/team, usage and licence restrictions.', 'Assign direct subscriptions to the sponsor; distribute shared licences by agreed driver. Revisit low-use and overlapping feeds.', 'CDO + Finance'],
  ['Compute / storage / networking', 'Cloud account, warehouse, workspace, job, storage tier and egress.', 'Tag at source; show unit cost per useful workload and unused capacity. Track shared foundations separately from team marginal usage.', 'CTO + platform owners'],
  ['Execution / financing / borrow', 'Order/fill, instrument, counterparty, account and fund/book.', 'Attribute actual fees and financing to the responsible books; compare contractual rates and execution quality before optimising cost.', 'Trading + Treasury'],
  ['Shared technology / operations', 'Product/service capacity, support demand and agreed allocation driver.', 'Compare central shared service, chargeback and showback approaches; avoid false precision or incentives to bypass required controls.', 'COO / CTO + CFO'],
  ['Investor expenses / team payouts', 'Applicable fund documents, service contracts, compensation terms and official books.', 'Model only permitted charges and contracted payout/netting/deferral rules. Do not infer a pass-through expense model for Verition.', 'CFO / Legal / CIO'],
]

export const collaborationPolicy = [
  ['Reusable licensed data', 'Share conformed products with every entitled team; enforce licence, purpose and geography at source, query, service and export.', 'CDO / data product owner; Legal and CCO approve rights.'],
  ['Proprietary team research', 'Keep private in the team workspace. Share a thesis, derived feature or model explicitly through an approved workflow with provenance and originator attribution.', 'Strategy head / PM; research product owner operates the workflow.'],
  ['Deals / MNPI / restricted issuers', 'Apply person, issuer, deal and team walls. Record crossings and cleansing, and propagate policy to search, notebooks, AI retrieval and trading checks.', 'CCO / Compliance.'],
  ['Central oversight', 'Give authorised Risk, Finance, Compliance and capital decision makers the information necessary for their duties, with audited scope and purpose.', 'CRO / CFO / CCO / CIO under approved access policy.'],
  ['Attribution / incentives', 'Link shared ideas to their originators and downstream use; agree credit, expense sharing and compensation treatment before relying on it in payouts.', 'CIO / strategy heads with CFO and Legal.'],
]

export const serviceCatalogue = [
  ['Research workspace', 'Research product owner / CTO', 'Provision entitled datasets, private workspace, versioned experiments and support.', 'Sponsor, isolation, compute budget, model-promotion route and restoration evidence.', '#/data/teams'],
  ['Trusted data product', 'Business data owner + CDO; named delivery owner', 'Publish a defined population with quality, freshness, lineage and approved access.', 'Contract, calendar/cut-off, issue priority, consumer acceptance and correction/replay route.', '#/data-blueprint/components'],
  ['Trading & connectivity', 'Head of Trading; trading technology service owner', 'Support controlled order state, execution interfaces and reconciliation.', 'Market-hours coverage, broker escalation, uncertainty handling and order-state recovery.', '#/lifecycle/stages'],
  ['Risk & capital', 'CRO / CIO; risk/capital service owners', 'Publish approved risk views and versioned capital/limit changes with freshness/completeness.', 'Model scope, independent checks, local limit acknowledgements and breach runbooks.', '#/fit/risk'],
  ['Operations & treasury', 'COO / Treasurer; process owners', 'Complete allocation, confirmation, settlement, margin and cash obligations.', 'Counterparty cut-offs, daily queue ownership, regional handover and signed-off exceptions.', '#/treasury/cycle'],
  ['Finance & reporting', 'CFO / CCO; accounting/reporting owners', 'Deliver approved marks, NAV, investor outputs and regulatory evidence.', 'Period close, materiality, independent challenge, submission acknowledgements and correction procedures.', '#/datasets/gl'],
]

export const operatingScenarios = [
  { name: 'Onboard a new equity PM', outcome: 'First controlled trade and end-of-day reconciliation accepted before scaling.', stages: [
    ['Sponsor and assess', 'CIO records investment fit, intended capacity and mandate; CRO challenges factor, concentration, liquidity and downside assumptions.'],
    ['Prepare access and structure', 'COO creates approved fund/book/account mappings; CDO provisions licensed data; IAM isolates research and applies relevant information walls.'],
    ['Prove the vertical slice', 'Trading tests locates, ownership/mandate checks, order execution and allocations; Operations checks PB matching, settlement and borrow; Finance checks booking/valuation.'],
    ['Approve limited ramp', 'PM, Trading, COO, CRO and CCO accept readiness within policy; CIO approves versioned capital and the next review gate.'],
  ], evidence: 'Readiness pack links mandate, data/access approvals, risk controls, representative order/fill/position IDs, reconciliation and service owners.', links: [['#/workflows/research', 'Research workflow'], ['#/data/teams', 'Team workspace'], ['#/lifecycle/stages', 'Trade stages']] },
  { name: 'Reduce capital after a drawdown', outcome: 'Approved reduced risk/capital is effective, acknowledged and reconciled across decision and execution systems.', stages: [
    ['Validate the trigger', 'CRO and Finance confirm drawdown definition, P&L inputs, valuation time and material differences; PM explains position and liquidity context.'],
    ['Approve the action', 'CIO/CRO act within delegated authority; record reduction, constraints, review time, temporary exceptions and PM/Trading responsibilities.'],
    ['Apply and execute', 'Capital service publishes the new version; risk/compliance/execution acknowledge it. Trading reconciles open orders and stages reductions; Treasury checks margin/borrow/cash effects.'],
    ['Verify the end state', 'Risk validates actual exposure and limit headroom; Operations reconciles fills, positions and settlement; Finance records costs and revised performance.'],
  ], evidence: 'One decision ID connects input snapshots, approvals, limit-version acknowledgements, reduction orders, resulting exposure and unresolved exceptions.', links: [['#/node/capital', 'Capital Allocation'], ['#/treasury/liquidity', 'Liquidity & financing'], ['#/lifecycle/metrics', 'Success measures']] },
  { name: 'Recover from a major data / trading outage', outcome: 'Controlled resumption with reconciled external orders, positions and cash, and a documented data-loss window.', stages: [
    ['Detect and bound impact', 'Service owner identifies affected sources, instruments, teams and cut-offs; incident commander assigns business and technical owners.'],
    ['Establish a safe state', 'Trading/Control owners restrict affected activity; preserve uncertain live orders and last-known snapshots; Treasury protects pending payments and deadlines.'],
    ['Restore and reconcile', 'Technology restores dependencies in order with a single active writer; teams replay inputs safely and compare broker, IBOR, custodian and bank records.'],
    ['Accept resumption and learn', 'Relevant business/control owners approve restart from evidence; publish residual exceptions and root-cause actions with owners and dates.'],
  ], evidence: 'Incident timeline, affected obligations, safe-state decisions, restoration checkpoints, replay/reconciliation results, resumption approvals and corrective actions.', links: [['#/operating/resilience', 'Failure playbooks'], ['#/data-blueprint/delivery', 'Platform delivery & recovery'], ['#/lifecycle/metrics', 'Service measures']] },
]
