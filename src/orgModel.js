// A reference organisation aligned to the business model, the architecture and
// the component boundaries. Team shapes follow Team Topologies vocabulary:
// stream-aligned, platform, enabling and complicated-subsystem teams.
// Sizes are indicative starting ranges to calibrate, not a headcount plan.

export const teamTypes = {
  stream: ['Stream-aligned', 'Delivers directly for an investment or business workflow'],
  platform: ['Platform', 'Provides a shared, self-service capability other teams build on'],
  subsystem: ['Complicated subsystem', 'Owns a specialist component that needs deep expertise'],
  enabling: ['Enabling', 'Helps other teams adopt practices; owns standards, not systems'],
}

export const leadership = [
  ['cio', 'Chief Investment Officer', 'Capital allocation, team hiring, investment risk appetite', 'Business'],
  ['cro', 'Chief Risk Officer', 'Independent risk measurement, limits, model risk', 'Control'],
  ['cco', 'Chief Compliance Officer', 'Regulatory compliance, surveillance, MNPI walls', 'Control'],
  ['coo', 'Chief Operating Officer', 'Operations, treasury, investor services, vendors', 'Business'],
  ['cfo', 'Chief Financial Officer', 'Fund accounting, valuation, financial reporting', 'Control'],
  ['cto', 'Chief Technology Officer', 'Technology strategy, engineering, platform, security', 'Technology'],
  ['cdo', 'Chief Data Officer', 'Data strategy, governance, reference and vendor data', 'Technology'],
]

// [id, name, reports to, type, mission, components owned, partner functions, indicative size, run model]
export const teams = [
  ['strategy', 'Strategy engineering squads', 'cto', 'stream',
    'One small squad per strategy group, sitting with the investment teams. Builds strategy-specific tools on the shared platform and feeds needs back to the platform teams.',
    [], ['cio'], '3–6 per strategy group', 'Squad supports its own tools in market hours'],
  ['frontoffice', 'Trading & PM platform', 'cto', 'stream',
    'The workstation and the order path: PMS, OMS, EMS and connectivity, shared by every investment team.',
    ['pmws', 'pms', 'oms', 'ems', 'fixgw'], ['cio', 'coo'], '10–20', 'Follow-the-sun L2 with trading support desk L1'],
  ['riskcap', 'Risk, capital & compliance technology', 'cto', 'subsystem',
    'Real-time and EOD risk (including the licensed risk platform), capital allocation, and the compliance engines. Product-owned by the CRO, CIO and CCO; built in technology.',
    ['risk', 'capital', 'compliance'], ['cro', 'cio', 'cco'], '8–15', 'Market-hours L2; independent model validation in risk'],
  ['research', 'Research platform', 'cto', 'platform',
    'Shared research compute, backtesting, feature store and the firm-wide research library that lets teams discover each other’s work.',
    ['research'], ['cio'], '6–12', 'Business hours; self-service with guardrails'],
  ['dataplat', 'Data platform', 'cdo', 'platform',
    'The event backbone, Snowflake / lakehouse, market data distribution and the tooling every domain uses to publish governed data.',
    ['bus', 'lake', 'mdhub'], ['cto'], '8–15', '24×7 for the backbone; business hours for analytics'],
  ['refdata', 'Reference data', 'cdo', 'subsystem',
    'Security master, entities, corporate actions and calendars: engineering plus a reference-data operations desk that works the exceptions.',
    ['secmaster'], ['coo'], '4–8 engineers + 4–10 operations', 'Follow-the-sun exception desk'],
  ['opstech', 'Operations technology', 'cto', 'stream',
    'Positions, post-trade, settlement, collateral, reconciliation and the operations console.',
    ['ibor', 'posttrade', 'settlement', 'collateral', 'recon', 'opsconsole'], ['coo'], '10–18', 'Follow-the-sun L2 aligned to operations shifts'],
  ['fintech', 'Finance & investor technology', 'cto', 'stream',
    'Fund accounting integration, regulatory and investor reporting, investor services and the portal (largely vendor- and administrator-delivered).',
    ['accounting', 'reporting', 'ta', 'investorportal'], ['cfo', 'coo'], '5–10', 'Business hours; month-end and filing peaks'],
  ['coreplat', 'Core platform & SRE', 'cto', 'platform',
    'Cloud and colocation, Kubernetes, CI/CD, API and file gateways, observability and the paved road every team deploys on.',
    ['infra', 'obs', 'apigw'], ['cto'], '8–14', '24×7 on-call'],
  ['security', 'Security & identity', 'cto', 'platform',
    'Identity, entitlements and information walls as policy, records retention and the audit trail. Works with compliance on surveillance.',
    ['iam', 'audit'], ['cco'], '5–10', '24×7 security operations'],
  ['arch', 'Architecture & engineering enablement', 'cto', 'enabling',
    'Chief architect and a few principal engineers: standards, event contracts, the decision register, and coaching teams through design reviews.',
    [], ['cto'], '3–6', 'No production ownership'],
  ['govern', 'Data governance', 'cdo', 'enabling',
    'Catalog, data quality standards, classification (licensed, PII, MNPI) with compliance, and vendor-data licensing.',
    [], ['cco', 'cdo'], '3–6', 'No production ownership'],
]

