// Flows from the proposed data architecture (16 Oct 2026), placed where they explain the processes.
// Each flow is rows of steps. A row is a sequence (arrows between steps) unless `parallel` is set.
// `between` is the caption on the connector from one row to the next. `to` links a step to its detailed design.

export const researchToProduction = {
  title: 'From raw data to a production signal',
  intro: 'Every deployed model traces back to the data and code used to validate it.',
  rows: [
    { label: 'Prepare data', tone: 'data', steps: [
      { t: 'Raw vendor history', d: 'Immutable, as received', to: '#/datasets' },
      { t: 'Identifiers & corporate actions', d: 'Mapped to the security master', to: '#/secmaster' },
      { t: 'Point-in-time preparation', d: 'Only what was available at each date', to: '#/data/pit' },
      { t: 'Versioned research datasets', d: 'Each version is addressable' },
    ] },
    { label: 'Develop in the team workspace', tone: 'work', between: 'Isolated team workspace', steps: [
      { t: 'Features & model development' },
      { t: 'Backtesting & simulation', d: 'Costs, liquidity and execution constraints' },
    ] },
    { label: 'Approve and run', tone: 'control', between: 'Evidence goes to review', steps: [
      { t: 'Validation & approval', d: 'Peer, compliance and model validation as needed' },
      { t: 'Model & artifact registry', d: 'Versioned model, code and parameters', to: '#/node/research' },
      { t: 'Controlled deployment', d: 'Paper, shadow, limited, then scale' },
      { t: 'Production signals & trading integration', d: 'Signal version reaches the PM', to: '#/workflows/trading' },
      { t: 'Performance & drift monitoring', d: 'Findings feed the next iteration' },
    ] },
  ],
  loop: 'Monitoring findings return to research: drift, decay and realised costs become the next hypothesis.',
  callout: ['Experiment record', 'Links dataset versions, availability cutoffs, code, parameters and results to every run, so any backtest or production signal can be reproduced and audited.'],
}

export const liveTradingPath = {
  title: 'Live trading path and shared services',
  intro: 'Execution infrastructure that needs low latency runs on its own, and connects to shared risk and history asynchronously.',
  rows: [
    { label: 'Dedicated execution infrastructure', tone: 'live', steps: [
      { t: 'Exchange market feeds' },
      { t: 'Local feed handlers & live market state', d: 'Order books and prices held locally' },
      { t: 'Strategy & signal engine', d: 'Limits and capital allocations held locally' },
      { t: 'Pre-trade risk checks', d: 'Run on local limits and state', to: '#/node/compliance' },
      { t: 'Execution gateway & venues', to: '#/node/fixgw' },
      { t: 'Order & fill capture', d: 'Records every event' },
    ] },
    { label: 'Shared platform services', tone: 'shared', between: 'Published asynchronously; the backbone is outside the execution path', steps: [
      { t: 'Event backbone', d: 'Replayable', to: '#/node/bus' },
      { t: 'Position service', to: '#/node/ibor' },
      { t: 'Historical archive', to: '#/data/platform' },
      { t: 'Intraday risk engine', d: 'Shows freshness and completeness', to: '#/node/risk' },
      { t: 'Exposure dashboards & alerts' },
    ] },
  ],
  loop: 'Limits and capital allocations flow back to the execution layer as versioned updates; the local copy is what pre-trade checks read.',
  callout: ['Design rule', 'Pre-trade checks use locally available limits and state. Central risk reports how fresh and complete its numbers are, so users know what they are looking at. Feed capture publishes asynchronously; nothing waits on the event backbone.'],
}

export const teamIsolation = {
  title: 'Team workspaces on shared services',
  intro: 'Investment teams keep proprietary research private while using centrally governed data and infrastructure.',
  rows: [
    { label: 'Central governance', tone: 'control', steps: [
      { t: 'Identity & policy enforcement', to: '#/node/iam' },
      { t: 'Vendor licences & entitlements', to: '#/altdata' },
      { t: 'Trusted shared data products', to: '#/datasets' },
      { t: 'Shared data access layer', d: 'Enforces entitlements at storage, query and service' },
    ] },
    { label: 'Team workspaces', tone: 'work', parallel: true, between: 'Each team reads shared data; its own work stays private', steps: [
      { t: 'Equity team workspace', d: 'Private equity research' },
      { t: 'Macro team workspace', d: 'Private macro research' },
      { t: 'Quant team workspace', d: 'Private quant research' },
    ] },
    { label: 'Central oversight', tone: 'shared', between: 'Only explicitly authorised portfolio information', steps: [
      { t: 'Authorised positions & exposures' },
      { t: 'Central risk & capital allocation', to: '#/node/capital' },
    ] },
  ],
  callout: ['Common services', 'Deployment, monitoring, lineage, secrets and cost management are shared by every workspace, so isolation does not mean each team builds its own platform.'],
}

export const pointInTime = {
  title: 'Point-in-time data and corrections',
  intro: 'A correction creates a new version; it never overwrites what earlier decisions could see.',
  rows: [
    { label: 'Capture', tone: 'data', steps: [
      { t: 'Source observation' },
      { t: 'Capture original payload', d: 'Kept exactly as received' },
      { t: 'Record event, publication and receipt times' },
      { t: 'Validate & record availability time' },
      { t: 'Append version to historical store', d: 'Append only' },
    ] },
    { label: 'Corrections', tone: 'control', between: 'A later correction follows the same path', steps: [
      { t: 'Source correction' },
      { t: 'Capture revision metadata', d: 'What changed, when and why' },
    ] },
    { label: 'Read', tone: 'shared', between: 'Two views of the same history', steps: [
      { t: 'Latest corrected view', d: 'For current analytics and reconciliation' },
      { t: 'As known at a historical cutoff', d: 'For backtesting and decision reconstruction' },
    ], parallel: true },
  ],
  callout: ['Two times', 'Effective time says when a fact applies. Availability time says when it could first be used. Historical simulations choose only versions available by the decision cutoff and permitted to that team.'],
}

// [logical component, candidate technology, note]
export const deployment = [
  ['External feeds & business systems', 'Vendor APIs, files, FIX and SWIFT', 'Entry points to the platform'],
  ['Ingestion services', 'Containerised services on Kubernetes, Kafka Connect, SFTP gateways', 'Validate, timestamp and apply entitlements on entry'],
  ['Event backbone', 'Kafka (self-managed or Confluent Cloud), Schema Registry', 'Replayable; outside the execution path'],
  ['Raw archive', 'S3', 'Immutable raw history; object lock where needed'],
  ['Metadata & workflow', 'PostgreSQL', 'Instrument and entity master, registries and workflow state'],
  ['Live state & time series', 'Redis, kdb+ or ClickHouse', 'Justify against measured workload'],
  ['Processing', 'Python on Spark or Dask; Snowpark', 'Batch and distributed jobs'],
  ['Curated storage', 'S3 Parquet or Iceberg', 'Open-table access to curated data'],
  ['Research compute', 'Isolated per-team compute, notebooks and Ray or Dask', 'Provisioned separately from trading and reporting'],
  ['Curated analytics', 'Snowflake', 'Governed analytical platform; not a system of record'],
  ['Trading & intraday applications', 'gRPC and WebSocket services', 'Independent capacity from research and reporting'],
  ['Risk, finance & reporting', 'Snowflake marts, dbt, BI', 'Independent capacity from research and trading'],
]
export const deploymentNote = 'Identity, entitlements and audit apply across all services. Research, execution and risk/reporting use independently provisioned capacity. Open-table access and specialist time-series storage should be justified by measured workload requirements. Final choices depend on existing systems and benchmarks.'
