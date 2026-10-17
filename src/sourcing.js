// Sourcing options (build / buy / license) and the technology stack, both
// linked to the components on the platform map.

export const criteria = [
  { id: 'speed', name: 'Time to market', weight: 4 },
  { id: 'cost', name: '3-year total cost', weight: 3 },
  { id: 'diff', name: 'Investment differentiation', weight: 5 },
  { id: 'ctrl', name: 'Control & customisation', weight: 4 },
  { id: 'risk', name: 'Delivery & operational risk', weight: 4 },
  { id: 'scale', name: 'Scalability across teams and assets', weight: 4 },
  { id: 'talent', name: 'Talent required', weight: 2 },
]

// Scores 1 (poor) – 5 (excellent). `column` is the key used in the component matrix.
export const options = [
  {
    id: 'suite', column: 'suite', name: 'Integrated suite',
    tagline: 'One vendor front to back: OMS, PMS, risk, accounting and reconciliation in one product.',
    examples: ['Enfusion', 'Arcesium', 'SS&C (Eze + Geneva)', 'Clearwater'],
    scores: { speed: 5, cost: 4, diff: 1, ctrl: 2, risk: 4, scale: 2, talent: 5 },
    pros: ['Live in months', 'Vendor carries regulatory and market change', 'One contract and one data model'],
    cons: ['Same tools as competitors', 'Workflows constrained to the product', 'Hard to support niche strategies and many teams'],
    best: 'Emerging managers and single-strategy funds',
    fit: 'Likely too constraining for a multi-strategy platform with varied workflows; validate against the current estate, control needs and total cost.',
  },
  {
    id: 'bob', column: 'bob', name: 'Best-of-breed integration',
    tagline: 'The strongest product in each function, integrated through a data hub.',
    examples: ['Charles River or Eze OMS', 'Geneva', 'Duco', 'Axioma', 'Snowflake'],
    scores: { speed: 3, cost: 3, diff: 3, ctrl: 3, risk: 3, scale: 4, talent: 3 },
    pros: ['Best product per function', 'Replace parts independently', 'Proven at scale'],
    cons: ['Integration and mapping burden', 'Many vendor relationships', 'Differentiation limited to what vendors offer'],
    best: 'Multi-strategy funds with mixed asset classes and a modest engineering team',
    fit: 'A good base for commodity functions, but on its own it leaves capital allocation, collaboration and live risk undifferentiated.',
  },
  {
    id: 'build', column: 'build', name: 'Build the core in-house',
    tagline: 'Proprietary platform on a cloud-native stack; buy only commodity edges.',
    examples: ['Event backbone', 'IBOR', 'OMS', 'Risk', 'Data platform'],
    scores: { speed: 1, cost: 1, diff: 5, ctrl: 5, risk: 1, scale: 5, talent: 1 },
    pros: ['Full control and IP', 'Fits the operating model exactly', 'No vendor limits'],
    cons: ['Years to deliver', 'Regulatory change is on you', 'Large engineering and key-person risk'],
    best: 'Systematic and HFT firms where technology is the product',
    fit: 'Rebuilding OMS, accounting and reconciliation would spend engineering on commodity functions.',
  },
  {
    id: 'hybrid', column: 'rec', name: 'Hybrid: buy commodity, build or license the edge',
    tagline: 'Reference sourcing hypothesis: retain proven vendor books and execution tools; build differentiated research, data and capital workflows; assess Photon under a formal fit-gap and control review.',
    examples: ['Vendor OMS / EMS + accounting / reconciliation', 'Photon candidate (scope to validate)', 'In-house research data and capital workflows', 'Governed lakehouse + event integration'],
    scores: { speed: 4, cost: 3, diff: 5, ctrl: 4, risk: 4, scale: 4, talent: 3 },
    pros: ['Engineering spent where it creates differentiation', 'Commodity back office stays with specialist providers', 'Existing licensed technology can be assessed before replacement'],
    cons: ['Needs clear system ownership and strong integration', 'Mixed vendor and engineering skills', 'Vendor dependency and migration costs must be managed'],
    best: 'Large multi-strategy, multi-manager platforms',
    fit: 'Recommended reference approach: matches the publicly described collaborative model while leaving technology choices conditional on current-state discovery and due diligence.',
  },
]