// Accountable business owner for each component, and who builds it. [component, accountable owner, consumers to consult]
export const ownership = {
  pmws: ['Head of trading + strategy heads', 'Investment teams'],
  pms: ['CIO office', 'Investment teams, central risk'],
  oms: ['Head of trading', 'Compliance, operations'],
  ems: ['Head of trading', 'Best-execution committee'],
  fixgw: ['Head of trading', 'Brokers, operations'],
  risk: ['CRO', 'CIO, investment teams'],
  capital: ['CIO', 'CRO, CFO'],
  compliance: ['CCO', 'Trading, investment teams'],
  research: ['Strategy heads (via CIO office)', 'All investment teams'],
  bus: ['CTO', 'Every producing and consuming team'],
  lake: ['CDO', 'Research, finance, reporting'],
  mdhub: ['CDO with COO (valuation)', 'Trading, risk, accounting'],
  secmaster: ['CDO', 'Every component'],
  ibor: ['COO', 'Investment teams, risk, accounting'],
  posttrade: ['COO', 'Brokers, prime brokers'],
  settlement: ['COO (treasury)', 'Custodians, finance'],
  collateral: ['COO (treasury)', 'CRO, prime brokers'],
  recon: ['COO', 'CFO, administrator'],
  opsconsole: ['COO', 'Operations teams'],
  accounting: ['CFO', 'Administrator, auditors'],
  reporting: ['CFO with CCO', 'Regulators, investors'],
  ta: ['COO (investor services)', 'Administrator, investors'],
  investorportal: ['COO (investor relations)', 'Investors'],
  infra: ['CTO', 'All teams'],
  obs: ['CTO', 'All teams'],
  apigw: ['CTO', 'All teams, counterparties'],
  iam: ['CTO with CCO', 'All teams'],
  audit: ['CCO', 'Regulators, auditors'],
}

// [forum, chair, members, cadence, decides]
export const forums = [
  ['Capital allocation committee', 'CIO', 'CRO, CFO, strategy heads', 'Monthly + ad hoc', 'Team capital, onboarding and wind-down, drawdown overrides'],
  ['Risk committee', 'CRO', 'CIO, CCO, head of risk technology', 'Weekly', 'Limit framework, stress scenarios, risk-platform scope, external risk comparisons'],
  ['Model risk committee', 'CRO', 'Quant leads, independent validators', 'Monthly', 'Approval of production models and signals; validation findings'],
  ['Valuation committee', 'CFO', 'COO, CRO, pricing team', 'Monthly', 'Price hierarchy, overrides, Level 3 marks, administrator challenges'],
  ['Best-execution committee', 'Head of trading', 'CCO, quant leads', 'Quarterly', 'Broker and algo selection, TCA findings'],
  ['Architecture review board', 'Chief architect', 'Team leads, security, data governance', 'Fortnightly', 'Cross-team designs, standards, event contracts; owns the decision register'],
  ['Data governance council', 'CDO', 'CCO, data owners, research lead', 'Monthly', 'Data ownership, classification, quality targets, new vendor datasets'],
  ['Technology investment board', 'CTO', 'COO, CFO, CIO office', 'Quarterly', 'Build / buy / license, budgets, vendor renewals, roadmap sequencing'],
]

