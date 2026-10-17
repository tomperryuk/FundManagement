// Per-component reference design: what it looks like, the stack, and the
// design decisions to make, with options and trade-offs.
//
// Shorthand:
//   stack:     [layer, choice, why]
//   decisions: [question, context, options, recommended option name, why, revisit when]
//   options:   [name, best when, pros[], cons[]]

const raw = {
  // ───────────── Channels ─────────────
  pmws: {
    shape: 'A browser single-page app, optionally hosted in a desktop container, talking to a per-user real-time gateway (backend-for-frontend). The gateway subscribes to event-backbone topics, applies entitlements, conflates ticks and pushes snapshot-plus-delta updates over WebSocket. Commands (orders, what-ifs) go over gRPC-web to the PMS, OMS and risk services. The UI holds no business state; saved layouts live server-side.',
    stack: [
      ['UI framework', 'React + TypeScript', 'Largest talent pool; strong grid and charting ecosystem.'],
      ['Data grids', 'AG Grid Enterprise', 'Server-side row model, pivoting, delta updates at trading-desk scale.'],
      ['Streaming analytics', 'FINOS Perspective', 'WebAssembly pivots over millions of streaming rows for risk views.'],
      ['Real-time gateway', 'Kotlin or Node BFF over WebSocket', 'Per-user fan-out, conflation and entitlement checks close to the data.'],
      ['Commands', 'gRPC-web / REST', 'Typed contracts to PMS, OMS and risk.'],
      ['Desktop', 'Browser first; OpenFin or interop.io later', 'Multi-window and FDC3 interop when needed.'],
    ],
    decisions: [
      ['Browser or desktop container?', 'Traders run many windows across several monitors next to Bloomberg and broker apps.', [
        ['Plain browser', 'Early stage, few apps', ['Zero install, instant deploys', 'Lowest cost'], ['Weak multi-window and workspace restore', 'No standard interop with other desktop apps']],
        ['OpenFin / interop.io', 'Several desktop apps need to share context', ['Multi-window workspaces that restore', 'FDC3 interop with vendor apps', 'Central deployment and version control'], ['Licence cost per user', 'Another runtime to operate']],
        ['Self-built Electron', 'You need deep OS integration and accept the maintenance', ['Full control'], ['You own Chromium security patching', 'No ecosystem interop']],
      ], 'Plain browser', 'Ship in the browser first; move to a container once three or more apps need shared context.', 'Traders ask for linked windows across apps, or you adopt FDC3 with vendors.'],
      ['Which grid technology?', 'Blotters stream thousands of updates per second and need grouping, pivoting and export.', [
        ['AG Grid Enterprise', 'Blotters and position grids', ['Mature, fast, very configurable', 'Server-side row model for large books'], ['Per-developer licence']],
        ['FINOS Perspective', 'Ad-hoc risk and P&L analytics', ['Streaming pivots on millions of rows in WebAssembly', 'Open source'], ['Less control over cell rendering and styling']],
        ['TanStack Table + custom virtualisation', 'Simple read-only tables', ['Free and flexible'], ['Performance work is yours', 'No pivoting out of the box']],
      ], 'AG Grid Enterprise', 'Use AG Grid for operational blotters and Perspective for exploratory analytics.', 'Licence cost becomes material or a team needs pivots over very large data.'],
      ['How is real-time data delivered?', 'Prices tick far faster than humans can read; positions update on every fill.', [
        ['WebSocket snapshot + delta via BFF', 'Trading UIs', ['Conflation and entitlements in one place', 'Resume from last sequence on reconnect'], ['You build the protocol and reconnection logic']],
        ['GraphQL subscriptions', 'Lower-rate data with flexible queries', ['Typed schema, flexible shape'], ['Expensive fan-out at high tick rates']],
        ['Server-Sent Events', 'Notifications and low-rate feeds', ['Simple, works over plain HTTP'], ['One-way only; browser connection limits']],
      ], 'WebSocket snapshot + delta via BFF', 'It is the only option that handles conflation and per-user entitlement at tick rates.', 'Never for trading; GraphQL is fine for ops and reporting screens.'],
      ['Own the UI or use vendor screens?', 'Vendor OMS and PMS products ship their own front ends.', [
        ['Vendor screens only', 'Small team, fast start', ['No UI development'], ['Fragmented experience across systems', 'No custom analytics']],
        ['Own shell embedding vendor screens', 'Most mid-size funds', ['One workspace and identity', 'Custom analytics where it matters'], ['Integration work per vendor']],
        ['Fully in-house UI', 'Large or systematic platforms', ['Best experience, full control'], ['Highest cost; you chase vendor API changes']],
      ], 'Own shell embedding vendor screens', 'Own the PM experience while reusing vendor order blotters until they become the bottleneck.', 'PMs spend most of their day switching between vendor screens.'],
    ],
  },
  opsconsole: {
    shape: 'A workflow-centred web app built around one common Exception model. Every operations system publishes exceptions (recon breaks, failed settlements, unmatched confirms, price exceptions) to a topic; the console aggregates them, assigns owners, tracks ageing against SLAs and records the resolution. Multi-step processes such as the NAV checklist and corporate action elections run on a workflow engine.',
    stack: [
      ['UI', 'React + TypeScript', 'Same component library as the workstation.'],
      ['Exception service', 'Kotlin or Python + Postgres', 'Common model: source, key, severity, owner, age, root cause.'],
      ['Workflow engine', 'Temporal', 'Durable, code-first workflows with timers and retries.'],
      ['Search', 'OpenSearch', 'Fast search across breaks and history.'],
      ['Long-tail tools', 'Retool (governed)', 'Quick internal screens for low-volume tasks.'],
    ],
    decisions: [
      ['Which workflow engine?', 'NAV close, CA elections and approvals are long-running, multi-step processes with deadlines.', [
        ['Temporal', 'Engineering-owned workflows', ['Durable execution with retries and timers', 'Workflows are ordinary code with tests'], ['Not readable by business users']],
        ['Camunda (BPMN)', 'Business-owned process models', ['Visual models business users can read', 'Strong audit of process steps'], ['Heavier; enterprise licence for full features']],
        ['State machine in the database', 'Simple, short workflows', ['No new infrastructure'], ['You reinvent timers, retries and versioning']],
      ], 'Temporal', 'Ops workflows change often and need tests; code-first wins. Use a simple state machine for individual exceptions.', 'Operations leads want to edit process flows without engineers.'],
      ['One exception inbox or vendor screens?', 'Breaks live in the recon tool, fails in the settlement system, mismatches in CTM.', [
        ['Unified exception inbox', 'More than two ops systems', ['One priority view with cross-system ageing', 'Consistent root-cause data for improvement'], ['Adapter per source system']],
        ['Use each vendor’s screens', 'Single-platform operations (e.g. all-in Arcesium)', ['No build'], ['No firm-wide view of risk in the queue']],
      ], 'Unified exception inbox', 'Operational risk is about what is ageing across systems, which no single vendor shows.', 'You consolidate onto one operations platform.'],
      ['Low-code or custom for internal tools?', 'There is a long tail of small screens: SSI approvals, fee rebates, static data requests.', [
        ['Low-code (Retool, Appsmith)', 'Low-volume internal tools', ['Days not weeks', 'Business teams can iterate'], ['Governance and access control need care', 'Hard to test and version']],
        ['Custom React', 'Core, high-use screens', ['Full control, tested, versioned'], ['Slower to build']],
      ], 'Low-code (Retool, Appsmith)', 'Use low-code for the long tail behind SSO with audit; build the exception inbox properly.', 'A low-code app becomes critical or high-volume; rebuild it.'],
    ],
  },
  investorportal: {
    shape: 'Usually the administrator’s portal, branded for the manager, fed by the TA register and the document vault. Investors log in with MFA through an external identity service; every download is logged. Dealing requests flow to the TA with e-signature.',
    stack: [
      ['Portal', 'Administrator portal or Juniper Square / Allvue', 'Investor data already lives with the admin.'],
      ['Identity', 'Entra External ID / Auth0 with MFA', 'Separate from the employee directory.'],
      ['Documents', 'Object storage + signed URLs', 'Per-investor entitlements; download audit.'],
      ['E-signature', 'DocuSign', 'Subscription documents and KYC.'],
    ],
    decisions: [
      ['Who provides the portal?', 'Investors expect statements, documents and dealing online.', [
        ['Administrator’s portal', 'Most funds', ['Data already there; low effort'], ['Limited branding and features']],
        ['Third-party investor portal', 'Strong IR focus', ['Better experience, CRM integration'], ['Another integration and data copy']],
        ['Build', 'Rarely', ['Full control'], ['Security and maintenance burden for low differentiation']],
      ], 'Administrator’s portal', 'Verition publicly links to Northern Trust’s investor portal. Retain that integration subject to service-scope review; separately verify administration, TA and dealing responsibilities.', 'Investor relations needs a richer experience or a separate service is contractually required.'],
      ['How are documents delivered?', 'Statements and K-1s contain sensitive data.', [
        ['Portal-only with email notification', 'Default', ['No sensitive data in email', 'Download audit'], ['Investors must log in']],
        ['Encrypted email attachments', 'Investor insists', ['Convenient'], ['Hard to revoke; weak audit']],
      ], 'Portal-only with email notification', 'Keeps sensitive data out of mailboxes and gives an audit trail.', 'Never fully; allow exceptions by investor with approval.'],
    ],
  },

  // ───────────── Data platform ─────────────
  lake: {
    shape: 'A medallion layout on object storage in an open table format. Raw holds events and vendor files exactly as landed and is immutable. Conformed holds canonical, bitemporal tables (instruments, prices, trades, positions). Marts hold purpose-built outputs: point-in-time research datasets, reporting marts and feature tables. Several engines read the same tables, and one catalog governs access.',
    stack: [
      ['Storage', 'S3 + Apache Iceberg', 'Open format; any engine can read it; time travel built in.'],
      ['Primary engine', 'Snowflake (Iceberg tables on S3)', 'Governed SQL and Python compute, vendor data shares and secure sharing. Detailed in the Data Architecture tab.'],
      ['Transformations', 'dbt', 'Versioned, tested SQL models with lineage.'],
      ['Orchestration', 'Dagster', 'Asset-oriented scheduling with lineage and freshness checks.'],
      ['Tick history', 'kdb+ or ClickHouse', 'Fast as-of joins over billions of rows.'],
      ['Data quality', 'Soda / Great Expectations', 'Checks that block publication on failure.'],
      ['Catalog', 'Unity Catalog / Apache Polaris', 'Central permissions mirroring IAM.'],
    ],
    decisions: [
      ['Which lakehouse platform?', 'Data vendors increasingly deliver through cloud shares; quants want notebooks and Spark.', [
        ['Snowflake', 'SQL-heavy, small data team', ['Least operations', 'Many data vendors deliver via Snowflake shares', 'Strong governance'], ['Expensive at scale', 'Proprietary compute']],
        ['Databricks', 'Quant research and ML at scale', ['Spark and ML native; notebooks for quants', 'Unity Catalog governance'], ['More engineering to run well']],
        ['Self-run Iceberg + Trino/Spark', 'Large platform team, cost-sensitive', ['No lock-in; cheapest at scale'], ['You operate everything']],
      ], 'Snowflake', 'Keep the data in Iceberg so the engine stays swappable; choose Databricks instead if ML research dominates.', 'Compute spend passes the cost of a platform team.'],
      ['Where does tick data live?', 'Intraday research needs as-of joins over years of quotes and trades.', [
        ['kdb+', 'High-frequency and intraday quant teams', ['Fastest time-series engine', 'Native as-of joins'], ['Expensive licence', 'Scarce q skills']],
        ['ClickHouse', 'Intraday analytics with SQL', ['Fast, open source, SQL'], ['Less mature as-of tooling']],
        ['Parquet + DuckDB / Polars', 'Daily and lower-frequency research', ['Cheap and simple'], ['Not suited to real-time queries']],
      ], 'ClickHouse', 'Good enough for most teams; add kdb+ only for teams whose edge is intraday microstructure.', 'A quant team’s research is bottlenecked on tick queries.'],
      ['How is history kept?', 'You must reproduce any past NAV and any backtest exactly.', [
        ['Full bitemporal tables', 'Books, reference data, prices', ['Answers “what did we know, and when”', 'Corrections never destroy history'], ['More complex queries and storage']],
        ['Daily snapshots', 'Derived marts', ['Simple to query'], ['Loses intraday corrections']],
        ['Table-format time travel only', 'Short-lived scratch data', ['Free with Iceberg'], ['System time only; retention limits']],
      ], 'Full bitemporal tables', 'Use full bitemporal for anything of record, and snapshots for derived marts.', 'Never for books and records.'],
      ['Which orchestrator?', 'Hundreds of dependent jobs with SLAs.', [
        ['Dagster', 'New platform', ['Asset-oriented with built-in lineage and freshness'], ['Smaller community than Airflow']],
        ['Airflow', 'Existing skills', ['Huge ecosystem; managed offerings'], ['Task-centric; lineage is bolt-on']],
        ['Prefect', 'Python-first teams', ['Simple, dynamic flows'], ['Less suited to data-asset modelling']],
      ], 'Dagster', 'Asset lineage maps directly onto regulatory “where did this number come from” questions.', 'You already run Airflow at scale.'],
    ],
  },
  secmaster: {
    shape: 'A small, highly available service. A pipeline per vendor lands raw records; a golden-copy engine merges them by field-level precedence; results are stored bitemporally in Postgres and published as events. The internal instrument ID never changes; vendor identifiers are attributes with validity dates.',
    stack: [
      ['Store', 'PostgreSQL with bitemporal tables', 'Relational integrity, cheap, easy to audit.'],
      ['Ingestion', 'Python / Kotlin parsers, SFTP + REST', 'One adapter per vendor.'],
      ['Golden copy', 'Rules engine (in-house)', 'Field-level source precedence, conflicts to exceptions.'],
      ['Distribution', 'REST/gRPC API + Kafka refdata.* topics', 'Lookups by any identifier; change events for consumers.'],
      ['Cache', 'Redis or in-process', 'Microsecond lookups on the trading path.'],
    ],
    decisions: [
      ['Buy an EDM product or build a thin master?', 'Security masters are where data quality is won or lost.', [
        ['Buy EDM (GoldenSource, Markit EDM)', 'Many asset classes, complex CAs', ['Complete models and CA workflows', 'Proven at banks'], ['Expensive, long implementation', 'Heavy for a hedge fund']],
        ['Use the operations platform’s master (Arcesium, Enfusion)', 'You run that platform anyway', ['Included and integrated'], ['Tied to the platform']],
        ['Build a thin master', 'Clear asset-class scope, strong data team', ['Fits exactly; cheap to run'], ['You own CA scrubbing and edge cases']],
      ], 'Build a thin master', 'Build a thin master over bought vendor data; buy an EDM only if you cover more than five asset classes with heavy CA volumes.', 'CA errors keep reaching positions, or asset classes multiply.'],
      ['What is the primary identifier?', 'Every system must agree what a security is.', [
        ['Internal surrogate ID', 'Always, as the key', ['Stable forever; no licence; covers OTC and private'], ['Mapping needed at every boundary']],
        ['FIGI', 'Primary external identifier', ['Open and free; identifies the listing (exchange + share class)'], ['Gaps for OTC and private instruments']],
        ['ISIN', 'Settlement and regulatory reporting', ['Universal, required by regulators'], ['Does not identify exchange or currency line']],
      ], 'Internal surrogate ID', 'Use an internal ID as the key, FIGI as the main external cross-reference, and ISIN/CUSIP/SEDOL as attributes.', 'Never change the key; add identifiers as attributes.'],
      ['Where do corporate actions come from?', 'A missed CA silently corrupts positions and P&L.', [
        ['Single vendor', 'Small, liquid universe', ['Simple'], ['No cross-check']],
        ['Two vendors, scrubbed', 'Most funds', ['Disagreements surface before ex-date'], ['Two licences; exception workload']],
        ['Custodian notices as a third source', 'Large holdings in custody', ['Matches what will actually settle'], ['Arrives late; formats vary']],
      ], 'Two vendors, scrubbed', 'Release a CA only when two sources agree; use custodian notices as a final check.', 'CA volume grows enough to justify a specialist CA vendor.'],
    ],
  },
  mdhub: {
    shape: 'Two halves. Real time: feed handlers at the edge normalise vendor and exchange feeds into one tick schema, publish on a low-latency transport and fan out through entitlement-aware gateways. End of day: a pipeline gathers candidate prices per instrument, applies the source hierarchy and tolerance checks, raises exceptions, takes approvals, then locks and publishes the official price set.',
    stack: [
      ['Real-time vendor', 'Bloomberg B-PIPE or LSEG Real-Time', 'One consolidated primary feed.'],
      ['Tick transport', 'Solace or vendor distribution platform', 'Microsecond fan-out with entitlement integration.'],
      ['Snapshots & EOD', 'Kafka marketdata.* topics', 'Replayable, conflated snapshots for risk and the lake.'],
      ['Analytics', 'QuantLib / ORE; Numerix for exotics', 'Curves, surfaces, model prices.'],
      ['EOD pricing', 'Java service + Postgres', 'Hierarchy, tolerances, overrides with approval.'],
      ['Entitlements', 'DACS / EMRS', 'Exchange licence reporting.'],
    ],
    decisions: [
      ['Which real-time source?', 'Market data is one of the largest non-people costs.', [
        ['Bloomberg B-PIPE', 'Broad multi-asset coverage', ['Breadth; everyone knows the fields'], ['Expensive; strict redistribution rules']],
        ['LSEG Real-Time', 'FX and rates heavy', ['Strong FX/rates; flexible deployment'], ['Also expensive']],
        ['Direct exchange feeds', 'Latency-sensitive teams', ['Lowest latency; cheaper per message at scale'], ['A feed handler per venue to maintain']],
      ], 'Bloomberg B-PIPE', 'One consolidated vendor as primary with a second for failover, plus direct feeds only where latency is the edge.', 'Market data cost per team becomes a capital-allocation issue.'],
      ['How are ticks distributed internally?', 'Ticks are high-volume and only the latest value matters.', [
        ['Kafka', 'Conflated snapshots, EOD', ['Same platform as the backbone; replay'], ['Millisecond latency; not ideal for raw ticks']],
        ['Solace / Aeron', 'Raw ticks', ['Microsecond latency; multicast'], ['Separate infrastructure']],
        ['Vendor platform (LSEG RTDS)', 'Heavy vendor-feed use', ['Built-in entitlement (DACS)'], ['Lock-in']],
      ], 'Solace / Aeron', 'Use a low-latency transport for ticks, and Kafka for snapshots and anything that must be replayable.', 'Tick volume is low enough that Kafka alone suffices.'],
      ['Who sets the official EOD price?', 'Valuation independence is a regulatory and investor due-diligence expectation.', [
        ['Hierarchy owned by operations valuation', 'Default', ['Independent of PMs; documented policy'], ['Needs a valuation function']],
        ['Administrator’s prices', 'Small funds', ['No internal effort'], ['Late; less control over hard-to-value assets']],
        ['PM marks with review', 'Illiquid credit only, with committee', ['Uses PM expertise'], ['Conflict of interest; needs strong IPV']],
      ], 'Hierarchy owned by operations valuation', 'Ops owns the price; PM input only through a challenge process with evidence.', 'Never hand final marks to PMs.'],
    ],
  },
  bus: {
    shape: 'Kafka clusters with one topic family per business domain (trading.orders, trading.fills, positions, marketdata, refdata, cash), keyed by account and instrument so order is preserved per key. Every event has a standard envelope with event_id, correlation_id and causation_id. Producers use the transactional outbox pattern; consumers are idempotent. Vendor systems that cannot publish are bridged by CDC. Tiered storage keeps books-and-records topics for years, and the clusters are mirrored to the DR region.',
    stack: [
      ['Platform', 'Confluent Cloud or Amazon MSK', 'Managed Kafka with tiered storage.'],
      ['Schemas', 'Protobuf + Schema Registry', 'Typed contracts, compatibility enforced in CI.'],
      ['Producers', 'Transactional outbox', 'State change and event commit together.'],
      ['CDC', 'Debezium', 'Bridges vendor databases.'],
      ['Stream processing', 'Kafka Streams; Flink for heavy state', 'Enrichment and aggregation.'],
      ['DR', 'Cluster Linking / MirrorMaker 2', 'Cross-region replication.'],
    ],
    decisions: [
      ['Which streaming platform?', 'This is the spine; reliability matters more than features.', [
        ['Confluent Cloud', 'Want it fully managed', ['Schema registry, connectors, Cluster Linking included'], ['Highest cost']],
        ['Amazon MSK', 'AWS-centric', ['Cheaper; AWS-native IAM and networking'], ['Fewer extras; you assemble the ecosystem']],
        ['Redpanda', 'Latency-sensitive, small ops team', ['Kafka API with lower latency; simple to run'], ['Smaller ecosystem']],
        ['Solace', 'Bank-style guaranteed messaging', ['Very low latency; rich routing'], ['Proprietary; no long-term log']],
      ], 'Confluent Cloud', 'Pay for managed reliability; choose MSK if cost dominates and you are all-in on AWS.', 'Spend exceeds the cost of running it yourselves with confidence.'],
      ['How far do you take event sourcing?', 'Event sourcing gives perfect audit and replay but adds complexity.', [
        ['Full event sourcing', 'Positions, cash, P&L', ['State is a pure fold of events; perfect replay'], ['Hard schema evolution of history; steep learning curve']],
        ['Integration events via outbox', 'Most services', ['Pragmatic; services own their state'], ['Replay cannot rebuild a vendor’s internal state']],
        ['CDC only', 'Vendor systems you cannot change', ['No code changes'], ['Low-level row changes, not business events']],
      ], 'Integration events via outbox', 'Use transactional outbox where supported, idempotent consumers and explicit replay rules. Choose event-sourced state only where the audit and rebuild benefits justify the added complexity; use CDC to bridge vendor systems.', 'A domain needs reproducible state at arbitrary points in time and can own event-schema evolution.'],
      ['Which serialisation format?', 'Schemas are the platform’s contracts.', [
        ['Protobuf', 'gRPC-heavy estates', ['Strong typing; same IDL as service APIs'], ['Evolution rules are looser than Avro’s']],
        ['Avro', 'JVM and data-lake heavy', ['Schema-registry native; compact'], ['Clunkier outside the JVM']],
        ['JSON Schema', 'Low volume, external partners', ['Human-readable'], ['Large and weakly typed']],
      ], 'Protobuf', 'One IDL for events and APIs; enforce compatibility in CI.', 'Most consumers are data-lake tools that prefer Avro.'],
      ['How granular are topics?', 'Too few topics mix concerns; too many become unmanageable.', [
        ['Per domain aggregate (trading.orders)', 'Default', ['Related events stay ordered per key'], ['Consumers filter by event type']],
        ['Per event type', 'Very high volume types', ['Consumers subscribe narrowly'], ['Ordering across types is lost']],
      ], 'Per domain aggregate (trading.orders)', 'Ordering per order or position matters more than narrow subscriptions.', 'A single event type dominates volume.'],
    ],
  },

  // ───────────── Front office ─────────────
  research: {
    shape: 'A Kubernetes-based research platform. Each researcher gets JupyterHub with on-demand Ray clusters; data comes only through the lakehouse’s point-in-time API; code lives in per-team git repositories. A backtest service runs reproducible simulations; MLflow registers models; Dagster runs production signals and publishes them to the backbone. Research is shared by default: a firm-wide library of datasets, notes, signals and backtests that any team can discover and build on, with walls only where MNPI, wall-crossing or a team’s contract requires them.',
    stack: [
      ['Notebooks', 'JupyterHub on Kubernetes', 'Per-user environments with GPU pools.'],
      ['Distributed compute', 'Ray', 'Python-native scaling for backtests and ML.'],
      ['Dataframes', 'Polars + DuckDB', 'Fast single-node analytics.'],
      ['Hot paths', 'Rust or C++ via Python bindings', 'Backtest event loop and simulators.'],
      ['Model registry', 'MLflow', 'Versions, lineage and promotion stages.'],
      ['Production runs', 'Dagster', 'Scheduled signals with freshness SLAs.'],
    ],
    decisions: [
      ['Where does research compute run?', 'Research is bursty: idle overnight, then hundreds of cores for a parameter sweep.', [
        ['Kubernetes + Ray, self-managed', 'Platform team in place', ['Flexible; spot instances keep it cheap'], ['You run the platform']],
        ['Databricks', 'No platform team yet', ['Managed notebooks and clusters'], ['Cost; less control over environments']],
        ['Cloud ML platforms (SageMaker, Vertex)', 'Single-cloud ML focus', ['Managed MLOps'], ['Lock-in; awkward for non-ML research']],
      ], 'Kubernetes + Ray, self-managed', 'A multi-manager platform has many teams with different needs; a shared K8s platform with per-team namespaces fits best. Start on Databricks if you lack a platform team.', 'Platform operations distract from research support.'],
      ['What kind of backtester?', 'Fast iteration and realistic fills pull in opposite directions.', [
        ['Vectorised (Polars / pandas)', 'Idea screening', ['Seconds per run; easy to write'], ['Ignores fills, queueing and path effects']],
        ['Event-driven, in-house', 'Promotion to production', ['Realistic fills, costs, borrow and capacity'], ['Build and maintain']],
        ['Vendor (Deltix, QuantConnect LEAN)', 'Small quant team', ['Ready to use'], ['Fit and extensibility limits']],
      ], 'Event-driven, in-house', 'Use vectorised backtests to screen ideas and require an event-driven backtest before any signal is promoted.', 'Strategies are low-turnover enough that vectorised results match.'],
      ['How much do investment teams share?', 'Verition’s published philosophy emphasises collaboration across teams. The proposed library supports discovery and attribution while enforcing confidentiality, MNPI and contractual boundaries.', [
        ['Siloed per team', 'Platforms that compete teams against each other', ['Simple to entitle; protects each team’s IP'], ['Duplicated data spend and research', 'Contradicts a collaborative operating model']],
        ['Shared by default, walled by exception', 'Collaborative multi-strategy firms', ['Teams discover and reuse datasets, signals and research', 'One data licence serves many teams', 'Walls still applied for MNPI and wall-crossed deals'], ['Entitlement model must be precise', 'Needs clear attribution when one team uses another’s idea']],
        ['Fully open', 'Small single-office funds', ['No friction'], ['Cannot honour MNPI walls or team contracts']],
      ], 'Shared by default, walled by exception', 'This matches the firm’s integration philosophy: a firm-wide research library and shared data, with compliance-driven walls on specific issuers, deals or datasets rather than whole teams.', 'A team’s contract requires its research to stay private.'],
      ['How is cross-team contribution credited?', 'If one team’s idea drives another team’s P&L, collaboration only lasts if it is recognised.', [
        ['Not tracked', 'Informal culture', ['No overhead'], ['Collaboration fades when payouts ignore it']],
        ['Idea attribution in the research library', 'Collaborative platforms', ['Who shared what, and who used it, is recorded', 'Feeds discretionary payout and review'], ['Needs light discipline when ideas are shared']],
      ], 'Idea attribution in the research library', 'Make sharing visible so it can be rewarded in reviews and payouts.', 'Never fully; keep it lightweight.'],
    ],
  },
  pms: {
    shape: 'An event-driven service holding in-memory views of each team’s positions (from IBOR events) joined to live prices, exposing a query API and streams to the workstation. An optimiser service is called on demand. Order generation turns target-minus-current into proposed orders and submits them to the OMS. P&L comes from one central calculation shared with risk, so every screen shows the same number.',
    stack: [
      ['Core', 'Vendor PMS bundled with the OMS', 'Integrated compliance and order flow.'],
      ['Analytics layer', 'Photon candidate views plus selected in-house services', 'Assess Photon coverage, interfaces and controls before assigning a PM analytics role.'],
      ['P&L', 'Central P&L service', 'One number across PMS, risk and reporting.'],
      ['Optimiser', 'CVXPY + MOSEK; Axioma for discretionary teams', 'Constraint-rich portfolio construction.'],
      ['Cache', 'In-memory with snapshots to Postgres', 'Sub-second position views.'],
    ],
    decisions: [
      ['Buy, build, or layer?', 'PMs judge the whole platform by this screen.', [
        ['Bundled with the OMS (Enfusion, CRD, AIM)', 'Fast start', ['One system; integrated compliance'], ['Generic analytics']],
        ['Vendor core + in-house analytics layer', 'Multi-manager platforms', ['Differentiated views where they matter'], ['Two sources of positions unless IBOR is the single source']],
        ['Fully in-house', 'Systematic platforms', ['Total control'], ['Large build, including compliance integration']],
      ], 'Vendor core + in-house analytics layer', 'Make the IBOR the single source of positions and build team analytics on its events.', 'The vendor’s analytics are good enough for every team.'],
      ['Where is P&L calculated?', 'Different P&L numbers on different screens destroy trust.', [
        ['Inside the PMS', 'Single-system shops', ['Simple'], ['Risk and reporting compute their own, and they drift']],
        ['Central P&L service', 'Default', ['One number everywhere; explains by price, FX, carry, trades'], ['Another service to own']],
      ], 'Central P&L service', 'Team payouts are based on P&L; it must be one number.', 'Never in a multi-manager platform.'],
      ['Can teams net or cross orders?', 'Teams often trade opposite sides of the same name.', [
        ['Teams trade independently', 'Default', ['Clean attribution and autonomy'], ['Both sides pay spread and commission']],
        ['Central internal crossing', 'At scale with compliance sign-off', ['Saves costs'], ['Fairness, information leakage and wash-trade controls']],
      ], 'Teams trade independently', 'Start independent; add an internal crossing engine only with compliance sign-off and fair-pricing rules.', 'Opposite-side volume across teams becomes a material cost.'],
    ],
  },
  risk: {
    shape: 'Streaming and batch together. Streaming: exposures from positions × prices × sensitivities, refreshed within a minute, with drawdown and gross/net limits checked continuously. Batch: EOD VaR, stress and liquidity on an elastic grid. Results land in a columnar risk store with dimensions (firm, strategy group, team, factor, instrument) so they can be sliced interactively. A limits service turns measures into breaches and escalations.',
    stack: [
      ['Real-time risk aggregation', 'Photon candidate, subject to coverage and control review', 'The reported licence informs the assessment; production role, rights and capabilities require internal validation.'],
      ['Factor models', 'MSCI Barra or Axioma', 'Industry-standard risk language for CIO and investors; complement with specialist factor and crowding analysis as needed.'],
      ['Pricing library', 'QuantLib / ORE; Numerix for exotics', 'Full revaluation and Greeks.'],
      ['Grid', 'Kubernetes on spot instances (Ray or Armada)', 'Elastic EOD compute.'],
      ['Risk store', 'ClickHouse', 'Fast slice-and-dice over billions of rows.'],
      ['Streaming exposures', 'Flink / Kafka Streams', 'Intraday limits.'],
      ['Limits & workflow', 'Kotlin service + Postgres', 'Breaches, escalation, sign-off.'],
    ],
    decisions: [
      ['What role should Photon play?', 'Assess the reported licensed platform across Verition’s four strategy groups; detailed capabilities and production status are not established publicly.', [
        ['Integrate after coverage validation', 'Coverage, data rights, support and controls pass review', ['Build on the selected capability where it fits', 'Limits initial dependency to proven areas'], ['Requires a fit-gap and control review']],
        ['Use for selected strategy groups', 'Coverage is strong in some asset classes only', ['Preserves best-fit specialist workflows', 'Reduces replacement risk'], ['Requires central reconciliation across multiple tools']],
        ['Keep as a limited research / comparison source', 'Production readiness or rights are not established', ['Low control risk while diligence continues'], ['Duplicates work and may defer benefits']],
      ], 'Integrate after coverage validation', 'Start with read-only feeds and shadow comparisons. Expand only after control owners accept coverage, reconciliation, recovery and licensing evidence. Keep an independent check.', 'A formal product and operating review confirms a wider or narrower scope.'],
      ['How should Photon receive data?', 'A proposed Photon integration needs approved, supportable interfaces while preserving clear ownership of positions and accounting books.', [
        ['Consume the event backbone', 'Default', ['Same events as IBOR, PMS and risk; replayable', 'No point-to-point feeds to maintain'], ['Vendor needs an adapter to the canonical event model']],
        ['Point integrations to OMS and PBs', 'Fast start', ['Quick to wire up'], ['Fragile; diverges from IBOR; every new source is a project']],
        ['Platform keeps its own positions', 'Only if it is also the IBOR', ['Self-contained'], ['Two position truths that will drift']],
      ], 'Consume the event backbone', 'Feed the risk platform from governed position and market-data interfaces; reconcile views to the IBOR.', 'The product is formally selected as the IBOR and the other book is retired.'],
      ['What rights and continuity are needed for Photon?', 'Confirm the actual licence, support, data portability, source-access and exit terms before production dependency grows.', [
        ['Use the contracted service as-is', 'Capabilities are complete and service commitments are strong', ['Fastest start', 'Vendor owns maintenance'], ['Limited control and possible exit dependency']],
        ['Negotiate operational protections', 'The capability is important to production', ['Clear support, data access, change, continuity and exit terms'], ['Commercial and legal effort']],
        ['Build an alternative / exit path', 'Dependency or coverage risk is unacceptable', ['More control and bargaining power'], ['Duplicate cost and delivery effort']],
      ], 'Negotiate operational protections', 'Make rights, support, recovery, data portability and termination / transition explicit before production dependency grows. Do not assume source-code ownership or staffing arrangements.', 'Contract review and product diligence establish the actual dependency profile.'],
      ['Which factor model?', 'Central risk may use common factor exposures to compare teams and identify concentration; validate the desired model universe and reporting requirements.', [
        ['MSCI Barra', 'Investor and regulator familiarity', ['Industry standard; widely recognised'], ['Expensive; slower model updates']],
        ['Axioma', 'Flexibility', ['Custom and fast-updating models'], ['Also expensive']],
        ['In-house', 'Quant-heavy firms', ['Fits your factors'], ['Validation burden; not recognised externally']],
      ], 'Axioma', 'Use a vendor model as the firm’s common language, and let quant teams add custom factors on top.', 'Investors require a specific vendor in reporting.'],
      ['Which VaR method?', 'Each method fails in different ways.', [
        ['Historical simulation, full revaluation', 'Most books', ['No distribution assumption; explainable'], ['Window choice drives results']],
        ['Parametric', 'Quick intraday estimates', ['Fast'], ['Poor for options and fat tails']],
        ['Monte Carlo', 'Options-heavy books', ['Handles non-linearity'], ['Compute-heavy']],
      ], 'Historical simulation, full revaluation', 'Historical VaR plus stress tests as the primary measures; Monte Carlo for options teams.', 'Options exposure becomes a large share of firm risk.'],
      ['Real-time or EOD limits?', 'In multi-manager funds the drawdown stop is the most important control.', [
        ['Intraday for gross, net, drawdown and concentration', 'Default', ['Catches losses while they happen'], ['Needs streaming infrastructure']],
        ['EOD only', 'Small single-strategy funds', ['Simple'], ['A team can blow through a limit intraday']],
      ], 'Intraday for gross, net, drawdown and concentration', 'Monitor simple measures intraday and VaR and stress at EOD.', 'Never relax for drawdown.'],
      ['How are risk numbers independently checked?', 'Verition publicly describes internal and external risk controls. Proposed independent checks should challenge the inputs, models and outputs of Photon and other engines.', [
        ['Internal only', 'Small funds', ['No extra cost'], ['No independent check of models or data']],
        ['External risk service, compared monthly', 'Default for institutional funds', ['Independent VaR, exposures and liquidity; strong for investor due diligence'], ['Vendor cost; mapping differences to explain']],
        ['External service, compared daily', 'Large, complex books', ['Problems found within a day'], ['Daily reconciliation effort']],
      ], 'External risk service, compared monthly', 'Run your own engine for decisions and an independent provider as the check; tighten to daily for the most complex books.', 'Investors or the board ask for daily independent risk.'],
      ['Where is risk computed?', 'Risk needs elastic compute at EOD and fast queries during the day.', [
        ['Cloud grid in-house', 'Custom models and views', ['Cheap on spot; full control'], ['You run it']],
        ['Vendor SaaS (MSCI RiskManager)', 'Small risk team', ['No infrastructure'], ['Data upload latency; less customisation']],
      ], 'Cloud grid in-house', 'Run in-house compute with vendor model data for the flexibility central risk needs.', 'The risk team is too small to own a grid.'],
    ],
  },
  compliance: {
    shape: 'A pre-trade engine colocated with the OMS, holding rules and a position cache in memory so each check takes milliseconds. A post-trade batch runs the same rules on EOD positions. A separate disclosure monitor aggregates holdings by issuer across every fund and affiliate. Breaches flow into case management with full evidence.',
    stack: [
      ['Pre-trade', 'OMS-embedded rules engine', 'Synchronous, regulator-tested rule library.'],
      ['Custom rules', 'Kotlin / Python rules with test harness', 'Firm-specific aggregation and team mandates.'],
      ['Disclosure monitor', 'In-house service over IBOR + entity master', 'Issuer-level aggregation across funds.'],
      ['Surveillance', 'NICE Actimize or Nasdaq SMARTS', 'Market-abuse patterns.'],
      ['Comms surveillance', 'Behavox / Global Relay', 'Email, chat and voice.'],
    ],
    decisions: [
      ['Which rules engine?', 'Every order must be checked in milliseconds, with no path around it.', [
        ['OMS-embedded (CRD, AIM, Eze)', 'Default', ['Tight integration; maintained rule library'], ['Limited custom aggregation']],
        ['Standalone vendor engine', 'Several OMSs', ['One engine across order sources'], ['Adds latency; integration work']],
        ['In-house engine', 'Highly bespoke mandates', ['Full flexibility'], ['Validation and regulatory burden']],
      ], 'OMS-embedded (CRD, AIM, Eze)', 'Use the OMS engine for pre-trade, with in-house services for issuer-level disclosure and team-specific rules.', 'Teams run on several OMSs.'],
      ['How are custom rules written?', 'Rules change with regulation and team mandates.', [
        ['Vendor rule DSL', 'Standard rules', ['Business-editable'], ['Hard to test at scale']],
        ['Rules as code with a test harness', 'Custom rules', ['Versioned, reviewed, regression-tested on historical books'], ['Needs engineers']],
      ], 'Rules as code with a test harness', 'Every custom rule gets tests against real historical portfolios before release.', 'Compliance wants to self-serve simple threshold changes.'],
      ['Firm-wide or team-level restrictions after a wall-crossing?', 'A deal team may be wall-crossed while other teams remain eligible to trade. Scope restrictions narrowly and monitor information barriers.', [
        ['Firm-wide restriction', 'Simple compliance model', ['Easiest to evidence'], ['Blocks unrelated teams; costly in a multi-strategy firm']],
        ['Team-level wall with surveillance', 'Multi-strategy firms with strong barriers', ['Only the crossed team is restricted', 'Other teams keep trading'], ['Needs proven information barriers, entitlements and monitoring']],
      ], 'Team-level wall with surveillance', 'It keeps capital-markets participation from freezing the rest of the firm, provided barriers are enforced in IAM, the research library and communications surveillance.', 'Surveillance shows leakage across a wall.'],
      ['Who can override a warning?', 'Too strict and PMs lose trades; too loose and you lose your licence.', [
        ['PM overrides soft warnings with a reason', 'Soft limits', ['Fast'], ['Risk of rubber-stamping']],
        ['Compliance approves every override', 'Hard limits and regulatory rules', ['Strong control'], ['Slows trading']],
      ], 'PM overrides soft warnings with a reason', 'Tiered: PMs may override soft warnings with a reason; regulatory and hard limits block and need compliance.', 'Override rates show rubber-stamping.'],
    ],
  },
  capital: {
    shape: 'A service of record for capital: every allocation to a strategy group, investment team and book, with effective dates and the decision behind it. It consumes central P&L and risk intraday, evaluates drawdown rules, and publishes capital changes that immediately rescale limits in risk and compliance. A monthly payout engine works from official books. A management cockpit gives senior management the live firm picture that lets investment teams get fast decisions.',
    stack: [
      ['Store', 'PostgreSQL (bitemporal)', 'Capital history must be reproducible for payouts and disputes.'],
      ['Analytics', 'Lakehouse + ClickHouse', 'Team performance and correlation at any horizon.'],
      ['Rules', 'Streaming rules on P&L events (Kafka Streams)', 'Intraday drawdown evaluation.'],
      ['Optimiser', 'CVXPY + MOSEK', 'Risk-budget allocation proposals.'],
      ['Workflow', 'Temporal', 'Allocation approvals, onboarding and wind-down.'],
      ['Cockpit', 'Workstation module (React)', 'Firm → team → position drill-down.'],
    ],
    decisions: [
      ['How is capital allocated across teams?', 'Verition’s stated approach reallocates capital as the opportunity set and risk/reward change. The proposed workflow makes team budgets, approvals and resulting limits explicit.', [
        ['Fixed allocations, reviewed annually', 'Stable single-strategy firms', ['Predictable for teams'], ['Slow to move capital to opportunity']],
        ['Rules-based (risk budget × performance)', 'Large platforms wanting consistency', ['Transparent and repeatable'], ['Mechanical; misses regime changes and qualitative views']],
        ['CIO discretion informed by a model', 'Dynamic multi-strategy allocation', ['Combines quantitative evidence with judgement', 'Matches “dynamic capital allocation”'], ['Must record rationale to stay consistent and fair']],
      ], 'CIO discretion informed by a model', 'The model proposes from risk budget, risk-adjusted returns and correlation; the CIO decides; every decision is recorded with its reason.', 'The number of teams makes discretionary review impractical.'],
      ['How are drawdowns handled?', 'Drawdown discipline is what protects the firm and its investors from any one team.', [
        ['Hard stop at a single threshold', 'Simple', ['Clear and fast'], ['Abrupt; forces selling at the worst time']],
        ['Tiered: capital cut, then stop', 'Most multi-manager platforms', ['Gives teams a chance to recover with less risk'], ['More rules to communicate and monitor']],
        ['Discretionary review only', 'Small firms', ['Flexible'], ['Inconsistent; slow in a crisis']],
      ], 'Tiered: capital cut, then stop', 'Evaluate intraday from central P&L; actions apply automatically to limits; senior management reviews within the day.', 'A strategy’s natural volatility makes the thresholds trigger on noise.'],
      ['Which measure drives allocation?', 'Rewarding raw returns encourages risk-taking; rewarding Sharpe alone ignores diversification.', [
        ['Raw P&L', 'Never alone', ['Simple'], ['Rewards leverage and luck']],
        ['Risk-adjusted return (Sharpe, return on risk)', 'Default component', ['Rewards skill per unit of risk'], ['Ignores correlation to the rest of the firm']],
        ['Marginal contribution to firm Sharpe', 'Diversified multi-strategy', ['Rewards teams that diversify the firm, matching a low-correlation goal'], ['Harder to explain to teams']],
      ], 'Marginal contribution to firm Sharpe', 'Assess team contribution alongside risk, capacity, liquidity, diversification and operational cost, consistent with the firm’s diversification objective.', 'Teams cannot follow the measure; publish a simpler companion metric.'],
      ['How are costs charged to teams?', 'Financing, market data, execution and technology costs are large and uneven across teams.', [
        ['Not charged', 'Small firms', ['Simple'], ['Teams over-consume shared resources']],
        ['Direct costs only (financing, execution)', 'Common', ['Easy to measure'], ['Data and technology costs hidden']],
        ['Full cost allocation with clear drivers', 'Large platforms', ['True net contribution per team'], ['Allocation keys can be disputed']],
      ], 'Direct costs only (financing, execution)', 'Start with direct costs measured from systems; add data and technology costs once usage is metered.', 'Shared-cost growth outpaces team P&L.'],
    ],
  },
  oms: {
    shape: 'A vendor OMS, usually SaaS, integrated through FIX and vendor APIs. Pre-trade compliance is embedded. Orders, fills and allocations reach the backbone through vendor event streams or a FIX drop copy, never by reading the vendor’s database. Allocation rules are configuration, versioned and reviewed.',
    stack: [
      ['OMS', 'Enfusion, Eze or Charles River', 'Mature order lifecycle and compliance.'],
      ['Integration', 'FIX 4.4 + vendor REST / event APIs', 'Standard protocols, no database coupling.'],
      ['Event bridge', 'Drop copy + vendor events → Kafka', 'Independent record of every execution.'],
      ['Hosting', 'Vendor SaaS', 'Vendor runs upgrades and regulatory change.'],
    ],
    decisions: [
      ['Which OMS vendor?', 'The OMS is expensive to replace once embedded.', [
        ['Charles River (State Street)', 'Large, multi-asset, institutional scale', ['Deep compliance; multi-asset'], ['Heavy; long implementation']],
        ['Enfusion', 'Hedge funds wanting front-to-back in one', ['Fast deployment; integrated PMS, risk and accounting'], ['Less customisable at very large scale']],
        ['Eze (SS&C)', 'Equity-heavy hedge funds', ['Hedge-fund focus; strong EMS'], ['Integration into non-SS&C back office']],
        ['Bloomberg AIM', 'Fixed income heavy; Bloomberg-centric', ['Tight Bloomberg integration'], ['Lock-in']],
      ], 'Enfusion', 'Shortlist by asset-class mix and scale: Enfusion or Eze for speed, Charles River once you reach institutional scale across many teams.', 'Team count or asset classes outgrow the product.'],
      ['Combined OEMS or separate OMS and EMS?', 'Execution needs differ widely by asset class.', [
        ['Combined OEMS', 'Equities-led', ['One vendor; no OMS–EMS integration'], ['Weaker in some asset classes']],
        ['Separate best-of-breed', 'Futures, FX and credit desks', ['Best tool per asset class'], ['More integrations']],
      ], 'Combined OEMS', 'Use an OEMS for equities, and add specialist EMSs (futures, FX) only where needed.', 'Execution quality in an asset class lags.'],
      ['How do OMS events reach the backbone?', 'Everything downstream depends on getting orders and fills out reliably.', [
        ['Vendor event stream / webhooks', 'Vendor supports it', ['Business events, supported'], ['Vendor-specific']],
        ['FIX drop copy', 'Always, as a second source', ['Standard; independent'], ['No allocation detail']],
        ['CDC from the vendor database', 'Self-hosted only', ['Complete'], ['Breaks on vendor upgrades; may void support']],
      ], 'Vendor event stream / webhooks', 'Use vendor events as primary and a drop copy for reconciliation. Never couple to the vendor’s schema.', 'The vendor has no event API; then drop copy plus API polling.'],
    ],
  },
  ems: {
    shape: 'A vendor EMS per asset class with broker algo connectivity through the FIX hub. Optional in-house smart order router and algos for systematic teams via direct market access. Pre- and post-trade TCA feed the best-execution committee.',
    stack: [
      ['Equities EMS', 'FlexTrade or Virtu Triton', 'Broker-neutral, strong algo access.'],
      ['Futures', 'Trading Technologies', 'Futures-native workflow.'],
      ['FX', 'FXall / 360T', 'Multi-dealer FX.'],
      ['TCA', 'Vendor TCA + in-house analysis in the lake', 'Independent measurement.'],
    ],
    decisions: [
      ['Broker algos, in-house algos, or an algo wheel?', 'Execution cost is a direct drag on team returns.', [
        ['Broker algos', 'Default for discretionary teams', ['No build; access to broker liquidity'], ['Black box; information leakage']],
        ['Algo wheel', 'Many brokers, best-ex evidence', ['Unbiased broker selection with measurable results'], ['Needs volume to be statistically meaningful']],
        ['In-house algos via DMA', 'Systematic teams', ['Control and lower cost'], ['You carry SEC 15c3-5 / MiFID II RTS 6 obligations']],
      ], 'Algo wheel', 'Run an algo wheel across broker algos for discretionary flow; let systematic teams use in-house execution with market-access controls.', 'A team’s turnover makes in-house execution pay off.'],
      ['How is TCA done?', 'Best execution must be evidenced, not asserted.', [
        ['Vendor TCA', 'Default', ['Independent; peer benchmarks'], ['Cost; limited customisation']],
        ['In-house on lake data', 'Quant teams', ['Custom benchmarks'], ['Not independent']],
      ], 'Vendor TCA', 'Use vendor TCA for the committee and in-house analysis for teams’ own research.', 'Never drop independent TCA.'],
    ],
  },
  fixgw: {
    shape: 'A central FIX hub. Internal systems connect once to the hub; the hub holds every external session, translates dialects and routes by destination. Raw messages are journaled. A managed network provider carries most broker sessions; colocation cross-connects serve only latency-sensitive flow.',
    stack: [
      ['Network', 'Managed extranet (TNS, IPC, BT Radianz)', 'Resilient, broker-standard connectivity.'],
      ['FIX engine', 'Onix / B2BITS or QuickFIX/J', 'Session management and persistence.'],
      ['Routing', 'Rules-based hub', 'One internal connection per system.'],
      ['Journal', 'Append-only store + lake', 'Every raw message for audit.'],
    ],
    decisions: [
      ['Which FIX engine?', 'FIX sessions are business-critical during market hours.', [
        ['QuickFIX/J', 'Moderate volumes', ['Free; widely known'], ['Community support only']],
        ['Commercial engine (Onix, B2BITS)', 'High volume or low latency', ['Performance and vendor support'], ['Licence']],
        ['Managed FIX network (NYFIX, TNS)', 'Many broker connections', ['Provider handles sessions and certification'], ['Per-connection cost; less control']],
      ], 'Managed FIX network (NYFIX, TNS)', 'Outsource broker connectivity to a managed network; run a commercial engine for the internal hub.', 'Connection count makes per-session fees material.'],
      ['How do you connect?', 'Latency, resilience and cost trade off directly.', [
        ['Internet with TLS', 'Low-volume, non-latency-sensitive', ['Cheap; quick to set up'], ['Jitter; weaker resilience']],
        ['Extranet', 'Default', ['Resilient; brokers already on it'], ['Monthly cost']],
        ['Colo cross-connect', 'Latency-sensitive DMA', ['Lowest latency'], ['Expensive; physical presence']],
      ], 'Extranet', 'Use an extranet by default, with colo only where latency is the edge.', 'A systematic team’s edge depends on microseconds.'],
      ['Central hub or direct connections?', 'Several internal systems need external sessions.', [
        ['Central FIX hub', 'Default', ['One place to monitor, certify and journal'], ['Hub is critical; needs HA']],
        ['Each system connects directly', 'Single-system shops', ['Fewer hops'], ['Duplicate sessions, monitoring and certification']],
      ], 'Central FIX hub', 'One hub makes onboarding a broker a single project, not one per system.', 'Never at multi-manager scale.'],
    ],
  },

  // ───────────── Middle & back office ─────────────
  ibor: {
    shape: 'An event-sourced position service. It consumes fills, allocations, corporate actions and settlement events, maintains position state in a stateful stream processor, snapshots to Postgres for queries and publishes PositionChanged events. Each day opens from the reconciled prior close. Position keys include fund, team/book, instrument and custodian/PB, so the same data serves trading and reconciliation.',
    stack: [
      ['Processing', 'Kafka Streams (Flink at large scale)', 'Stateful processing with idempotency, checkpoints, replay and reconciliation.'],
      ['State', 'RocksDB state stores + Postgres snapshots', 'Fast updates, queryable history.'],
      ['API', 'gRPC + position topics', 'Pull or stream positions.'],
      ['Lots', 'In-house lot engine', 'Fund-specific cost-basis policy.'],
    ],
    decisions: [
      ['Where does the IBOR live?', 'Every front-office number starts with positions.', [
        ['Operations platform IBOR (Arcesium, Enfusion)', 'Small and mid-size funds', ['Included; integrated with accounting'], ['Latency and flexibility limits for many teams']],
        ['OMS positions', 'Single-strategy funds', ['No extra system'], ['Misses non-OMS activity: CAs, transfers, OTC']],
        ['In-house event-sourced IBOR', 'Large multi-manager platforms', ['Real-time, consistent positions for every team; replayable'], ['Significant build and ownership']],
      ], 'In-house event-sourced IBOR', 'A multi-manager platform needs one real-time position truth across teams; vendor IBORs struggle at that scale.', 'You are early-stage; start on the platform IBOR and migrate later.'],
      ['Which stream processor?', 'Positions must be exactly right and recover by replay.', [
        ['Kafka Streams', 'Up to mid scale', ['Simple deployment model; supports transactional processing'], ['Rebalancing large state is slow']],
        ['Flink', 'Large state, complex joins', ['Mature stateful processing at scale'], ['Cluster to operate']],
        ['Service + database', 'Low volume', ['Simple'], ['Throughput limits; replay is slow']],
      ], 'Kafka Streams', 'Start with Kafka Streams; move to Flink when state or join complexity demands it.', 'State restore times exceed your recovery objective.'],
      ['What is the position key?', 'Finer keys help recon; coarser keys perform better.', [
        ['Fund + book + instrument', 'Simple', ['Low cardinality'], ['Cannot reconcile per custodian or PB']],
        ['Fund + book + instrument + custodian/PB', 'Multi-prime', ['Reconciles directly to each counterparty'], ['Higher cardinality; transfers between PBs become events']],
      ], 'Fund + book + instrument + custodian/PB', 'Multi-prime set-ups need location in the key to reconcile cleanly.', 'Never drop location in a multi-prime set-up.'],
    ],
  },
  posttrade: {
    shape: 'An operations-platform module that turns allocation events into broker allocations, matches confirmations in CTM, affirms on trade date, notifies prime brokers and hands affirmed trades to settlement. Exceptions flow to the operations console.',
    stack: [
      ['Matching', 'DTCC CTM', 'Central matching and affirmation.'],
      ['OTC confirms', 'MarkitSERV / DTCC', 'Electronic derivative confirmation.'],
      ['Platform', 'Arcesium, SS&C or Broadridge', 'Workflow and exception handling.'],
      ['PB notifications', 'FIX + SFTP files', 'Per-PB formats.'],
    ],
    decisions: [
      ['Central matching or bilateral confirms?', 'US T+1 leaves hours, not days, to fix mismatches.', [
        ['DTCC CTM', 'Equities and fixed income', ['Industry standard; same-day affirmation'], ['Per-trade fees']],
        ['Bilateral with brokers', 'Low volume', ['No utility cost'], ['Manual, slow, error-prone']],
      ], 'DTCC CTM', 'Same-day affirmation is impractical at volume without central matching.', 'Never at scale.'],
      ['Buy the platform or orchestrate in-house?', 'Post-trade is commodity but must be reliable.', [
        ['Operations platform', 'Default', ['Proven workflows; utility connectivity included'], ['Licence']],
        ['In-house orchestration', 'Unusual products', ['Fits exactly'], ['Commodity build with high operational risk']],
      ], 'Operations platform', 'There is no edge in post-trade; buy and integrate.', 'Products the platform cannot handle become material.'],
    ],
  },
  settlement: {
    shape: 'An SSI store enriched from DTCC ALERT feeds an instruction generator that sends SWIFT messages to custodians and tracks status through to settlement. A treasury system handles payments, sweeps and cash forecasting; FX is executed on multi-dealer platforms.',
    stack: [
      ['SSIs', 'DTCC ALERT', 'Industry SSI database.'],
      ['Messaging', 'SWIFT via service bureau or Alliance Lite2', 'MT54x today; ISO 20022 ready.'],
      ['Treasury', 'Kyriba', 'Payments, bank connectivity, forecasting.'],
      ['FX execution', 'FXall / 360T', 'Competitive multi-dealer FX.'],
    ],
    decisions: [
      ['How do you connect to SWIFT?', 'Settlement instructions and cash statements run on SWIFT.', [
        ['Service bureau', 'Most hedge funds', ['No SWIFT infrastructure to run'], ['Per-message fees']],
        ['Alliance Lite2 / direct', 'High volume', ['Direct control'], ['Membership, security attestation (CSP)']],
        ['Custodian portals only', 'Very small funds', ['No SWIFT at all'], ['Manual; no straight-through processing']],
      ], 'Service bureau', 'Gets you SWIFT without operating it; move direct only at high volume.', 'Message volumes make bureau fees material.'],
      ['Which message standard?', 'Cross-border payments moved to ISO 20022 in November 2025; securities still mostly use MT.', [
        ['Support both MT and ISO 20022', 'Default', ['Works with every counterparty'], ['Two formats to maintain']],
        ['ISO 20022 only', 'Future state', ['Richer data'], ['Some custodians are not ready for securities']],
      ], 'Support both MT and ISO 20022', 'Use a translation layer so internal systems see one canonical model.', 'Custodians drop MT for securities settlement.'],
      ['Spreadsheets or a treasury system?', 'Cash is where operational fraud happens.', [
        ['Treasury management system', 'Default', ['Dual authorisation, bank connectivity, audit'], ['Licence']],
        ['Spreadsheets and bank portals', 'Tiny funds', ['No cost'], ['Fraud and error risk; no audit']],
      ], 'Treasury management system', 'Payment controls are non-negotiable for investors’ due diligence.', 'Never.'],
    ],
  },
  collateral: {
    shape: 'Agreement data (CSAs, PB agreements) drives a margin calculator; calls are exchanged electronically through AcadiaSoft; a PB margin analytics layer replicates each prime broker’s methodology for what-ifs; movements go to settlement with dual approval.',
    stack: [
      ['Margin calls', 'AcadiaSoft MarginSphere', 'Industry utility for OTC calls.'],
      ['Collateral management', 'CloudMargin or Calypso', 'Inventory, eligibility, optimisation.'],
      ['PB margin analytics', 'Cassini or in-house', 'Replicate and compare PB margin.'],
      ['SIMM', 'Vendor SIMM calculator', 'Initial margin under UMR.'],
    ],
    decisions: [
      ['Trust PB margin, or replicate it?', 'PB margin drives available leverage, so a team’s capacity.', [
        ['Accept PB figures', 'Low leverage', ['No effort'], ['No what-if; surprises after market moves']],
        ['Vendor margin analytics (Cassini)', 'Multi-prime', ['Replicates methodologies; compares PBs'], ['Licence']],
        ['In-house replication', 'Very large books', ['Full control'], ['Methodologies change; maintenance burden']],
      ], 'Vendor margin analytics (Cassini)', 'Multi-prime funds save real money by placing positions where margin is lowest.', 'Leverage is low enough that margin is not binding.'],
      ['How is collateral chosen?', 'Delivering the wrong asset is expensive.', [
        ['Manual selection', 'Few agreements', ['Simple'], ['Suboptimal; slow under stress']],
        ['Rules-based (cheapest eligible first)', 'Default', ['Consistent'], ['Not globally optimal']],
        ['Optimiser', 'Many agreements and assets', ['Lowest funding cost'], ['Complex; vendor needed']],
      ], 'Rules-based (cheapest eligible first)', 'Start rules-based; add optimisation when agreements multiply.', 'Funding cost becomes a visible drag.'],
    ],
  },
  accounting: {
    shape: 'A vendor accounting engine holding the general ledger per fund and share class. It receives IBOR activity, official prices and capital activity, generates journals, accrues income and fees, and strikes a shadow NAV that is tied out daily to the administrator. A fee engine is independently recomputed every period.',
    stack: [
      ['Accounting engine', 'SS&C Geneva or Arcesium', 'Hedge-fund portfolio accounting standard.'],
      ['Inputs', 'Batch + events from IBOR, pricing, TA', 'Clean, reconciled inputs.'],
      ['Fee check', 'Independent fee model (Python)', 'Recompute incentive fees per series.'],
      ['NAV workflow', 'Workflow engine + ops console', 'Checklist with evidence and sign-off.'],
    ],
    decisions: [
      ['Which accounting engine?', 'Administrators, auditors and investors all depend on these books.', [
        ['SS&C Geneva', 'Most hedge funds', ['Industry standard; admins know it'], ['Older technology; needs specialist skills']],
        ['Arcesium', 'Large multi-manager platforms', ['Modern data platform, front-to-back'], ['Cost; aimed at larger funds']],
        ['Enfusion', 'Integrated with its OMS', ['One system front-to-back'], ['Less suited to complex structures']],
      ], 'SS&C Geneva', 'Geneva for compatibility with administrators, or Arcesium if you want one modern platform front-to-back.', 'You are choosing a full operations platform anyway.'],
      ['Full shadow NAV, or rely on the admin?', 'The admin produces the official NAV; how much do you check?', [
        ['Full shadow NAV', 'Large or complex funds', ['Independent control; faster estimates; investors expect it'], ['Duplicates admin work']],
        ['Shadow-lite: positions and P&L only', 'Mid-size funds', ['Cheaper'], ['Fees and expenses unchecked']],
        ['Rely on the admin', 'Small funds', ['Lowest cost'], ['Late detection of errors']],
      ], 'Full shadow NAV', 'Multi-manager structures have complex fees and pass-through expenses; check them yourself.', 'Never at multi-manager scale.'],
      ['Equalisation or series accounting?', 'Performance fees must be fair to investors who joined at different times.', [
        ['Series accounting', 'Offshore funds, simpler calculations', ['Each series has its own high-water mark'], ['Many series to roll up and report']],
        ['Equalisation', 'Single NAV per class', ['One NAV for investors'], ['Complex calculations and statements']],
      ], 'Series accounting', 'Easier to explain and audit; roll series up at each crystallisation.', 'The offering documents mandate equalisation.'],
    ],
  },
  recon: {
    shape: 'A reconciliation service ingesting every counterparty file and internal snapshot, normalising to a common shape, matching with rules and tolerances, and pushing breaks into the exception inbox. File-arrival monitoring raises an alert when an expected file is missing.',
    stack: [
      ['Matching', 'Duco', 'Cloud, no-code rules, fast onboarding of new feeds.'],
      ['Ingestion', 'Managed file transfer + SWIFT', 'All counterparty formats.'],
      ['Breaks', 'Exception inbox in the ops console', 'One queue across systems.'],
      ['Analytics', 'Lakehouse', 'Break trends and root causes.'],
    ],
    decisions: [
      ['Which reconciliation tool?', 'New counterparties and products appear constantly.', [
        ['Duco', 'Changing feeds, many counterparties', ['Self-service rules; fast onboarding'], ['Per-reconciliation pricing']],
        ['SmartStream TLM', 'Very high volume', ['Mature, high throughput'], ['Heavy; slower changes']],
        ['Platform built-in (Arcesium, Geneva)', 'Single platform', ['Integrated'], ['Less flexible across systems']],
      ], 'Duco', 'Feed agility matters more than raw throughput for most hedge funds.', 'Volumes outgrow its pricing model.'],
      ['How often do you reconcile?', 'A position break found next morning may already have caused a bad trade.', [
        ['EOD only', 'Low turnover', ['Simple'], ['Breaks found a day late']],
        ['Intraday for positions and cash at PBs', 'Multi-manager, high turnover', ['Breaks found within hours'], ['Needs PB intraday files or APIs']],
      ], 'Intraday for positions and cash at PBs', 'Teams trade fast; position errors compound.', 'PBs cannot provide intraday data.'],
    ],
  },
  reporting: {
    shape: 'A governed reporting mart in the lakehouse, built with dbt from accounting, risk and IBOR data, with field-level lineage. Filing tools read from the mart; investor reports are generated from templates; everything passes four-eyes review in a workflow before release.',
    stack: [
      ['Data mart', 'dbt on Snowflake / Databricks', 'One governed source for all reports.'],
      ['Regulatory filings', 'Vendor filing tool', 'Schemas, validation, submission.'],
      ['Investor reports', 'Templated PDF generation', 'Consistent letters and factsheets.'],
      ['Review', 'Workflow with sign-off', 'Evidence for regulators.'],
    ],
    decisions: [
      ['Who produces regulatory filings?', 'Form PF and Annex IV need risk data the admin does not have.', [
        ['In-house mart + vendor filing tool', 'Default', ['Control over data; vendor handles formats'], ['Mart to build and own']],
        ['Fully outsourced to admin or consultant', 'Small funds', ['Low effort'], ['You still supply risk data; less control']],
      ], 'In-house mart + vendor filing tool', 'You own the numbers and their lineage; the vendor owns schemas and submission.', 'Filing scope is small enough to outsource.'],
      ['Self-report transactions or delegate?', 'MiFIR and EMIR reporting is detailed and penalised for errors.', [
        ['Delegate to brokers', 'Where available', ['Low effort'], ['You remain responsible for accuracy']],
        ['Self-report via an approved reporting mechanism', 'Large or OTC-heavy', ['Control and consistency'], ['Build and testing burden']],
      ], 'Delegate to brokers', 'Delegate where possible, with independent QA (e.g. Kaizen) over what is reported.', 'Delegated reporting quality fails QA.'],
    ],
  },
  ta: {
    shape: 'Usually run by the administrator on its transfer-agency system, with an in-house layer for side letters, investor relations and capital-activity forecasting fed back to capital allocation.',
    stack: [
      ['TA system', 'Administrator', 'Register, dealing and KYC.'],
      ['Screening', 'Vendor sanctions / PEP screening', 'Ongoing monitoring.'],
      ['Side letters', 'In-house register', 'MFN tracking and terms.'],
      ['CRM', 'Salesforce / Backstop', 'Investor relationships.'],
    ],
    decisions: [
      ['Outsource transfer agency or run in-house?', 'TA is regulated, PII-heavy and not a source of edge.', [
        ['Administrator as TA', 'Default', ['Experienced, regulated, independent'], ['Less control over timelines']],
        ['In-house TA', 'Very large, with specific needs', ['Control'], ['Regulatory burden; KYC operations']],
      ], 'Administrator as TA', 'Independent TA is what investors expect.', 'Rarely.'],
      ['How are side letters managed?', 'MFN clauses mean one investor’s terms can apply to others.', [
        ['Spreadsheet', 'A handful of letters', ['Quick'], ['MFN obligations get missed']],
        ['Structured register', 'Default', ['Queryable terms; MFN elections tracked'], ['Data entry effort']],
      ], 'Structured register', 'Missed MFN obligations are a common audit finding.', 'Never at scale.'],
    ],
  },

  // ───────────── Platform ─────────────
  iam: {
    shape: 'One identity provider for employees and services, an authorisation service that every API, topic and table consults, and a shared maker-checker service. Policies are written as code over attributes: fund, team, data class and action. Information barriers are policies, tested like code.',
    stack: [
      ['Identity provider', 'Okta or Microsoft Entra ID', 'SSO and MFA.'],
      ['Authorisation', 'Open Policy Agent or Cedar', 'Policy as code, evaluated everywhere.'],
      ['Fine-grained relationships', 'OpenFGA (optional)', 'Team → book → user relationships.'],
      ['Privileged access', 'Teleport / CyberArk', 'Just-in-time production access.'],
    ],
    decisions: [
      ['Which authorisation model?', 'Teams must not see each other’s positions; ops must see everything but trade nothing.', [
        ['RBAC', 'Small orgs', ['Simple to reason about'], ['Role explosion with teams × functions']],
        ['ABAC / policy as code (OPA, Cedar)', 'Default', ['Expresses team, data class and barriers directly'], ['Needs policy testing']],
        ['ReBAC (OpenFGA, Zanzibar-style)', 'Complex sharing hierarchies', ['Natural for team → book → user'], ['Newer; another service']],
      ], 'ABAC / policy as code (OPA, Cedar)', 'Information barriers are attributes, not roles. Test every policy change in CI.', 'Sharing becomes deeply hierarchical.'],
      ['Okta or Entra?', 'The IdP is foundational.', [
        ['Microsoft Entra ID', 'Microsoft 365 estate', ['Already licensed; integrated'], ['Weaker app catalogue in places']],
        ['Okta', 'Heterogeneous SaaS estate', ['Broad integrations'], ['Separate licence']],
      ], 'Microsoft Entra ID', 'Most funds already run Microsoft 365.', 'Your SaaS estate leans heavily on Okta integrations.'],
    ],
  },
  apigw: {
    shape: 'A gateway in front of internal and partner APIs with OAuth2/mTLS, rate limits and audit; a managed file-transfer service with an expected-file calendar for counterparty files; contract-first API definitions in a shared repository.',
    stack: [
      ['API gateway', 'Kong / AWS API Gateway', 'Auth, limits, audit.'],
      ['Internal APIs', 'gRPC (+ REST for partners)', 'Typed, fast, contract-first.'],
      ['File transfer', 'AWS Transfer Family / GoAnywhere', 'SFTP with PGP and checksums.'],
      ['Contracts', 'Protobuf + OpenAPI in one repo', 'Breaking changes caught in CI.'],
    ],
    decisions: [
      ['Which API style internally?', 'Hundreds of service-to-service calls.', [
        ['gRPC', 'Service to service', ['Typed, fast, streaming'], ['Less friendly for browsers and partners']],
        ['REST + OpenAPI', 'Partners and simple CRUD', ['Universal'], ['Looser contracts']],
        ['GraphQL', 'UI aggregation', ['Flexible queries for UIs'], ['Caching and authorisation complexity']],
      ], 'gRPC', 'Use gRPC internally, REST for partners, and GraphQL only as a UI aggregation layer if needed.', 'Partner integrations dominate.'],
      ['How are counterparty files handled?', 'Most PB, custodian and admin data still arrives as files.', [
        ['Managed file transfer with expected-file calendar', 'Default', ['Missing files raise alerts; audit'], ['Licence or cloud cost']],
        ['Ad-hoc SFTP servers', 'Never', ['Cheap'], ['Silent missing files; weak security']],
      ], 'Managed file transfer with expected-file calendar', 'A missing file that nobody notices is a common cause of bad NAVs.', 'Never.'],
    ],
  },
  obs: {
    shape: 'OpenTelemetry in every service, shipping traces, metrics and logs to one backend. Business monitors sit alongside technical ones, and correlation IDs from the event envelope let you follow a trade through every system.',
    stack: [
      ['Instrumentation', 'OpenTelemetry', 'Vendor-neutral.'],
      ['Backend', 'Datadog or Grafana Cloud', 'One place for traces, metrics, logs.'],
      ['Business monitors', 'Same backend + custom checks', 'Fill rates, recon completion, NAV timing.'],
      ['Paging', 'PagerDuty', 'On-call and incident response.'],
    ],
    decisions: [
      ['Which observability backend?', 'Cost grows with data volume.', [
        ['Datadog', 'Want it managed and complete', ['Excellent UX; everything in one'], ['Expensive at volume']],
        ['Grafana stack (Cloud or self-hosted)', 'Cost-conscious', ['Open source; cheaper'], ['More assembly']],
        ['Splunk', 'Security-led orgs', ['Strong log search and SIEM'], ['Cost']],
      ], 'Datadog', 'Instrument with OpenTelemetry so you can switch; start managed.', 'The bill exceeds a small platform team’s cost.'],
    ],
  },
  audit: {
    shape: 'Books-and-records topics and documents land in WORM object storage; communications go to a specialist archive with surveillance; every system writes to a hash-chained audit-trail service.',
    stack: [
      ['WORM storage', 'S3 Object Lock (compliance mode)', 'Meets SEC 17a-4 with a designated third party.'],
      ['Comms archive', 'Global Relay / Smarsh', 'Email, chat, voice, mobile.'],
      ['Surveillance', 'Behavox', 'AI-assisted comms surveillance.'],
      ['Audit trail', 'In-house service', 'Tamper-evident event records.'],
    ],
    decisions: [
      ['Build WORM storage or buy an archive?', 'Regulators fine firms heavily for record-keeping failures.', [
        ['Cloud object lock', 'Structured records', ['Cheap; integrates with the lake'], ['You prove compliance']],
        ['Specialist archive vendor', 'Communications', ['Regulatory attestations; e-discovery tools'], ['Cost per user']],
      ], 'Specialist archive vendor', 'Use a vendor for communications and object lock for system records.', 'Never self-build communications archiving.'],
    ],
  },
  infra: {
    shape: 'Cloud-first on managed Kubernetes with everything defined in Terraform, secrets in Vault or KMS, network segmented by function, and a second region ready for disaster recovery. Colocation only where execution latency is the edge.',
    stack: [
      ['Cloud', 'AWS (or Azure)', 'Breadth of managed services; finance ecosystem.'],
      ['Compute', 'EKS / AKS', 'Standard runtime for services and grids.'],
      ['IaC', 'Terraform + OPA policies', 'Reproducible, reviewed changes.'],
      ['Secrets', 'Vault / AWS KMS', 'Short-lived credentials, rotation.'],
      ['Colo', 'Equinix (NY4, LD4)', 'Proximity for latency-sensitive execution.'],
    ],
    decisions: [
      ['Cloud, colo or hybrid?', 'Most workloads are elastic; a few are latency-critical.', [
        ['Cloud only', 'Discretionary-led platforms', ['Elastic; no hardware'], ['Not suitable for low-latency execution']],
        ['Hybrid: cloud + colo for execution', 'Platforms with systematic teams', ['Latency where it matters, elasticity elsewhere'], ['Two operating models']],
        ['On-premises', 'Rarely now', ['Control'], ['Capital cost; slow to scale']],
      ], 'Hybrid: cloud + colo for execution', 'Keep colo small and purpose-built; everything else in the cloud.', 'No team needs sub-millisecond execution.'],
      ['Which DR strategy?', 'Trading must survive a region outage; back office can wait hours.', [
        ['Active-active', 'Trading path', ['Near-zero downtime'], ['Expensive; complex consistency']],
        ['Warm standby + event replay', 'Most services', ['Good RTO at moderate cost'], ['Failover must be rehearsed']],
        ['Pilot light', 'Back office', ['Cheap'], ['Hours to recover']],
      ], 'Warm standby + event replay', 'Tier services: warm standby for trading and risk, pilot light for back office, and test twice a year.', 'Trading RTO requirements tighten below minutes.'],
    ],
  },
}

const toOption = ([name, fit, pros, cons]) => ({ name, fit, pros, cons })

export const designs = Object.fromEntries(
  Object.entries(raw).map(([id, d]) => [
    id,
    {
      shape: d.shape,
      stack: d.stack,
      decisions: d.decisions.map(([q, context, options, rec, why, revisit], i) => ({
        id: `${id}-${i + 1}`,
        q,
        context,
        options: options.map(toOption),
        rec,
        why,
        revisit,
      })),
    },
  ])
)

// Every decision across the platform, for the register view.
export const allDecisions = Object.entries(designs).flatMap(([nodeId, d]) => d.decisions.map((x) => ({ ...x, nodeId })))