// Per component: [differentiation, effort, integrated suite, best-of-breed, build, recommended path, recommended detail]
// path: Build | Buy | Hybrid | License
export const componentSourcing = {
  pmws: ['High', 'M', 'Suite’s own screens', 'Vendor screens per system', 'React workstation over services', 'Hybrid', 'Own shell only where it improves workflow; integrate risk panels after vendor capability is validated'],
  opsconsole: ['Medium', 'M', 'Suite’s ops screens', 'Each vendor’s screens', 'Unified exception inbox + workflow', 'Build', 'Thin in-house shell with one exception model over vendor tools'],
  investorportal: ['Low', 'S', 'Existing linked portal', 'Juniper Square / Allvue', 'Custom portal', 'Integrate', 'Northern Trust is publicly linked; confirm service scope and system ownership'],
  lake: ['High', 'L', 'Suite’s data warehouse', 'Snowflake or Databricks', 'Self-run Iceberg + Trino/Spark', 'Hybrid', 'Snowflake on Iceberg; in-house models, point-in-time semantics and governance'],
  secmaster: ['Medium', 'M', 'Suite’s security master', 'GoldenSource / Markit EDM', 'Thin in-house master', 'Hybrid', 'Thin in-house master over bought vendor data'],
  mdhub: ['Medium', 'M', 'Suite pricing module', 'Bloomberg / LSEG + pricing tool', 'In-house hub and EOD pricing', 'Hybrid', 'Vendor feeds and libraries; in-house normalisation, hierarchy and IPV'],
  bus: ['High', 'M', 'Not offered', 'Confluent / MSK', 'Self-run Kafka', 'Hybrid', 'Managed Kafka; in-house canonical event model'],
  research: ['High', 'L', 'Basic research module', 'Databricks / vendor backtester', 'In-house research platform', 'Build', 'Shared research library, backtester and signal pipeline on Kubernetes + Snowflake'],
  pms: ['High', 'M', 'Suite PMS', 'Standalone PMS', 'In-house PMS', 'Hybrid', 'Vendor core with in-house analytics and validated risk integrations'],
  risk: ['High', 'L', 'Suite risk module', 'MSCI / Axioma / Imagine', 'In-house risk engine', 'Hybrid', 'Evaluate Photon against risk requirements; retain independent checks and specialist models where needed'],
  compliance: ['Medium', 'M', 'Suite compliance', 'OMS-embedded engine', 'In-house rules engine', 'Hybrid', 'OMS-embedded pre-trade; in-house disclosure monitor and wall-crossing'],
  capital: ['High', 'M', 'Not offered', 'BI on vendor data', 'In-house capital allocation', 'Build', 'In-house: allocation, drawdown, payouts, cockpit'],
  oms: ['Low', 'M', 'Suite OMS', 'Charles River / Eze / Enfusion', 'In-house OMS', 'Buy', 'Vendor OEMS integrated through events'],
  ems: ['Medium', 'S', 'Suite EMS', 'FlexTrade / Triton / TT', 'In-house SOR and algos', 'Buy', 'Vendor EMS per asset class; in-house execution only for quant'],
  fixgw: ['Low', 'S', 'Suite connectivity', 'NYFIX / TNS managed network', 'In-house FIX engine', 'Buy', 'Managed FIX network plus central hub'],
  ibor: ['High', 'L', 'Suite IBOR', 'Arcesium / SimCorp IBOR', 'In-house event-sourced IBOR', 'Build', 'In-house event-sourced IBOR on Kafka Streams'],
  posttrade: ['Low', 'S', 'Suite module', 'Arcesium / Broadridge + CTM', 'In-house orchestration', 'Buy', 'Operations platform + DTCC CTM'],
  settlement: ['Low', 'S', 'Suite module', 'Platform + Kyriba + SWIFT bureau', 'In-house', 'Buy', 'Operations platform, treasury system, SWIFT bureau'],
  collateral: ['Medium', 'S', 'Suite module', 'AcadiaSoft + Cassini', 'In-house margin replication', 'Buy', 'AcadiaSoft and margin analytics vendor'],
  accounting: ['Low', 'M', 'Suite accounting', 'SS&C Geneva / Arcesium', 'In-house GL', 'Buy', 'Geneva or Arcesium; full shadow NAV'],
  recon: ['Low', 'S', 'Suite recon', 'Duco / TLM', 'In-house matching', 'Buy', 'Duco with in-house rules and exception inbox'],
  reporting: ['Medium', 'M', 'Suite reports', 'Filing vendor + BI', 'In-house reports', 'Hybrid', 'Snowflake reporting mart + vendor filing tool'],
  ta: ['Low', 'S', 'Suite TA', 'Administrator TA', 'In-house TA', 'Buy', 'Administrator as TA'],
  iam: ['Medium', 'M', 'Suite user admin', 'Okta / Entra + OPA', 'In-house auth', 'Hybrid', 'Bought IdP; in-house entitlement model and walls as policy'],
  apigw: ['Low', 'S', 'Not offered', 'Kong / AWS API Gateway + MFT', 'In-house gateway', 'Buy', 'Managed gateway and file transfer'],
  obs: ['Low', 'S', 'Not offered', 'Datadog / Grafana', 'Self-hosted stack', 'Buy', 'Managed observability on OpenTelemetry'],
  audit: ['Low', 'S', 'Partial', 'Global Relay / Smarsh + S3 Object Lock', 'In-house archive', 'Buy', 'Specialist archive + WORM storage'],
  infra: ['Medium', 'M', 'Vendor-hosted SaaS', 'AWS / Azure + colo', 'On-premises', 'Hybrid', 'Cloud-first with small colo footprint'],
}