// Alignment of the structure to the business model: [principle, what it means for the organisation]
export const alignment = [
  ['Shared platform for independent teams', 'Platform teams own the common core; small strategy squads sit with investment teams for what is specific to them.'],
  ['Collaborative by default, walled by exception', 'One research platform team and one data office serve every team; information walls are enforced by security and governance, not by separate org silos.'],
  ['Capital is a live, first-class object', 'Capital allocation technology is built alongside risk, product-owned by the CIO, so capital changes reach limits the same day.'],
  ['Trust but verify', 'Risk technology is built in technology but product-owned by the CRO, with independent model validation and an external check that no single team controls.'],
  ['Buy commodity, build edge', 'Operations and finance technology teams are integrators and vendor owners; engineering depth concentrates on research, risk, capital and data.'],
  ['Follow the sun', 'Front-office, operations and reference-data support hand over across regions, with on-call rotations per platform team.'],
]

const opt = (name, fit, pros, cons) => ({ name, fit, pros, cons })

export const orgDecisions = [
  {
    id: 'org-1', q: 'Central technology, embedded engineers, or both?',
    context: 'Investment teams want speed and tools specific to their strategy; the firm needs one platform, one set of controls and no duplicated systems.',
    options: [
      opt('Fully central technology', 'Small firms, few strategies', ['One platform, strong standards', 'Efficient use of engineers'], ['Slow for teams; queue for everything', 'Engineers far from the investment process']),
      opt('Engineers embedded in each investment team', 'Very independent teams', ['Fast, close to the PM'], ['Duplicated systems and data', 'Controls and support vary by team', 'Hard to move capital and people between teams']),
      opt('Platform teams plus small strategy squads', 'Multi-strategy, multi-manager platforms', ['Shared core with local speed', 'Squads feed real needs back to the platform'], ['Clear rules needed on what squads may build', 'Squads must not become shadow platforms']),
    ],
    rec: 'Platform teams plus small strategy squads',
    why: 'It matches a shared platform for independent teams: the core stays common and controlled, while each strategy group has engineers who understand its workflow.',
    revisit: 'Squads repeatedly build things the platform should own, or platform queues slow teams down.',
  },
  {
    id: 'org-2', q: 'Organise teams by component, by business domain, or by asset class?',
    context: 'Team boundaries become system boundaries (Conway’s law). The architecture already has clear domains: trading, risk and capital, operations, finance, data.',
    options: [
      opt('By technical layer (UI, services, database)', 'Rarely', ['Deep specialist skills'], ['Every change crosses several teams', 'Nobody owns an outcome']),
      opt('By business domain, owning whole components', 'Default', ['Teams own outcomes end to end', 'Matches the component boundaries on the platform map'], ['Some cross-domain work still needs coordination']),
      opt('By asset class', 'Firms dominated by one asset class per desk', ['Close to desk workflows'], ['Duplicates order, position and data systems across asset classes']),
    ],
    rec: 'By business domain, owning whole components',
    why: 'Each team in the structure owns complete components on the platform map, so ownership, interfaces and support follow the architecture.',
    revisit: 'A domain team grows beyond about 15–20 people; split it along a component boundary.',
  },
  {
    id: 'org-3', q: 'Who owns data?',
    context: 'Data is produced in every domain, but the security master, governance and the analytical platform must be consistent firm-wide.',
    options: [
      opt('A central data team owns all data', 'Early stage', ['Consistency', 'One place to ask'], ['Bottleneck; far from the meaning of the data']),
      opt('Fully federated data mesh', 'Mature, data-literate domains', ['Domain teams own and publish their data products'], ['Inconsistent standards; reference data fragments']),
      opt('Central platform and reference data; domains own their data products', 'Default', ['Domains publish what they know best', 'Security master, governance and platform stay central'], ['Needs clear data contracts and a governance council with teeth']),
    ],
    rec: 'Central platform and reference data; domains own their data products',
    why: 'The security master and governance must be single and authoritative, but positions, risk and accounting data are best owned by the teams that produce them.',
    revisit: 'Data quality issues trace back to unclear ownership between domains and the data office.',
  },
  {
    id: 'org-4', q: 'Where does risk technology report?',
    context: 'Risk must be independent of the investment teams, but building it needs strong engineering.',
    options: [
      opt('Inside the risk function (reports to CRO)', 'Strong independence requirements', ['Clear independence'], ['Isolated from engineering standards and the platform']),
      opt('Inside technology, product-owned by the CRO', 'Default', ['Shared engineering practice and platform', 'CRO sets priorities and accepts releases'], ['Independence must be shown through governance and validation']),
      opt('Inside front-office technology', 'Never for independent risk', ['Fast for PMs'], ['Conflicts with independent risk oversight']),
    ],
    rec: 'Inside technology, product-owned by the CRO',
    why: 'It keeps engineering quality and platform reuse while the CRO controls what is built and validated; an external risk check provides further independence.',
    revisit: 'Regulators or investors ask for structural separation of risk technology.',
  },
  {
    id: 'org-5', q: 'Who runs production?',
    context: 'The platform trades in every time zone, while back-office peaks are at month-end and filing dates.',
    options: [
      opt('Separate operations / support team runs everything', 'Vendor-heavy estates', ['Builders focus on change'], ['Slow fixes; knowledge gaps between build and run']),
      opt('You build it, you run it', 'Strong engineering teams', ['Fast fixes; quality incentives'], ['Engineers on call around the clock across regions']),
      opt('Follow-the-sun L1 desk, owning teams on L2 / L3', 'Default', ['24-hour cover without burning out engineers', 'Teams still own their components'], ['Runbooks and handovers must be excellent']),
    ],
    rec: 'Follow-the-sun L1 desk, owning teams on L2 / L3',
    why: 'Global markets need someone awake everywhere; owning teams keep accountability for their components and fix root causes.',
    revisit: 'L1 escalates most incidents straight to L2; invest in runbooks or self-healing.',
  },
  {
    id: 'org-6', q: 'How much freedom do strategy squads have?',
    context: 'Quantitative and specialist teams often want their own languages, libraries and infrastructure.',
    options: [
      opt('Everything on the central platform', 'Uniform strategies', ['Lowest support burden'], ['Blocks legitimate specialist needs']),
      opt('Squads choose their own stack', 'Fully independent teams', ['Maximum flexibility'], ['Unsupportable sprawl; security and control gaps']),
      opt('Paved road with exceptions', 'Default', ['Shared core for orders, positions, data, identity and deployment', 'Freedom at the edges with an exception process'], ['Exceptions need an owner and review']),
    ],
    rec: 'Paved road with exceptions',
    why: 'Controls and data consistency depend on the core being shared; research and strategy-specific tooling can vary inside agreed guardrails.',
    revisit: 'Exceptions become the norm for a capability; adopt it into the paved road.',
  },
  {
    id: 'org-7', q: 'Who manages vendors?',
    context: 'Much of the platform is bought or licensed: OMS, accounting, recon, data, the risk platform.',
    options: [
      opt('Central vendor management only', 'Procurement-led firms', ['Commercial leverage'], ['Technical relationship and roadmap influence are weak']),
      opt('Each team manages its vendors', 'Small firms', ['Close technical relationship'], ['Inconsistent contracts and renewals']),
      opt('Owning team leads the relationship; central office runs commercials', 'Default', ['Technical ownership plus commercial discipline'], ['Two parties to coordinate']),
    ],
    rec: 'Owning team leads the relationship; central office runs commercials',
    why: 'The team that owns the component knows the product best; the technology investment board and procurement keep contracts, exit rights and renewals consistent.',
    revisit: 'Vendor issues fall between the team and procurement.',
  },
]
