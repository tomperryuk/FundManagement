// The firm's value chain: eight steps from sourcing capital to reviewing and reallocating it.
// This is a navigation and synthesis layer over the rest of the blueprint. Measures, evidence states and
// gates are proposals; evidence states follow the Firm operating model page (estate baseline).

export const evidenceKinds = {
  public: ['Publicly confirmed', 'fact', 'A dated public source supports the model; it does not establish internal implementation.'],
  proposed: ['Proposed design', 'inference', 'A recommended process or design that needs owner acceptance.'],
  validate: ['Needs validation', 'confirm', 'An important unknown to resolve with the named owner before the dependent delivery gate.'],
}

// gate = index into the roadmap (0–4) at which the step is first proven end to end.
export const valueSteps = [
  {
    id: 'capital', n: 1, name: 'Source capital & mandates', short: 'Investors, fund terms, mandates',
    question: 'Can we raise, admit and serve investor capital under the right fund and legal structure?',
    owner: 'CIO office · COO · Investor services',
    nodes: ['investors', 'ta', 'investorportal', 'admin', 'capital'],
    enablers: [['Funds & counterparties', '#/operating/entities'], ['Treasury role', '#/treasury/role']],
    measure: 'Subscriptions and redemptions processed correctly by dealing date; KYC cycle time; investor queries answered on time.',
    evidence: 'validate', evidenceNote: 'Fund documents, transfer-agent scope and investor-service responsibilities are not yet confirmed.',
    gate: 3,
    gap: 'Administrator, transfer-agent and investor-service scope by fund is unconfirmed.',
    links: [['Funds & counterparties', '#/operating/entities'], ['Investor subscription scenario', '#/operating/scenarios'], ['Treasury', '#/treasury/role']],
  },
  {
    id: 'teams', n: 2, name: 'Onboard & run teams', short: 'Strategy teams, books, access',
    question: 'Can a new investment team be set up, proved ready and ramped under limits without a bespoke build?',
    owner: 'COO · onboarding lead · Head of Trading',
    nodes: ['iam', 'pmws', 'pb', 'lake', 'capital'],
    enablers: [['Team workspaces', '#/data/teams'], ['Service catalogue', '#/operating/services']],
    measure: 'Elapsed time from approved team to first controlled trade; setup tasks with a named approver; access certified on time.',
    evidence: 'proposed', evidenceNote: 'The team lifecycle and service catalogue are a proposed design; the current onboarding process is not recorded here.',
    gate: 2,
    gap: 'No standard onboarding checklist or service catalogue is confirmed against what exists today.',
    links: [['Team lifecycle', '#/operating/teams'], ['Service catalogue', '#/operating/services'], ['Team workspaces', '#/data/teams']],
  },
  {
    id: 'research', n: 3, name: 'Research & signal', short: 'Data, ideas, models, backtests',
    question: 'Can researchers find approved data, test ideas point-in-time and promote them with an owner and rollback?',
    owner: 'Strategy heads · research product owner · CDO',
    nodes: ['alt', 'ref', 'md', 'lake', 'secmaster', 'mdhub', 'research'],
    enablers: [['Data platform blueprint', '#/data-blueprint/overview'], ['Key datasets', '#/datasets'], ['Ontology & AI', '#/ai/context'], ['Data modelling perspectives', '#/perspectives/vault']],
    measure: 'Reproducible approved signals ÷ expected; point-in-time data coverage; hypothesis-to-approval time.',
    evidence: 'proposed', evidenceNote: 'Data providers, contracts and research tooling are candidates; existing licences and usage rights need confirmation.',
    gate: 1,
    gap: 'Existing data licences, research environments and point-in-time practice are not inventoried.',
    links: [['Research journey', '#/workflows/research'], ['Point-in-time & corrections', '#/data/pit'], ['Alternative data', '#/altdata'], ['Security master', '#/secmaster']],
  },
  {
    id: 'risk', n: 4, name: 'Size & risk-check', short: 'Sizing, limits, compliance',
    question: 'Can a PM size a trade and know it passes mandate, risk and compliance checks before release?',
    owner: 'PMs · CRO · CCO',
    nodes: ['pms', 'risk', 'compliance', 'capital', 'secmaster'],
    enablers: [['Photon fit & diligence', '#/fit/risk'], ['Principles', '#/principles']],
    measure: 'Orders with complete intent and pre-trade result; override rate and review; bypass incidents (target zero).',
    evidence: 'validate', evidenceNote: 'Risk-engine coverage (Photon) and the PMS inventory are reported, not owner-verified.',
    gate: 1,
    gap: 'Photon scope, interfaces and independent-risk coverage remain unconfirmed.',
    links: [['Photon fit & diligence', '#/fit/risk'], ['Strategy group needs', '#/fit/groups'], ['Capital & decisions', '#/operating/capital']],
  },
  {
    id: 'trade', n: 5, name: 'Trade & execute', short: 'Orders, routing, fills',
    question: 'Can orders be staged, routed and filled with a single order state and complete drop-copy capture?',
    owner: 'Head of Trading · traders · OMS/EMS owners',
    nodes: ['pmws', 'oms', 'ems', 'fixgw', 'brokers', 'venues', 'otc', 'mdhub'],
    enablers: [['Trading journey', '#/workflows/trading'], ['Data paths: live & tick', '#/data/platform']],
    measure: 'Order-state reconciliation across OMS/EMS/broker; fill completeness; execution quality against benchmark.',
    evidence: 'validate', evidenceNote: 'The installed PMS / OMS / EMS products and versions are not owner-verified.',
    gate: 1,
    gap: 'Installed OMS/EMS products, versions, API and export rights are not inventoried.',
    links: [['Trading journey', '#/workflows/trading'], ['Trade stages', '#/lifecycle/stages'], ['Equity trade scenario', '#/map']],
  },
  {
    id: 'settle', n: 6, name: 'Settle, reconcile & finance', short: 'Positions, cash, margin, breaks',
    question: 'Does every fill become one position, settle on time, and any break reach a named owner?',
    owner: 'COO · Treasurer · operations leads',
    nodes: ['bus', 'ibor', 'posttrade', 'ctm', 'custodian', 'pb', 'settlement', 'collateral', 'recon'],
    enablers: [['Treasury daily cycle', '#/treasury/cycle'], ['Failure & recovery', '#/operating/resilience']],
    measure: 'Affirmation and settlement by cut-off; preventable fail rate; break age and value; margin calls paid on time.',
    evidence: 'validate', evidenceNote: 'Actual prime brokers, custodians, bank accounts and agreements are to be inventoried.',
    gate: 2,
    gap: 'Account-to-fund mappings, financing terms and statement formats are not inventoried.',
    links: [['Treasury', '#/treasury/role'], ['Failure & recovery', '#/operating/resilience'], ['Margin call scenario', '#/map']],
  },
  {
    id: 'nav', n: 7, name: 'Account, NAV & report', short: 'Valuation, NAV, investor & regulatory reporting',
    question: 'Can marks, NAV and reports be signed off on time, reconciled to the administrator, with evidence?',
    owner: 'CFO · Valuation Committee · CCO',
    nodes: ['accounting', 'admin', 'reporting', 'opsconsole', 'regulators', 'audit', 'investors'],
    enablers: [['Decision rights', '#/operating/capital'], ['Economics & costs', '#/operating/economics']],
    measure: 'Price and corporate-action coverage by cut-off; shadow-to-administrator breaks; NAV sign-off and correction rate.',
    evidence: 'validate', evidenceNote: 'Administrator and transfer-agent responsibilities by fund are not confirmed from the public link alone.',
    gate: 3,
    gap: 'Source of truth for NAV and the shadow-versus-administrator split are not agreed.',
    links: [['Daily NAV scenario', '#/map'], ['Economics & costs', '#/operating/economics'], ['Regulatory reporting', '#/operating/scenarios']],
  },
  {
    id: 'review', n: 8, name: 'Review & reallocate capital', short: 'Performance, risk, capital decisions',
    question: 'Can the firm see reconciled outcomes and move capital between teams under a versioned, acknowledged decision?',
    owner: 'CIO · CRO · CFO',
    nodes: ['capital', 'risk', 'ibor', 'ems', 'lake', 'obs'],
    enablers: [['Capital & decisions', '#/operating/capital'], ['Measures across the business', '#/lifecycle/metrics']],
    measure: 'Capital decisions with scope, effective time and downstream acknowledgement; time from trigger to propagated limit.',
    evidence: 'public', evidenceNote: 'Dynamic capital allocation and a multi-manager model are publicly stated; the internal rules are not.',
    gate: 4,
    gap: 'Decision authorities, thresholds and the propagation path to limits are design proposals.',
    links: [['Capital & decisions', '#/operating/capital'], ['Drawdown scenario', '#/map'], ['Measures', '#/lifecycle/metrics']],
  },
]