// ───────────────────────── Technology stack ─────────────────────────
// Each technology: [name, licence, role, why, alternatives, used by (node ids)]

export const techLayers = [
  ['experience', 'Experience', 'What people use every day', [
    ['React + TypeScript', 'Open source', 'All in-house front ends', 'Largest talent pool; one component library for workstation, ops console and cockpit.', ['Angular', 'Vue'], ['pmws', 'opsconsole', 'capital']],
    ['AG Grid Enterprise', 'Commercial', 'Blotters and position grids', 'Fast streaming grids with server-side row models.', ['FINOS Perspective', 'TanStack Table'], ['pmws', 'opsconsole']],
    ['FINOS Perspective', 'Open source', 'Streaming analytics views', 'WebAssembly pivots over millions of rows.', ['AG Grid pivots'], ['pmws', 'risk']],
    ['OpenFin / interop.io', 'Commercial', 'Desktop container (later)', 'Multi-window workspaces and FDC3 interop.', ['Browser only', 'Electron'], ['pmws']],
    ['Sigma / Tableau', 'Commercial', 'BI on Snowflake', 'Governed self-service analytics.', ['Power BI', 'Looker'], ['reporting', 'capital', 'recon']],
  ]],
  ['services', 'Services & languages', 'Where business logic runs', [
    ['Kotlin / Java (Spring Boot)', 'Open source', 'Core services', 'Mature in finance; strong concurrency, FIX and Kafka libraries.', ['C# .NET', 'Go'], ['ibor', 'pms', 'capital', 'secmaster', 'mdhub', 'fixgw']],
    ['Python', 'Open source', 'Research, analytics, risk models, data engineering', 'The language of quants and data teams.', ['R', 'Julia'], ['research', 'risk', 'lake', 'capital', 'reporting']],
    ['Rust / C++', 'Open source', 'Hot paths', 'Feed handlers, backtest core, low-latency execution.', ['Go'], ['mdhub', 'research', 'ems']],
    ['gRPC + Protobuf', 'Open source', 'Service APIs', 'Typed, fast contracts; same IDL as events.', ['REST + OpenAPI', 'GraphQL'], ['apigw', 'pms', 'risk', 'compliance']],
    ['Temporal', 'Open source / cloud', 'Durable workflows', 'Long-running ops processes with retries and timers.', ['Camunda', 'Step Functions'], ['opsconsole', 'capital', 'accounting']],
  ]],
  ['messaging', 'Messaging & streaming', 'How data moves', [
    ['Apache Kafka (Confluent Cloud)', 'Commercial (managed)', 'Event backbone', 'Durable, ordered, replayable events with schema governance.', ['Amazon MSK', 'Redpanda'], ['bus', 'oms', 'ibor', 'settlement', 'posttrade']],
    ['Kafka Streams / Apache Flink', 'Open source', 'Stateful stream processing', 'Positions, P&L and exposures as folds over events.', ['Spark Structured Streaming'], ['ibor', 'risk', 'capital']],
    ['Solace / Aeron', 'Commercial / open source', 'Low-latency ticks', 'Microsecond fan-out of market data.', ['Vendor distribution (LSEG RTDS)'], ['mdhub', 'ems']],
    ['Debezium', 'Open source', 'Change data capture', 'Bridges vendor databases to events.', ['Vendor CDC tools'], ['bus', 'accounting']],
    ['FIX engines (Onix, QuickFIX/J)', 'Commercial / open source', 'External trading sessions', 'Industry protocol for orders and executions.', ['Managed FIX networks'], ['fixgw', 'ems', 'posttrade']],
  ]],
  ['data', 'Data & storage', 'Where data lives', [
    ['Snowflake', 'Commercial', 'Governed analytical platform', 'Conformed and curated layers, research compute, secure sharing.', ['Databricks', 'BigQuery'], ['lake', 'reporting', 'research', 'capital', 'accounting']],
    ['Apache Iceberg on S3', 'Open source', 'Open table storage', 'Keeps data readable by any engine.', ['Delta Lake'], ['lake']],
    ['dbt + Dagster', 'Open source / cloud', 'Transformation and orchestration', 'Tested, versioned models with lineage.', ['Airflow', 'Coalesce'], ['lake', 'reporting']],
    ['PostgreSQL', 'Open source', 'Operational systems of record', 'Bitemporal masters, capital, compliance, workflow state.', ['Aurora', 'CockroachDB'], ['secmaster', 'capital', 'compliance', 'mdhub', 'opsconsole']],
    ['kdb+ / ClickHouse', 'Commercial / open source', 'Ticks and interactive risk', 'As-of joins and fast slicing of huge time series.', ['OneTick', 'TimescaleDB'], ['lake', 'risk', 'research', 'ems']],
    ['Redis', 'Open source / managed', 'Caches', 'Microsecond reads for reference data and live views.', ['Hazelcast'], ['secmaster', 'pmws', 'compliance']],
  ]],
  ['domain', 'Domain platforms', 'Bought and licensed business systems', [
    ['Photon (licence reported)', 'Integrate after validation', 'Candidate risk / trading intelligence capability', 'Detailed coverage, interfaces, licence scope and operating model require diligence.', ['In-house risk build', 'Vendor risk engines', 'Selected-group deployment'], ['risk', 'pms', 'pmws', 'capital']],
    ['Vendor OEMS (Enfusion / Eze / Charles River)', 'Commercial', 'Orders, compliance, execution', 'Mature order lifecycle and pre-trade compliance.', ['FlexTrade', 'Bloomberg AIM'], ['oms', 'ems', 'compliance']],
    ['SS&C Geneva / Arcesium', 'Commercial', 'Fund accounting', 'Hedge fund accounting standard; admin compatible.', ['Clearwater', 'SimCorp'], ['accounting']],
    ['Duco', 'Commercial', 'Reconciliation', 'Fast onboarding of new feeds.', ['SmartStream TLM', 'Gresham'], ['recon']],
    ['DTCC CTM, ALERT', 'Utility', 'Matching, affirmation, SSIs', 'Industry utilities for T+1.', ['Bilateral'], ['posttrade', 'settlement']],
    ['Investor portal (Northern Trust link public)', 'Confirm service scope', 'Investor document and account access', 'The public portal link does not establish administrator, transfer agency, dealing or fund-accounting scope.', ['Administrator portal', 'Separate portal vendor', 'In-house portal'], ['ta', 'investorportal']],
    ['AcadiaSoft', 'Utility', 'Margin calls', 'Industry standard for OTC margin.', ['CloudMargin'], ['collateral']],
    ['MSCI Barra / Axioma', 'Commercial', 'Factor risk models', 'Common risk language and crowding analysis.', ['Northfield', 'In-house'], ['risk', 'pms', 'capital']],
    ['Bloomberg / LSEG / ICE', 'Commercial', 'Market and reference data', 'Breadth of coverage.', ['FactSet', 'Direct exchange feeds'], ['mdhub', 'secmaster']],
  ]],
  ['infra', 'Infrastructure', 'Where it all runs', [
    ['AWS', 'Commercial', 'Primary cloud', 'Breadth of managed services and finance ecosystem.', ['Azure', 'GCP'], ['infra', 'lake', 'research']],
    ['Kubernetes (EKS)', 'Open source / managed', 'Compute platform', 'One runtime for services, research and risk grids.', ['ECS', 'Nomad'], ['infra', 'research', 'risk']],
    ['Ray', 'Open source', 'Distributed Python', 'Backtests and risk grids at scale.', ['Dask', 'Spark'], ['research', 'risk']],
    ['Terraform + OPA', 'Open source', 'Infrastructure and policy as code', 'Reproducible, reviewed environments.', ['Pulumi', 'CloudFormation'], ['infra']],
    ['Equinix colocation', 'Commercial', 'Low-latency execution', 'Proximity to exchanges for quant strategies.', ['Cloud only'], ['infra', 'ems', 'fixgw']],
  ]],
  ['security', 'Security & control', 'Who can do what, and the evidence', [
    ['Microsoft Entra ID / Okta', 'Commercial', 'Identity', 'SSO and MFA for every user and service.', ['Ping'], ['iam', 'investorportal']],
    ['Open Policy Agent / Cedar', 'Open source', 'Authorisation', 'Entitlements and information walls as tested policy.', ['OpenFGA', 'Custom'], ['iam', 'research', 'lake']],
    ['HashiCorp Vault / AWS KMS', 'Commercial / managed', 'Secrets and keys', 'Short-lived credentials, rotation.', ['Azure Key Vault'], ['infra']],
    ['Global Relay / Smarsh', 'Commercial', 'Communications archive', 'Regulatory record-keeping.', ['Proofpoint'], ['audit', 'compliance']],
    ['NICE Actimize / Behavox', 'Commercial', 'Surveillance', 'Trade and communications surveillance.', ['Nasdaq SMARTS'], ['compliance', 'audit']],
  ]],
  ['ops', 'Engineering & observability', 'How it is built and run', [
    ['OpenTelemetry + Datadog', 'Open source + commercial', 'Observability', 'Traces, metrics and logs across every service.', ['Grafana stack', 'Splunk'], ['obs']],
    ['GitHub + GitHub Actions', 'Commercial', 'Source and CI/CD', 'One pipeline with schema and policy checks.', ['GitLab'], ['infra', 'bus']],
    ['PagerDuty', 'Commercial', 'Incident response', 'Follow-the-sun on-call across regions.', ['Opsgenie'], ['obs', 'opsconsole']],
    ['Monte Carlo / Soda', 'Commercial / open source', 'Data observability', 'Freshness and quality on every dataset.', ['Great Expectations'], ['lake', 'reporting']],
  ]],
]