// Cross-cutting components used by every step; shown as a foundation lane rather than a step.
export const foundation = { id: 'foundation', name: 'Foundation', nodes: ['iam', 'apigw', 'obs', 'audit', 'infra', 'bus'], note: 'Identity, integration, observability, audit and resilience serve every step.' }

export const stepById = Object.fromEntries(valueSteps.map(s => [s.id, s]))
export const stepsForNode = id => valueSteps.filter(s => s.nodes.includes(id))

// Decisions that are not tied to a platform component.
const ORG_STEPS = { 'org-1': ['teams'], 'org-2': ['teams'], 'org-3': ['research'], 'org-4': ['risk'], 'org-5': ['trade', 'settle'], 'org-6': ['teams'], 'org-7': ['teams'] }

// Which value-chain steps a catalogue decision affects, and the earliest gate that needs it.
export function decisionSteps(d) {
  const ids = d.nodeId ? stepsForNode(d.nodeId).map(s => s.id) : (ORG_STEPS[d.id] || [])
  const steps = ids.map(id => stepById[id])
  const foundationOnly = d.nodeId && foundation.nodes.includes(d.nodeId) && !steps.length
  return { steps, gate: steps.length ? Math.min(...steps.map(s => s.gate)) : foundationOnly ? 1 : null }
}

// What each roadmap gate unlocks along the chain.
export const gateUnlocks = [
  [['teams', 'Know what exists: one workflow mapped per strategy group, owners and data rights confirmed.'], ['trade', 'Retain / integrate / replace decided for OMS, EMS and PMS.'], ['risk', 'Photon and independent-risk scope validated.']],
  [['research', 'First versioned, reproducible research dataset and use case.'], ['risk', 'Pre-trade checks proven on one slice.'], ['trade', 'One workflow runs order → fill → booking → reconciliation with audit.']],
  [['teams', 'A second team onboarded on the shared control plane without a bespoke build.'], ['settle', 'Cash, collateral, corporate actions and exception ownership across more brokers and PBs.']],
  [['capital', 'Investor and regulatory reporting from governed data.'], ['nav', 'IBOR reconciled to the administrator; NAV sign-off established.']],
  [['review', 'TCA and realised outcomes feed research and capital decisions.'], ['research', 'Systematic signal promotion with model monitoring.']],
]

// Who touches the chain. `steps` are ids; `pages` are the most useful places to start.
export const roles = [
  { name: 'Portfolio manager', does: 'Turns views into sized, checked orders and uses the platform every day.', steps: ['research', 'risk', 'trade', 'review'], pages: [['Research journey', '#/workflows/research'], ['Trading journey', '#/workflows/trading'], ['A day on the platform', '#/lifecycle/day']] },
  { name: 'Quant / analyst', does: 'Finds data, tests ideas point-in-time and promotes signals.', steps: ['research'], pages: [['Point-in-time & corrections', '#/data/pit'], ['Key datasets', '#/datasets'], ['Team workspaces', '#/data/teams']] },
  { name: 'Trader', does: 'Releases and works orders, owns execution quality.', steps: ['trade', 'risk'], pages: [['Trading journey', '#/workflows/trading'], ['Platform map', '#/map'], ['Trade stages', '#/lifecycle/stages']] },
  { name: 'Risk (CRO)', does: 'Independent limits, stress and capital challenge.', steps: ['risk', 'review', 'teams'], pages: [['Photon fit & diligence', '#/fit/risk'], ['Capital & decisions', '#/operating/capital'], ['Measures', '#/lifecycle/metrics']] },
  { name: 'Compliance (CCO)', does: 'Restrictions, MNPI, surveillance and regulatory reporting.', steps: ['risk', 'research', 'nav'], pages: [['Collaboration & walls', '#/operating/collaboration'], ['Guardrails', '#/ai/guardrails'], ['Decision rights', '#/operating/capital']] },
  { name: 'Operations (COO)', does: 'Allocations, confirms, settlement, breaks and onboarding.', steps: ['teams', 'settle', 'nav'], pages: [['Team lifecycle', '#/operating/teams'], ['Failure & recovery', '#/operating/resilience'], ['Service catalogue', '#/operating/services']] },
  { name: 'Finance (CFO)', does: 'Valuation, NAV, fees, expenses and the cost of the platform.', steps: ['nav', 'capital', 'review'], pages: [['Economics & costs', '#/operating/economics'], ['Funds & counterparties', '#/operating/entities'], ['Daily NAV', '#/map']] },
  { name: 'Treasury', does: 'Cash, margin, financing and payments.', steps: ['settle', 'capital'], pages: [['Treasury', '#/treasury/role'], ['Daily cycle', '#/treasury/cycle'], ['Liquidity & financing', '#/treasury/liquidity']] },
  { name: 'Technology & data', does: 'Builds and runs the components, data products and controls.', steps: ['research', 'trade', 'settle', 'teams'], pages: [['Platform map', '#/map'], ['Data platform blueprint', '#/data-blueprint/overview'], ['Technology stack', '#/stack/layers'], ['Ownership', '#/org/ownership']] },
  { name: 'CIO / leadership', does: 'Allocates capital, accepts trade-offs and sets delivery priorities.', steps: ['capital', 'teams', 'review'], pages: [['Value chain', '#/valuechain/steps'], ['Decision register', '#/register'], ['Roadmap', '#/roadmap']] },
]
