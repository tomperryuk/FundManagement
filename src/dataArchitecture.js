// Data architecture: lanes, Snowflake's role, modelling approach, key datasets,
// serving layers and vendor landscapes.

// ───────────────────────── Platform lanes ─────────────────────────
// Each lane runs left to right through the same stages. `sf` marks cells where Snowflake does the work.

export const stages = ['Sources', 'Ingest', 'Process', 'Store', 'Serve', 'Consumers']

export const lanes = [
  {
    id: 'rt', name: 'Real-time path', latency: '< 1 s',
    note: 'Trading, positions, live risk. Never waits on the warehouse.',
    cells: [
      ['OMS / EMS', 'FIX drop copies', 'Market data feeds', 'Settlement status'],
      ['Kafka (outbox, CDC, FIX bridge)', 'Schema Registry'],
      ['Kafka Streams / Flink', 'IBOR position fold', 'Central P&L', 'Validated risk-engine adapter (Photon candidate)'],
      ['Kafka log (tiered storage)', 'Redis / in-memory caches', 'Postgres snapshots'],
      ['WebSocket gateway', 'gRPC APIs'],
      ['PMs & traders', 'Central risk', 'Capital Allocation'],
    ],
  },
  {
    id: 'ts', name: 'Time-series path', latency: 'ms – s queries',
    note: 'Ticks, quotes and bars for quant research and TCA.',
    cells: [
      ['Exchange feeds', 'Vendor tick history'],
      ['Feed handlers', 'Solace / Aeron'],
      ['Bar building', 'As-of joins', 'Corporate-action adjustment'],
      ['kdb+ or ClickHouse (recent, hot)', 'Parquet / Iceberg on S3 (full history)'],
      ['q / SQL', 'Python (PyKX, Polars)'],
      ['Quantitative Trading', 'TCA', 'Execution research'],
    ],
  },
  {
    id: 'an', name: 'Analytical path', latency: 'minutes – daily',
    note: 'History, research, finance, reporting and governance.',
    cells: [
      ['Kafka topics', 'Vendor files & data shares', 'Accounting, recon, admin, PB files', 'Operational databases'],
      [{ t: 'Snowpipe Streaming (Kafka connector)', sf: true }, { t: 'Snowpipe / COPY from S3', sf: true }, { t: 'Secure data shares (Marketplace)', sf: true }, 'Fivetran / Airbyte for SaaS'],
      ['dbt models orchestrated by Dagster', { t: 'Dynamic Tables', sf: true }, { t: 'Snowpark (Python)', sf: true }],
      ['Bronze: raw Iceberg on S3', { t: 'Silver: conformed, bitemporal (Iceberg managed by Snowflake)', sf: true }, { t: 'Gold: marts and feature tables', sf: true }],
      [{ t: 'Virtual warehouses per workload', sf: true }, 'Semantic layer', { t: 'Secure shares to admin / investors', sf: true }, 'Notebooks, BI'],
      ['Research', 'Finance & NAV', 'Operations', 'Risk & regulatory reporting', 'Investor relations'],
    ],
  },
  {
    id: 'op', name: 'Operational stores', latency: 'ms OLTP',
    note: 'Systems of record that publish events and are copied to the lake by CDC.',
    cells: [
      ['Applications'],
      ['Transactional writes'],
      ['Business logic in services'],
      ['Postgres: security master, capital, compliance, workflow', 'Vendor databases (OMS, accounting)'],
      ['Service APIs', 'Events to Kafka'],
      ['Applications', 'Operations console'],
    ],
  },
]

export const governanceBar = [
  ['Catalog & lineage', 'Snowflake Horizon + DataHub / Atlan; OpenLineage from dbt and Dagster'],
  ['Quality', 'dbt tests + Soda / Monte Carlo; failed checks stop publication'],
  ['Access', 'IAM attributes → Snowflake row access and masking policies; MNPI and PII tags'],
  ['Retention', 'Iceberg snapshots, Snowflake Time Travel, S3 Object Lock (WORM) for books and records'],
  ['Contracts', 'Protobuf / schema registry for events; dbt model contracts for tables'],
]

// ───────────────────────── Snowflake ─────────────────────────

export const snowflake = {
  role: 'Snowflake is the proposed governed analytical platform: conformed (silver) and curated (gold) layers, SQL and Python compute for research, finance, operations and reporting. It sits behind the real-time path, not on it. Consider open-format tables on firm-controlled object storage where they meet performance, governance and vendor-support needs; interoperability and data-sharing rights must be tested rather than assumed.',
  inScope: [
    'Conformed bitemporal model of instruments, prices, trades, positions, cash and books',
    'Gold marts for finance, performance, risk reporting, regulatory filings and investor reporting',
    'Point-in-time research datasets and the offline feature store',
    'Receiving vendor data through Snowflake Marketplace shares instead of files',
    'Delivering approved data to administrator, auditors or investors through supported, contractually permitted interfaces',
    'Daily and historical analytics on approved risk-engine results (Photon only if supported and licensed)',
  ],
  outScope: [
    'The order path, pre-trade compliance and real-time positions (Kafka, IBOR, OMS)',
    'Live risk aggregation (Photon only if validated) and sub-second PM views',
    'Raw tick and quote storage and as-of joins at microsecond grain (kdb+ / ClickHouse)',
    'Systems of record for operational workflows (Postgres, vendor systems)',
  ],
  features: [
    ['Apache Iceberg tables', 'Open-format storage on the firm’s S3 for bronze and silver; any engine can read it'],
    ['Snowpipe Streaming + Kafka connector', 'Lands backbone topics in seconds without batch jobs'],
    ['Dynamic Tables', 'Declarative incremental pipelines for near-real-time silver and gold tables'],
    ['Secure Data Sharing & Marketplace', 'Vendor data in without copies; curated data out to admin and investors'],
    ['Horizon governance', 'Object tags, row access policies, masking, lineage and access history'],
    ['Time Travel & zero-copy clones', 'Recover mistakes; spin up full test environments in seconds'],
    ['Snowpark (Python)', 'Research and data-engineering code next to the data; pandas-style APIs'],
    ['Resource monitors & budgets', 'Cost caps per warehouse and team'],
    ['Cortex Search (optional)', 'Search and Q&A over the research library and documents, inside the governance boundary'],
  ],
  topology: [
    ['Accounts', 'One account per environment (prod, UAT, dev) in the primary US region; a replica account for DR; separate regional accounts only if data residency demands it.'],
    ['Databases', 'RAW, CONFORMED, MARTS (finance, risk, regulatory, investor, ops), RESEARCH, SHARED_IN (vendor shares), SHARED_OUT.'],
    ['Warehouses', 'Separate warehouses for ingest, transform, research, reporting, BI and ad-hoc, so a large backtest never slows the NAV pack. Research warehouses can be sized per strategy group.'],
    ['Access', 'Roles generated from IAM: functional roles (finance, ops, risk) plus row access policies by fund, team and data class. MNPI-tagged data visible only to entitled teams.'],
    ['Cost', 'Resource monitors per warehouse; research spend reported per team and fed to Capital Allocation cost charges.'],
  ],
}

// ───────────────────────── Modelling approach ─────────────────────────

// [layer, purpose, model pattern, why, technology]
export const modelLayers = [
  ['Bronze · raw', 'Preserve the received source record for its approved retention period.', 'Source-aligned append-only tables with load metadata (source, file, offset, loaded_at). Corrections append; access and deletion follow policy.', 'Replay and audit need lineage to what arrived, while licences, privacy rules and the records schedule define how long it can be retained.', 'Iceberg on S3; Kafka topic archives'],
  ['Silver · conformed', 'One version of each business entity, with history.', 'Canonical bitemporal model. Data Vault–style hubs, links and satellites for multi-source masters (instruments, entities, counterparties); append-only event tables for trades, cash and corporate actions; bitemporal snapshot tables for positions and prices.', 'Masters merge many vendors and change over time; events must stay immutable; every row carries valid time and recorded time so any past state can be rebuilt.', 'Iceberg tables managed by Snowflake; dbt'],
  ['Gold · curated', 'Shaped for a use case.', 'Kimball star schemas for finance, operations and risk reporting; regulatory marts that mirror filing structures; wide point-in-time feature tables for research; pre-aggregated tables for dashboards.', 'Consumers need simple, fast, well-documented tables; each mart has an owner and a contract.', 'Snowflake tables and Dynamic Tables; dbt; semantic layer'],
  ['Serving', 'Delivered how the consumer needs it.', 'APIs, caches, shares, semantic-layer metrics and extracts, generated from gold.', 'Applications should never query silver directly.', 'Semantic layer, data APIs, secure shares, Redis'],
]

export const modelConventions = [
  ['Keys', 'Internal surrogate keys everywhere (instrument_id, entity_id, book_id, team_id); vendor identifiers only in cross-reference tables.'],
  ['Time', 'Every silver row has valid_from, valid_to and recorded_at (bitemporal). Business dates are explicit (trade_date, settle_date, as_of_date); timestamps in UTC.'],
  ['Money', 'Amounts carry their currency; base-currency values store the FX rate and its source.'],
  ['Quantities', 'Store in units with a contract multiplier, never pre-multiplied.'],
  ['Hierarchies', 'Firm → strategy group → team → book and fund → share class as effective-dated bridge tables, so reorganisations do not rewrite history.'],
  ['Contracts', 'Every gold model has an owner, a schema contract, tests and a freshness SLA in dbt.'],
  ['Classification', 'Each column tagged: public, licensed, confidential, PII or MNPI. Tags drive masking and row access.'],
]

// ───────────────────────── Key datasets ─────────────────────────

export const dataDomains = {
  reference: 'Reference data',
  market: 'Market & research data',
  trading: 'Trading',
  positions: 'Positions, risk & capital',
  finance: 'Finance & operations',
  investor: 'Investors, compliance & regulatory',
}

const ds = (o) => o

export const datasets = [
  // ── Reference
  ds({
    id: 'instruments', name: 'Instruments & identifiers', domain: 'reference',
    desc: 'Every tradable and referenced instrument with terms and every vendor identifier, across all asset classes.',
    source: ['secmaster'], vendors: ['Bloomberg Data License', 'ICE Data Services', 'LSEG', 'S&P Global', 'OpenFIGI'],
    delivery: 'Files and APIs; LSEG and S&P also deliver through Snowflake shares',
    volume: 'Millions of instruments; tens of thousands of daily changes', latency: 'Minutes (new listings) to daily',
    storage: [['Operational', 'Postgres (security master service) + Redis cache', 'Microsecond lookups on the trading path'], ['Analytical', 'Snowflake silver/gold', 'History and joins for every other dataset'], ['Raw', 'Iceberg bronze', 'Every vendor record as delivered']],
    model: {
      pattern: 'Data Vault–style master: hub per instrument, satellites per source and per attribute group, links for identifiers and underlyings; published as an SCD2 dimension',
      grain: 'One row per instrument per version', keys: 'instrument_id (internal surrogate)',
      temporal: 'Bitemporal on every satellite', tables: [
        ['hub_instrument', 'instrument_id, created_at, created_by'],
        ['sat_instrument_terms', 'instrument_id, source, asset_class, currency, exchange, maturity, coupon, multiplier, valid_from, valid_to, recorded_at'],
        ['hub_listing / sat_listing', 'listing_id, instrument_id, mic, trading_currency, lot_size, primary_flag, valid_from, valid_to, recorded_at'],
        ['link_identifier', 'object_type (entity/instrument/listing), object_id, id_type (FIGI/ISIN/CUSIP/SEDOL/RIC/ticker), id_value, valid_from, valid_to'],
        ['link_instrument_underlying', 'instrument_id, underlying_id, ratio'],
        ['dim_instrument (gold, SCD2)', 'instrument_key, instrument_id, name, asset_class, sector, country_of_risk, currency, is_current'],
      ],
    },
    serving: [['Trading & compliance', 'Service API + cache'], ['Analytics & reporting', 'dim_instrument in Snowflake'], ['Research', 'Point-in-time instrument universe incl. delisted']],
    quality: ['Identifier uniqueness per validity window', 'Cross-vendor term agreement', 'No orphan references from trades or positions'],
    sensitivity: 'Licensed (vendor redistribution rules)', retention: 'Permanent',
  }),
  ds({
    id: 'entities', name: 'Legal entities & issuers', domain: 'reference',
    desc: 'Issuers, counterparties and their ownership hierarchy for limits, disclosures and counterparty exposure.',
    source: ['secmaster'], vendors: ['GLEIF (LEI)', 'Bloomberg', 'Moody’s Orbis', 'S&P Capital IQ', 'Dun & Bradstreet'],
    delivery: 'GLEIF open files; vendor files and APIs',
    volume: 'Millions of entities; daily changes', latency: 'Daily',
    storage: [['Operational', 'Postgres (entity master)', 'Hierarchy queries for compliance'], ['Analytical', 'Snowflake silver/gold', 'Issuer-level aggregation in marts']],
    model: {
      pattern: 'Hub and satellites for entities; effective-dated parent-child link; flattened ultimate-parent bridge in gold',
      grain: 'Entity per version; relationship per period', keys: 'entity_id; LEI as cross-reference',
      temporal: 'Bitemporal', tables: [
        ['hub_entity', 'entity_id'],
        ['sat_entity', 'entity_id, legal_name, entity_type, country, lei, valid_from, valid_to, recorded_at'],
        ['link_entity_parent', 'entity_id, parent_entity_id, ownership_pct, valid_from, valid_to'],
        ['bridge_entity_ultimate_parent (gold)', 'entity_id, ultimate_parent_id, depth'],
      ],
    },
    serving: [['Compliance disclosure aggregation', 'Postgres API'], ['Counterparty risk', 'Snowflake gold'], ['Regulatory reporting', 'Snowflake regulatory mart']],
    quality: ['No hierarchy cycles', 'Every issuer of a held instrument mapped to an entity'],
    sensitivity: 'Licensed / public', retention: 'Permanent',
  }),
  ds({
    id: 'corpactions', name: 'Corporate actions', domain: 'reference',
    desc: 'Dividends, splits, mergers, spin-offs, rights and elections with all key dates and terms.',
    source: ['secmaster'], vendors: ['Bloomberg', 'ICE', 'LSEG', 'S&P Global', 'DTCC Global Corporate Actions', 'Custodian notifications'],
    delivery: 'Vendor files; SWIFT MT564/566 from custodians',
    volume: 'Thousands per day globally', latency: 'Intraday updates; ≥ 2 days before ex-date',
    storage: [['Operational', 'Postgres (CA engine) + Kafka events', 'Drives IBOR and accounting'], ['Analytical', 'Snowflake silver/gold', 'Adjustment factors for research and P&L']],
    model: {
      pattern: 'Event table per announcement with versioned updates; derived adjustment-factor table',
      grain: 'One row per CA event version', keys: 'ca_id, version',
      temporal: 'Append-only versions with recorded_at', tables: [
        ['ca_event', 'ca_id, version, instrument_id, ca_type, ex_date, record_date, pay_date, terms (variant), status, source_agreement, recorded_at'],
        ['ca_election', 'ca_id, fund_id, team_id, option, elected_by, elected_at'],
        ['instrument_adjustment_factor', 'instrument_id, ex_date, price_factor, volume_factor'],
      ],
    },
    serving: [['IBOR and accounting', 'Kafka events'], ['Research', 'Adjustment factors joined to prices'], ['Operations', 'Election workflow']],
    quality: ['Two-source agreement before release', 'Ex-date not in the past at release'],
    sensitivity: 'Licensed', retention: 'Permanent',
  }),
  ds({
    id: 'calendars', name: 'Calendars & conventions', domain: 'reference',
    desc: 'Trading and settlement holidays, trading hours, day counts and settlement cycles.',
    source: ['secmaster'], vendors: ['Copp Clark', 'Bloomberg', 'Exchange publications'],
    delivery: 'Files and APIs', volume: 'Small', latency: 'Monthly updates; occasional ad-hoc',
    storage: [['Operational', 'Postgres + shared library cache', 'Used everywhere'], ['Analytical', 'Snowflake dim_calendar', 'Business-day maths in SQL']],
    model: { pattern: 'Reference tables; gold calendar dimension', grain: 'Calendar × date', keys: 'calendar_code, date', temporal: 'Versioned', tables: [['calendar_day', 'calendar_code, date, is_business_day, open_time, close_time, version'], ['dim_date (gold)', 'date, is_month_end, fiscal_period, us_business_day, uk_business_day, …']] },
    serving: [['Settlement and accruals', 'Library + API'], ['Reporting', 'dim_date']],
    quality: ['Coverage for every exchange and currency traded, 2 years forward'], sensitivity: 'Licensed', retention: 'Permanent',
  }),
  ds({
    id: 'org', name: 'Funds, teams & books', domain: 'reference',
    desc: 'The firm’s own structure: funds and share classes, strategy groups, investment teams, books, accounts at PBs and custodians.',
    source: ['capital', 'pms'], vendors: ['Internal'], delivery: 'Internal', volume: 'Thousands of rows', latency: 'On change',
    storage: [['Operational', 'Postgres (Capital Allocation / PMS)', 'Source of record'], ['Analytical', 'Snowflake dimensions and bridges', 'Every mart joins through it']],
    model: { pattern: 'Effective-dated hierarchy with bridge tables; SCD2 dimensions', grain: 'Node per version', keys: 'fund_id, team_id, book_id, account_id', temporal: 'Bitemporal', tables: [['dim_fund', 'fund_id, name, structure (master/feeder/parallel), domicile, base_ccy'], ['dim_team', 'team_id, name, strategy_group, region, pm, valid_from, valid_to'], ['dim_book', 'book_id, team_id, fund_id, strategy_tag, valid_from, valid_to'], ['bridge_org_hierarchy', 'book_id, team_id, strategy_group, firm, valid_from, valid_to']] },
    serving: [['All marts', 'Conformed dimensions'], ['Entitlements', 'IAM attributes']],
    quality: ['Every book maps to exactly one team and fund at any time'], sensitivity: 'Confidential', retention: 'Permanent',
  }),
  ds({
    id: 'ssi', name: 'Counterparties & SSIs', domain: 'reference',
    desc: 'Brokers, PBs, custodians and their standing settlement instructions and agreements.',
    source: ['settlement', 'collateral'], vendors: ['DTCC ALERT', 'SWIFT', 'ISDA / CSA documents (internal)'],
    delivery: 'ALERT API; documents', volume: 'Thousands', latency: 'On change, verified',
    storage: [['Operational', 'Settlement platform + Postgres', 'Maker-checker changes'], ['Analytical', 'Snowflake (masked)', 'Settlement analytics']],
    model: { pattern: 'SCD2 with approval metadata', grain: 'SSI per version', keys: 'ssi_id', temporal: 'Bitemporal with approver', tables: [['ssi', 'ssi_id, counterparty_id, market, asset_class, custodian_bic, account (masked), valid_from, valid_to, approved_by'], ['agreement', 'agreement_id, counterparty_id, type (ISDA/CSA/PB/GMRA), threshold, mta, eligible_collateral']] },
    serving: [['Settlement', 'Operational system only'], ['Analytics', 'Masked gold view']],
    quality: ['Call-back verification recorded for every change'], sensitivity: 'Restricted (fraud risk)', retention: '7 years',
  }),

  // ── Market & research
  ds({
    id: 'ticks', name: 'Ticks, quotes & bars', domain: 'market',
    desc: 'Trade and quote history at full granularity, plus derived bars for research and TCA.',
    source: ['mdhub'], vendors: ['Exchange direct feeds', 'LSEG Tick History', 'Bloomberg', 'ICE', 'Databento', 'AlgoSeek', 'OneTick Cloud'],
    delivery: 'Multicast feeds; bulk historical files',
    volume: 'Billions of rows per day; petabytes of history', latency: 'Real time; history next day',
    storage: [['Hot', 'kdb+ or ClickHouse (recent 30–90 days)', 'As-of joins in milliseconds'], ['History', 'Parquet / Iceberg on S3, partitioned by date and venue', 'Cheap, readable by DuckDB, Spark, kdb+'], ['Analytical', 'Snowflake: bars and summaries only', 'Joins with positions and trades']],
    model: { pattern: 'Columnar time-series; partitioned by date, sorted by instrument then time', grain: 'One row per tick or quote update', keys: 'instrument_id, ts, seq', temporal: 'Event time + receive time', tables: [['trades', 'date, instrument_id, ts, price, size, venue, conditions'], ['quotes', 'date, instrument_id, ts, bid, ask, bid_size, ask_size, venue'], ['bars_1m', 'date, instrument_id, bar_start, open, high, low, close, volume, vwap']] },
    serving: [['Quant research', 'kdb+/q, PyKX, DuckDB over Parquet'], ['TCA', 'As-of joins to fills'], ['Reporting', 'Bars in Snowflake']],
    quality: ['Gap detection per venue', 'Crossed/locked quote checks', 'Daily row counts vs vendor'], sensitivity: 'Licensed (exchange rules)', retention: '10+ years',
  }),
  ds({
    id: 'prices', name: 'EOD prices & official marks', domain: 'market',
    desc: 'Closing, evaluated and model prices with source, hierarchy level and overrides; the official set used for NAV.',
    source: ['mdhub'], vendors: ['Bloomberg (BVAL)', 'ICE Pricing & Reference Data', 'LSEG', 'S&P Global', 'Exchange closes', 'Broker quotes'],
    delivery: 'Files, APIs; some via Snowflake shares', volume: 'Millions of price points per day', latency: 'Locked by 19:00 ET',
    storage: [['Operational', 'Pricing engine (Postgres)', 'Exceptions and overrides'], ['Analytical', 'Snowflake silver/gold', 'Every valuation and report'], ['Raw', 'Iceberg bronze per vendor', 'Evidence for IPV']],
    model: { pattern: 'Bitemporal fact of candidate prices + an official-price view; override audit table', grain: 'Instrument × date × price type × source', keys: 'instrument_id, price_date, price_type, source', temporal: 'Bitemporal (restatements kept)', tables: [['price_candidate', 'instrument_id, price_date, price_type, source, value, currency, recorded_at'], ['price_official', 'instrument_id, price_date, value, source_chosen, fv_level (L1/L2/L3), status, locked_at'], ['price_override', 'instrument_id, price_date, old_value, new_value, reason, evidence_uri, maker, checker']] },
    serving: [['NAV and accounting', 'Locked file / API'], ['Risk and reporting', 'Snowflake fact_price_official'], ['Research', 'Adjusted price series']],
    quality: ['Stale > n days', 'Day-on-day move tolerance', 'Vendor dispersion', 'Coverage of every held instrument'], sensitivity: 'Licensed / confidential (overrides)', retention: 'Permanent',
  }),
  ds({
    id: 'curves', name: 'Curves, surfaces & FX', domain: 'market',
    desc: 'Yield, credit and inflation curves, volatility surfaces and FX rates, as built and as published.',
    source: ['mdhub'], vendors: ['Bloomberg', 'LSEG', 'ICE', 'OptionMetrics', 'Cboe LiveVol', 'WM/Reuters FX fixes'],
    delivery: 'Feeds, files, APIs', volume: 'Hundreds of thousands of points per snapshot', latency: 'Intraday snapshots + EOD',
    storage: [['Real-time', 'Kafka + in-memory for pricing', 'Approved risk engine and pricing libraries'], ['Analytical', 'Snowflake (points as rows, plus parameters)', 'History for risk and research']],
    model: { pattern: 'Versioned snapshot header + points; parameters stored for parametric surfaces', grain: 'Curve × snapshot × tenor (× strike)', keys: 'curve_id, snapshot_ts', temporal: 'Snapshot versions', tables: [['curve_snapshot', 'curve_id, snapshot_ts, method, inputs_ref, version'], ['curve_point', 'curve_id, snapshot_ts, tenor, rate, discount_factor'], ['vol_surface_point', 'surface_id, snapshot_ts, expiry, strike_or_delta, vol'], ['fx_rate', 'ccy_pair, ts, rate, source, fixing_type']] },
    serving: [['Live pricing', 'Kafka / in-memory'], ['Risk history and research', 'Snowflake']],
    quality: ['Arbitrage-free checks on surfaces', 'Curve fit residuals'], sensitivity: 'Licensed', retention: 'Permanent',
  }),
  ds({
    id: 'fundamentals', name: 'Fundamentals & estimates', domain: 'market',
    desc: 'Company financials, KPIs and consensus estimates, point-in-time.',
    source: ['lake'], vendors: ['S&P Capital IQ / Compustat', 'FactSet', 'LSEG Worldscope & I/B/E/S', 'Bloomberg', 'Visible Alpha'],
    delivery: 'Snowflake shares (FactSet, S&P, LSEG), files, APIs', volume: 'Hundreds of millions of data points', latency: 'Daily',
    storage: [['Analytical', 'Snowflake (shared data where possible, no copies)', 'Joined to the instrument master'], ['Research', 'Point-in-time tables in RESEARCH database', 'Backtests']],
    model: { pattern: 'Long, point-in-time fact keyed on knowledge time; mapping table from vendor company IDs', grain: 'Company × item × period × knowledge date', keys: 'entity_id, item, fiscal_period, known_at', temporal: 'Knowledge time (as first published) is essential', tables: [['fundamental_pit', 'entity_id, item, fiscal_period, value, currency, known_at, vendor'], ['estimate_pit', 'entity_id, item, fiscal_period, consensus, n_estimates, known_at'], ['map_vendor_company', 'vendor, vendor_company_id, entity_id, valid_from, valid_to']] },
    serving: [['Research', 'Snowpark / notebooks over PIT tables'], ['PMs', 'Workstation research views']],
    quality: ['No look-ahead (known_at ≤ as-of)', 'Mapping coverage of the universe'], sensitivity: 'Licensed', retention: 'Per licence',
  }),
  ds({
    id: 'altdata', name: 'Alternative data', domain: 'market',
    desc: 'Card spend, web, app, geolocation, satellite and sentiment datasets used for signals.',
    source: ['research', 'lake'], vendors: ['YipitData', 'Bloomberg Second Measure', 'Consumer Edge', 'M Science', 'Placer.ai', 'Similarweb', 'Sensor Tower', 'RavenPack', 'Orbital Insight'],
    delivery: 'Mostly Snowflake shares or S3; some APIs', volume: 'Gigabytes to terabytes per dataset', latency: 'Daily / weekly',
    storage: [['Analytical', 'Snowflake (shares) or Iceberg on S3', 'Keep vendor data in place where possible'], ['Research', 'Feature tables', 'Signals']],
    model: { pattern: 'Vendor-native bronze; conformed mapping to entities and instruments; PIT feature tables', grain: 'Vendor-specific; mapped to entity × date', keys: 'entity_id, date, metric', temporal: 'Arrival time recorded for every delivery', tables: [['alt_<vendor>_raw', 'as delivered'], ['alt_metric_pit', 'entity_id, metric, period, value, delivered_at, dataset_version'], ['dataset_registry', 'dataset, vendor, mnpi_review, licence_terms, owner, teams_entitled']] },
    serving: [['Research', 'Shared research library; Snowpark'], ['Compliance', 'Dataset registry and approvals']],
    quality: ['Back-fill detection', 'Panel stability', 'Entity mapping coverage'], sensitivity: 'Licensed; MNPI-reviewed', retention: 'Per licence',
  }),
  ds({
    id: 'indices', name: 'Index constituents & benchmarks', domain: 'market',
    desc: 'Benchmark weights and returns for exposure, attribution and investor reporting.',
    source: ['mdhub'], vendors: ['MSCI', 'S&P Dow Jones Indices', 'FTSE Russell', 'STOXX', 'Bloomberg Indices'],
    delivery: 'Files; some via Snowflake shares', volume: 'Millions of rows', latency: 'Daily, with pro-forma changes',
    storage: [['Analytical', 'Snowflake', 'Joins with positions and returns']],
    model: { pattern: 'Effective-dated constituent fact + index level fact', grain: 'Index × date × constituent', keys: 'index_id, date, instrument_id', temporal: 'Effective dates incl. pro-forma', tables: [['index_constituent', 'index_id, date, instrument_id, weight, shares, is_proforma'], ['index_level', 'index_id, date, level, total_return']] },
    serving: [['Risk and attribution', 'Snowflake gold'], ['Investor reports', 'Reporting mart']],
    quality: ['Weights sum to 100%'], sensitivity: 'Licensed', retention: 'Permanent',
  }),
  ds({
    id: 'riskmodel', name: 'Risk model data', domain: 'market',
    desc: 'Factor exposures, factor returns, covariance and specific risk from vendor models.',
    source: ['risk'], vendors: ['MSCI Barra', 'Axioma (SimCorp)', 'Northfield', 'Bloomberg PORT'],
    delivery: 'Files; some cloud delivery', volume: 'Tens of millions of rows per day', latency: 'Daily before 06:00 ET',
    storage: [['Analytical', 'Snowflake', 'History and joins'], ['Compute', 'Loaded into approved risk engine', 'Daily calculations']],
    model: { pattern: 'Model-versioned facts; covariance stored as factor × factor', grain: 'Model × date × instrument × factor', keys: 'model_id, date, instrument_id, factor', temporal: 'Model version + date', tables: [['factor_exposure', 'model_id, date, instrument_id, factor, exposure'], ['factor_return', 'model_id, date, factor, return'], ['factor_covariance', 'model_id, date, factor_i, factor_j, cov'], ['specific_risk', 'model_id, date, instrument_id, specific_vol']] },
    serving: [['Risk engine', 'Bulk load'], ['Crowding and attribution', 'Snowflake gold']],
    quality: ['Coverage of held instruments', 'Covariance positive semi-definite'], sensitivity: 'Licensed', retention: 'Permanent',
  }),
  ds({
    id: 'borrow', name: 'Borrow, locates & financing', domain: 'market',
    desc: 'Stock-borrow availability, rates, utilisation and PB financing terms.',
    source: ['oms', 'collateral'], vendors: ['S&P Global Securities Finance', 'EquiLend DataLend', 'Prime broker availability files'],
    delivery: 'Files, APIs', volume: 'Millions of rows per day', latency: 'Pre-open + intraday',
    storage: [['Operational', 'OMS locate store', 'Pre-trade'], ['Analytical', 'Snowflake', 'Cost analysis and PB comparison']],
    model: { pattern: 'Daily snapshot fact by PB and instrument; locate event table', grain: 'Instrument × PB × date', keys: 'instrument_id, pb_id, date', temporal: 'Snapshot per day/intraday', tables: [['borrow_availability', 'date, instrument_id, pb_id, available_qty, rate_bps, is_htb'], ['locate_event', 'locate_id, team_id, instrument_id, pb_id, qty_requested, qty_approved, rate, ts']] },
    serving: [['Pre-trade', 'OMS'], ['Financing analytics', 'Snowflake gold']],
    quality: ['File arrival before 06:00 ET'], sensitivity: 'Licensed / confidential', retention: '7 years',
  }),

  // ── Trading
  ds({
    id: 'orders', name: 'Orders & executions', domain: 'trading',
    desc: 'Every order, amendment, child order and fill, with full state history and raw FIX.',
    source: ['oms', 'ems', 'fixgw'], vendors: ['OMS/EMS vendors (Enfusion, Eze, CRD, FlexTrade)'],
    delivery: 'Kafka events from vendor APIs and drop copies', volume: 'Millions of messages per day', latency: 'Real time',
    storage: [['Real-time', 'Approved trading event interfaces', 'IBOR, validated risk consumers, post-trade'], ['Analytical', 'Snowflake via governed ingestion', 'Best-ex, TCA, surveillance, audit analytics'], ['Archive', 'Approved FIX journal / communications archive', 'Record schedule and jurisdiction determine authoritative archive']],
    model: { pattern: 'Event-sourced: append-only order events + derived current-state and fill facts', grain: 'One row per order event; one row per fill', keys: 'order_id, event_seq; fill_id', temporal: 'Event time (UTC, µs) and recorded time', tables: [['order_event', 'order_id, event_seq, event_type, ts, user, qty, limit, status, parent_id, correlation_id'], ['order_current (derived)', 'order_id, book_id, instrument_id, side, qty, filled_qty, avg_px, status'], ['fact_execution', 'fill_id, order_id, child_id, ts, qty, price, venue, broker, liquidity_flag'], ['fix_message_raw', 'session, seq, msg_type, raw, ts']] },
    serving: [['Live blotters', 'OMS/EMS + Kafka'], ['TCA and best-ex', 'Snowflake gold + ticks'], ['Surveillance', 'Vendor surveillance feed'], ['Regulators', 'Archive and extracts']],
    quality: ['Fills reconcile to drop copies', 'No gaps in event_seq'], sensitivity: 'Confidential; MNPI-sensitive by team', retention: '7 years (books and records)',
  }),
  ds({
    id: 'allocations', name: 'Allocations & confirmations', domain: 'trading',
    desc: 'Block allocations to funds and books with fees, plus matching and affirmation status.',
    source: ['oms', 'posttrade'], vendors: ['DTCC CTM', 'MarkitSERV'], delivery: 'Kafka events; CTM APIs', volume: 'Hundreds of thousands per day', latency: 'Real time to T+0',
    storage: [['Real-time', 'Kafka', 'Post-trade and IBOR'], ['Analytical', 'Snowflake', 'Fair allocation reviews, ops KPIs']],
    model: { pattern: 'Fact at allocation grain; status history as events', grain: 'Allocation', keys: 'alloc_id', temporal: 'Event history', tables: [['fact_allocation', 'alloc_id, order_id, fund_id, book_id, qty, avg_px, commission, fees, trade_date, settle_date'], ['confirm_status_event', 'alloc_id, status, ts, mismatch_fields']] },
    serving: [['Operations', 'Ops console'], ['Allocation fairness', 'Snowflake gold']],
    quality: ['Sum of allocations = block fill'], sensitivity: 'Confidential', retention: '7 years',
  }),
  ds({
    id: 'tca', name: 'Transaction cost analysis', domain: 'trading',
    desc: 'Benchmarks and costs per order: arrival, VWAP, implementation shortfall, broker and algo.',
    source: ['ems'], vendors: ['Virtu Analytics', 'Abel Noser', 'In-house'], delivery: 'Vendor files + in-house computation', volume: 'Per order', latency: 'T+1',
    storage: [['Analytical', 'Snowflake gold', 'Committee and research']],
    model: { pattern: 'Star schema: TCA fact with order, broker, algo, instrument and date dimensions', grain: 'Order (and child order)', keys: 'order_id', temporal: 'Trade date', tables: [['fact_tca', 'order_id, arrival_px, avg_px, vwap, is_bps, spread_bps, impact_bps, broker_id, algo_id, date']] },
    serving: [['Best-ex committee', 'BI dashboards'], ['Quant research', 'Snowpark']],
    quality: ['Every executed order has a TCA row by T+1'], sensitivity: 'Confidential', retention: '7 years',
  }),

  // ── Positions, risk & capital
  ds({
    id: 'positions', name: 'Positions & tax lots', domain: 'positions',
    desc: 'Positions by fund, book, instrument and location, intraday and EOD, with lot-level cost.',
    source: ['ibor'], vendors: ['Internal (IBOR)', 'PB and custodian files for reconciliation'], delivery: 'Kafka events + EOD snapshots', volume: 'Hundreds of thousands of positions; millions of lots', latency: 'Real time; EOD snapshot',
    storage: [['Real-time', 'Kafka + IBOR state stores', 'PMS and validated risk consumers'], ['Operational', 'Postgres snapshots', 'APIs'], ['Analytical', 'Snowflake silver (bitemporal) and gold', 'Every report and analysis']],
    model: { pattern: 'Bitemporal daily snapshot fact (periodic snapshot) + lot table; intraday kept as events', grain: 'Fund × book × instrument × location × as-of date', keys: 'as_of_date, fund_id, book_id, instrument_id, location_id', temporal: 'Bitemporal so restated positions keep the original', tables: [['fact_position_daily', 'as_of_date, fund_id, book_id, instrument_id, location_id, qty_td, qty_sd, cost_local, mv_local, mv_base, fx_rate, recorded_at'], ['tax_lot', 'lot_id, position_key, open_date, qty, cost, method'], ['position_event', 'event_id, position_key, delta_qty, cause (fill/CA/transfer), ts']] },
    serving: [['PMs and approved risk consumers', 'Kafka streams'], ['Reporting, risk history, research', 'Snowflake gold'], ['Reconciliation', 'Snapshot extracts']],
    quality: ['Rebuild from events equals snapshot', 'Three-way recon status'], sensitivity: 'Confidential; team-level entitlements', retention: '7 years+',
  }),
  ds({
    id: 'risk', name: 'Risk results', domain: 'positions',
    desc: 'Exposures, sensitivities, VaR, stress and liquidity results from approved internal risk engines and independent providers. Photon is included only for validated, contractually usable outputs.',
    source: ['risk'], vendors: ['Photon (licence reported; scope to confirm)', 'MSCI / Axioma', 'External risk provider'], delivery: 'Kafka + bulk loads', volume: 'Sizing assumption; profile with real workloads', latency: 'Intraday + EOD targets to validate',
    storage: [['Real-time', 'Approved engine + Kafka risk topics', 'Live limits'], ['Interactive', 'ClickHouse', 'Fast slice-and-dice'], ['Analytical', 'Snowflake gold', 'History, regulatory and investor reporting, external comparison']],
    model: { pattern: 'Long fact of measures by dimension; scenario P&L vectors stored as arrays per position', grain: 'Run × book × measure × dimension', keys: 'run_id, book_id, measure, dim_type, dim_value', temporal: 'Run as-of with model version', tables: [['risk_run', 'run_id, engine (photon/internal/external), as_of, scope, model_version'], ['fact_risk_measure', 'run_id, book_id, measure, dim_type, dim_value, value'], ['scenario_pnl', 'run_id, position_key, scenario_set, pnl_vector (array)'], ['risk_compare (gold)', 'as_of, book_id, measure, internal_value, external_value, diff, within_tolerance']] },
    serving: [['Live limits and PM views', 'Validated risk service / API'], ['Interactive risk', 'ClickHouse'], ['Form PF / Annex IV, investor risk reports', 'Snowflake regulatory mart']],
    quality: ['Completeness vs positions', 'Internal vs external within tolerance'], sensitivity: 'Confidential', retention: '7 years',
  }),
  ds({
    id: 'capitaldata', name: 'Capital, performance & payouts', domain: 'positions',
    desc: 'Capital allocated per team over time, performance analytics, drawdown events and payouts.',
    source: ['capital'], vendors: ['Internal'], delivery: 'Internal', volume: 'Small, high value', latency: 'On change; daily performance',
    storage: [['Operational', 'Postgres (bitemporal)', 'System of record'], ['Analytical', 'Snowflake gold (restricted)', 'Management and payout analytics']],
    model: { pattern: 'Effective-dated allocation fact; daily team performance fact; payout fact', grain: 'Team × effective date; team × day; team × period', keys: 'team_id + dates', temporal: 'Bitemporal', tables: [['fact_capital_allocation', 'team_id, capital, effective_from, effective_to, decided_by, rationale'], ['fact_team_performance_daily', 'date, team_id, pnl, return_on_capital, drawdown_from_hwm, vol_20d'], ['fact_payout', 'team_id, period, gross_pnl, costs, netting_carry, payout']] },
    serving: [['Management cockpit', 'Snowflake gold + cache'], ['Limits', 'Events to risk and compliance']],
    quality: ['Payout reconciles to official books'], sensitivity: 'Restricted (compensation)', retention: 'Permanent',
  }),
  ds({
    id: 'margin', name: 'Margin & collateral', domain: 'positions',
    desc: 'Margin requirements and calls by counterparty, collateral held and pledged, financing.',
    source: ['collateral'], vendors: ['Prime broker files', 'AcadiaSoft', 'CCPs'], delivery: 'Files, APIs', volume: 'Thousands of rows per day', latency: 'Daily + intraday in stress',
    storage: [['Operational', 'Collateral system', 'Calls workflow'], ['Analytical', 'Snowflake', 'Cross-PB comparison and liquidity forecasting']],
    model: { pattern: 'Daily snapshot of requirements; call event table', grain: 'Agreement × date', keys: 'agreement_id, date', temporal: 'Snapshot', tables: [['fact_margin_daily', 'date, agreement_id, requirement, posted, excess, method'], ['margin_call', 'call_id, agreement_id, direction, amount, status, due']] },
    serving: [['Treasury', 'Collateral system'], ['Liquidity analytics', 'Snowflake gold']],
    quality: ['PB file vs internal replication'], sensitivity: 'Confidential', retention: '7 years',
  }),

  // ── Finance & operations
  ds({
    id: 'cash', name: 'Cash, settlement & payments', domain: 'finance',
    desc: 'Settlement status, cash balances and movements, payments and FX.',
    source: ['settlement'], vendors: ['SWIFT (custodian statements)', 'Kyriba', 'Banks'], delivery: 'SWIFT MT/ISO 20022; APIs', volume: 'Tens of thousands of messages per day', latency: 'Intraday',
    storage: [['Operational', 'Settlement / treasury systems', 'Workflow'], ['Real-time', 'Kafka cash events', 'IBOR cash projection'], ['Analytical', 'Snowflake', 'Liquidity and fails analytics']],
    model: { pattern: 'Cash movement event fact + daily balance snapshot', grain: 'Movement; account × currency × date', keys: 'movement_id; account_id, ccy, date', temporal: 'Value date + booking date', tables: [['cash_movement', 'movement_id, account_id, ccy, amount, value_date, type, trade_id, status'], ['fact_cash_balance_daily', 'date, account_id, ccy, projected, actual'], ['settlement_status_event', 'instr_id, status, ts, reason']] },
    serving: [['Treasury', 'TMS'], ['Fails and liquidity', 'Snowflake gold']],
    quality: ['Projected vs actual balance recon'], sensitivity: 'Restricted (bank details masked)', retention: '7 years',
  }),
  ds({
    id: 'gl', name: 'General ledger & NAV', domain: 'finance',
    desc: 'Double-entry journals, NAV by share class, fees, accruals and performance.',
    source: ['accounting'], vendors: ['Accounting platform (Geneva / Arcesium)', 'Administrator NAV packs'], delivery: 'Extracts / CDC from accounting; admin files', volume: 'Millions of journal lines per month', latency: 'Daily estimate; monthly official',
    storage: [['Operational', 'Accounting platform', 'Book of record'], ['Analytical', 'Snowflake gold finance mart', 'Performance, investor and regulatory reporting']],
    model: { pattern: 'Kimball finance star: journal line fact; NAV periodic snapshot; conformed dimensions', grain: 'Journal line; fund × class × date', keys: 'je_id, line; fund_id, class_id, nav_date', temporal: 'Accounting period with locks', tables: [['fact_journal_line', 'je_id, line, period, fund_id, account_id, debit, credit, ccy, source'], ['fact_nav', 'nav_date, fund_id, class_id, nav_per_share, total_nav, status (estimate/official)'], ['fact_fee_accrual', 'date, fund_id, class_id, series, fee_type, amount, hwm'], ['dim_account', 'account_id, chart, type, description']] },
    serving: [['Finance and performance', 'Snowflake gold + BI'], ['Investor reporting', 'Reporting mart'], ['Admin tie-out', 'Secure share or file']],
    quality: ['Debits = credits', 'Shadow vs admin NAV within tolerance'], sensitivity: 'Confidential', retention: 'Permanent',
  }),
  ds({
    id: 'recondata', name: 'Reconciliation & breaks', domain: 'finance',
    desc: 'Recon runs, matched counts and every break with owner, age and root cause.',
    source: ['recon'], vendors: ['Duco / TLM'], delivery: 'API / extracts', volume: 'Thousands of breaks per day', latency: 'Daily + intraday',
    storage: [['Operational', 'Recon tool + exception inbox', 'Workflow'], ['Analytical', 'Snowflake gold', 'Trend and root-cause analysis']],
    model: { pattern: 'Accumulating snapshot fact for breaks (open → resolved)', grain: 'Break', keys: 'break_id', temporal: 'Milestone dates', tables: [['fact_break', 'break_id, recon_type, source_a, source_b, key, diff_qty, diff_amt, opened_at, assigned_at, resolved_at, root_cause, owner']] },
    serving: [['Operations', 'Ops console'], ['Management KPIs', 'BI on Snowflake']],
    quality: ['Every recon run has a sign-off'], sensitivity: 'Confidential', retention: '7 years',
  }),

  // ── Investors, compliance & regulatory
  ds({
    id: 'investorsdata', name: 'Investors & capital activity', domain: 'investor',
    desc: 'Investor register, KYC status, subscriptions, redemptions and capital accounts.',
    source: ['ta'], vendors: ['Administrator / transfer agent (to confirm)'], delivery: 'Approved admin interface or secure share', volume: 'Profile after investor scope is confirmed', latency: 'Per dealing date',
    storage: [['Operational', 'Administrator TA system', 'Register of record'], ['Analytical', 'Snowflake restricted database', 'IR analytics and liquidity planning']],
    model: { pattern: 'SCD2 investor dimension (PII masked); capital activity fact; holdings snapshot', grain: 'Investor version; dealing order; holding × date', keys: 'investor_id', temporal: 'Effective dates', tables: [['dim_investor', 'investor_id, type, domicile, kyc_status (PII masked)'], ['fact_capital_activity', 'order_id, investor_id, fund_id, class_id, type, amount, shares, dealing_date'], ['fact_holding_monthly', 'month_end, investor_id, class_id, series, shares, value']] },
    serving: [['IR and redemption forecasting', 'Snowflake (restricted)'], ['Investor portal', 'Administrator']],
    quality: ['Register ties to shares in issue'], sensitivity: 'Restricted (PII)', retention: 'Per AML rules (5+ years after relationship)',
  }),
  ds({
    id: 'compliancedata', name: 'Compliance & surveillance', domain: 'investor',
    desc: 'Restricted lists, wall-crossings, rule check results, breaches and surveillance alerts.',
    source: ['compliance'], vendors: ['OMS compliance engine', 'NICE Actimize', 'Behavox'], delivery: 'Events and extracts', volume: 'Millions of checks per day', latency: 'Real time to daily',
    storage: [['Operational', 'Compliance systems', 'Pre-trade and cases'], ['Analytical', 'Snowflake restricted database', 'Evidence, testing and regulator requests']],
    model: { pattern: 'Event facts for checks and alerts; effective-dated restriction table', grain: 'Check; restriction per period', keys: 'check_id; restriction_id', temporal: 'Bitemporal for restrictions', tables: [['restriction', 'restriction_id, entity_id, scope (firm/team), reason, valid_from, valid_to'], ['wall_crossing', 'crossing_id, person_id, team_id, deal_ref, crossed_at, cleansed_at'], ['fact_check_result', 'check_id, order_id, rule_id, outcome, value, override_by, ts']] },
    serving: [['Pre-trade', 'Compliance engine'], ['Evidence and testing', 'Snowflake restricted']],
    quality: ['Every order has a check result'], sensitivity: 'Restricted (MNPI)', retention: '7 years',
  }),
  ds({
    id: 'regdata', name: 'Regulatory reporting data', domain: 'investor',
    desc: 'Governed mart producing Form PF, 13F, 13D/G, AIFMD Annex IV, CPO-PQR and regional disclosures.',
    source: ['reporting'], vendors: ['Filing tools (e.g. Confluence)', 'Regulator portals'], delivery: 'Built in Snowflake; exported to filing tools', volume: 'Small outputs, wide inputs', latency: 'Periodic',
    storage: [['Analytical', 'Snowflake regulatory mart', 'Lineage and as-of reproducibility']],
    model: { pattern: 'Regulation-shaped marts built from gold facts; filing snapshot frozen at submission', grain: 'Filing × section × line', keys: 'filing_id, section, line', temporal: 'As-of the reporting date, reproducible bitemporally', tables: [['reg_formpf_<section>', 'filing_id, fund_id, item, value, source_lineage'], ['reg_filing', 'filing_id, regime, period, status, submitted_at, snapshot_id']] },
    serving: [['Filings', 'Exports to filing tool'], ['Regulator questions', 'Reproduce any filing as-of']],
    quality: ['AUM ties to accounting', 'Lineage for every field'], sensitivity: 'Confidential', retention: 'Permanent',
  }),
]

// [use case, consumers, latency, serving layer, data shape, datasets]
export const servingLayers = [
  ['Live trading & PM views', 'PMs, traders', 'Proposed target; confirm SLO', 'Kafka → IBOR / validated risk API → WebSocket gateway; Redis caches', 'Streams of deltas; current-state views', ['orders', 'positions', 'risk', 'prices']],
  ['Pre-trade checks', 'OMS, compliance', '< 50 ms', 'In-memory caches in the compliance engine fed by events', 'Key-value lookups', ['positions', 'compliancedata', 'instruments', 'borrow']],
  ['Intraday risk & limits', 'Central risk, CIO', 'Seconds to 1 min (proposed)', 'Validated risk service; ClickHouse for slicing; limits service', 'Aggregates by dimension', ['risk', 'positions', 'capitaldata']],
  ['Quant research & backtesting', 'Quantitative Trading and other teams', 'interactive; large scans', 'kdb+ / ClickHouse for ticks; Snowpark or DuckDB over Iceberg; feature store', 'Point-in-time wide tables and time series', ['ticks', 'fundamentals', 'altdata', 'prices', 'riskmodel']],
  ['Discretionary research', 'Equity L/S, Event, Macro teams', 'interactive', 'Snowflake RESEARCH database + notebooks; shared research library; Cortex Search over notes', 'Curated tables and documents', ['fundamentals', 'altdata', 'indices', 'corpactions']],
  ['Operations & reconciliation', 'Operations', 'minutes', 'Operational systems + Snowflake ops mart', 'Exceptions and KPIs', ['recondata', 'cash', 'allocations']],
  ['Finance, NAV & performance', 'Fund accounting, CFO', 'daily', 'Snowflake finance mart + semantic layer + BI', 'Star schemas', ['gl', 'positions', 'prices']],
  ['Capital allocation & management', 'CIO, senior management', 'Intraday to daily (proposed)', 'Snowflake gold + cockpit cache; validated risk feed for live measures', 'Team-level aggregates', ['capitaldata', 'risk', 'positions']],
  ['Regulatory reporting', 'Compliance, reporting', 'periodic; reproducible', 'Snowflake regulatory mart → filing tools', 'Regulation-shaped tables, frozen snapshots', ['regdata', 'risk', 'gl', 'positions', 'entities']],
  ['Investor reporting & transparency', 'IR, investors', 'monthly', 'Snowflake marts → report generation; secure shares for investors who ask for data', 'Curated extracts', ['gl', 'risk', 'investorsdata']],
  ['External data exchange', 'Administrator, auditors, vendors', 'daily', 'Snowflake Secure Data Sharing in and out; SFTP where required', 'Contracted shares', ['gl', 'positions', 'prices']],
  ['Application data APIs', 'Internal apps', '< 100 ms', 'Data service over Postgres / caches, populated from gold', 'Typed APIs', ['instruments', 'org', 'entities']],
]

// [category, recommended, alternatives, where it sits]
export const techLandscape = [
  ['Event streaming', 'Confluent Cloud', ['Amazon MSK', 'Redpanda', 'Solace'], 'Real-time path'],
  ['Stream processing', 'Kafka Streams / Flink', ['Confluent Flink', 'Spark Structured Streaming'], 'Real-time path'],
  ['Real-time risk', 'Photon candidate, subject to diligence', ['In-house on Flink', 'Other vendor risk engines'], 'Real-time path'],
  ['Tick / time-series database', 'KX kdb+ or ClickHouse', ['OneTick', 'TimescaleDB', 'QuestDB'], 'Time-series path'],
  ['Object storage & table format', 'Amazon S3 + Apache Iceberg', ['Azure ADLS', 'Delta Lake'], 'Analytical path'],
  ['Cloud data platform', 'Snowflake', ['Databricks', 'Google BigQuery', 'Amazon Redshift'], 'Analytical path'],
  ['Ingestion', 'Snowpipe Streaming, Kafka Connect', ['Fivetran', 'Airbyte', 'Debezium'], 'Analytical path'],
  ['Transformation', 'dbt', ['Coalesce', 'SQLMesh', 'Snowflake Dynamic Tables'], 'Analytical path'],
  ['Orchestration', 'Dagster', ['Airflow (Astronomer)', 'Prefect'], 'Analytical path'],
  ['Catalog & governance', 'Snowflake Horizon + Atlan', ['Collibra', 'Alation', 'DataHub'], 'Governance'],
  ['Data quality & observability', 'dbt tests + Monte Carlo', ['Soda', 'Great Expectations', 'Anomalo'], 'Governance'],
  ['Semantic layer & BI', 'dbt Semantic Layer + Sigma', ['Cube', 'Tableau', 'Power BI', 'Looker'], 'Serving'],
  ['Notebooks & ML', 'Snowpark + JupyterHub', ['Databricks', 'Hex', 'SageMaker'], 'Serving'],
  ['Feature store', 'Snowflake Feature Store', ['Feast', 'Tecton'], 'Serving'],
  ['Operational databases', 'PostgreSQL', ['Aurora', 'CockroachDB'], 'Operational'],
  ['Caching', 'Redis', ['Hazelcast', 'Aerospike'], 'Serving'],
  ['Enterprise data management (finance)', 'Thin in-house masters', ['GoldenSource', 'Markit EDM', 'Arcesium'], 'Operational'],
]

// ───────────────────────── Alternative data ─────────────────────────

export const altData = {
  intro: 'Alternative data is any non-traditional dataset used to anticipate fundamentals, flows or prices before they show up in reported numbers. It arrives in every shape, from Snowflake shares to S3 drops of satellite imagery, and most of the value is lost if it is not captured point-in-time, mapped to the firm’s entities and governed for MNPI and personal data. In a collaborative platform, one licence and one conformed copy serve every entitled team.',

  // [category, what it measures, example vendors, typical delivery, cadence & history, native grain, modelling challenge, strategy groups, compliance watch-outs]
  categories: [
    ['Consumer transactions', 'Card and bank spend, receipts and e-commerce orders by merchant', ['YipitData', 'Bloomberg Second Measure', 'Consumer Edge', 'M Science', 'Earnest Analytics', 'Facteus'], 'Snowflake share, S3 Parquet', 'Daily / weekly; 5–10 years', 'Merchant × day (panel)', 'Panel drift and re-weighting; merchant → brand → company mapping; restatements', ['equity', 'event'], 'Personal data must be aggregated and de-identified at source; confirm consent chain'],
    ['Retail point-of-sale', 'Unit and dollar sales by product and retailer', ['Circana', 'NielsenIQ'], 'Files, portal, Snowflake share', 'Weekly; 3+ years', 'Product (UPC) × retailer × week', 'Product hierarchy to brand to company; fiscal-week alignment', ['equity'], 'Redistribution limits; licence per user'],
    ['Web & app activity', 'Web visits, app downloads, usage and engagement', ['Similarweb', 'Sensor Tower', 'data.ai', 'Apptopia'], 'API, Snowflake share, S3', 'Daily; 3–8 years', 'Domain or app × country × day', 'Domain/app → company mapping; methodology changes break series', ['equity', 'quant'], 'Ask how panel data is collected; SEC’s 2021 App Annie case shows regulators scrutinise sourcing claims'],
    ['Web-scraped & product data', 'Prices, product listings, job postings, reviews', ['Thinknum', 'DataWeave', 'LinkUp', 'Revelio Labs'], 'API, S3, Snowflake share', 'Daily; 2–10 years', 'URL / SKU / posting × day', 'Deduplication; entity resolution from free text; site changes', ['equity', 'event', 'quant'], 'Scraping terms of service and legal review of collection methods'],
    ['Geolocation & foot traffic', 'Visits to stores, factories, ports and offices', ['Placer.ai', 'Advan Research', 'Unacast'], 'Snowflake share, S3, API', 'Daily; 4–7 years', 'Point of interest × day', 'POI → brand → company mapping; geospatial joins; device panel changes', ['equity', 'event'], 'Location data is sensitive personal data in many jurisdictions; aggregated only'],
    ['Satellite & aerial imagery', 'Car counts, construction, crop health, oil storage, activity at sites', ['Planet', 'RS Metrics', 'SpaceKnow', 'Ursa Space'], 'S3 / cloud bucket (derived metrics); imagery via API', 'Daily–weekly; 5+ years', 'Site × capture date', 'Cloud cover gaps; irregular revisit times; site → owner mapping', ['fimacro', 'equity'], 'Usually low PII risk; licence often restricts raw imagery reuse'],
    ['Shipping, energy & supply chain', 'Vessel movements, cargo flows, customs records, storage levels', ['Kpler', 'Vortexa', 'Spire Maritime', 'S&P Global Panjiva', 'ImportGenius'], 'API, files, Snowflake share', 'Intraday–daily; 5–10 years', 'Vessel voyage / shipment × event', 'Vessel and shipper entity resolution; revisions as cargoes are confirmed', ['fimacro', 'event'], 'Customs data rules differ by country'],
    ['News, social & sentiment', 'Entity-tagged news and social posts with sentiment and event types', ['RavenPack', 'LSEG MarketPsych', 'Dataminr', 'Bloomberg Event-Driven Feeds'], 'Streaming API, S3, Snowflake share', 'Real time; 10–20 years', 'Story / post × entity', 'Entity tagging accuracy; deduplication of reposts; latency stamping', ['quant', 'event', 'fimacro'], 'Social data licence terms; avoid personal profiles'],
    ['Transcripts, experts & research', 'Earnings call transcripts, expert call libraries, broker research', ['AlphaSense (incl. Tegus)', 'Third Bridge', 'S&P Global transcripts', 'FactSet CallStreet'], 'Platform UI, API, bulk files', 'Event-driven; 10+ years', 'Document × section', 'Text storage, chunking and embeddings; linking speakers and companies', ['equity', 'event'], 'Expert networks are a classic MNPI risk; compliance chaperoning and call logs'],
    ['Hiring & workforce', 'Job postings, headcount and turnover by company and role', ['LinkUp', 'Revelio Labs', 'Thinknum'], 'S3, API, Snowflake share', 'Daily / monthly; 5+ years', 'Company × role × period', 'Taxonomy alignment of roles; company hierarchy', ['equity', 'quant'], 'Individual profile data must be aggregated'],
    ['High-frequency macro & prices', 'Online inflation, mobility, activity nowcasts, central bank text', ['PriceStats (State Street)', 'Truflation', 'Macrobond', 'Haver Analytics'], 'API, files, Snowflake share', 'Daily; 10+ years', 'Country × indicator × day', 'Vintages of revised series; release calendars', ['fimacro'], 'Low PII risk; check redistribution'],
    ['ESG & climate', 'Ratings, emissions, controversies, physical climate risk', ['MSCI ESG', 'Morningstar Sustainalytics', 'Clarity AI'], 'Files, API, Snowflake share', 'Monthly; 5–10 years', 'Company × metric × period', 'Methodology changes; rating history as-of', ['equity', 'fimacro'], 'Investor reporting claims must match data used'],
  ],

  // [mechanism, how it lands, recommended pattern, pros, cons, preferred?]
  delivery: [
    ['Snowflake Secure Data Share / Marketplace', 'Vendor tables appear as a read-only database in our account; no copy is made.', 'Query in place; capture daily vintages with scheduled clones or snapshot tables; build silver views on top.', ['No pipelines to run', 'Instant trials', 'Vendor pays storage'], ['Vendor can overwrite history silently unless you capture vintages', 'Compute cost is ours'], true],
    ['Databricks Delta Sharing / Iceberg catalogs', 'Open-protocol share readable by many engines.', 'Read in place via Iceberg/Delta connectors, or replicate to bronze if the share is in another cloud.', ['Open protocol; cross-cloud'], ['Feature support varies by engine'], false],
    ['Cloud bucket drop (S3 / GCS / Azure)', 'Vendor writes Parquet or CSV to a bucket we own or they own.', 'Event-driven load: object notification → Snowpipe into bronze, keyed by delivery file; keep files immutable.', ['Simple, scalable, cheap', 'Files are the vintage'], ['Schema drift; partial deliveries'], true],
    ['SFTP', 'Files pushed or pulled on a schedule.', 'Managed file transfer to S3 with checksum and expected-file calendar, then the bucket pattern.', ['Universal'], ['Fragile; slow; manual fixes'], false],
    ['REST / GraphQL API', 'We pull data on demand or on a schedule.', 'Scheduled extractor (Dagster) writing raw JSON to bronze with request parameters and response time stamped.', ['Fresh; selective'], ['Rate limits; we own pagination and retries; hard to backfill'], false],
    ['Streaming (WebSocket / Kafka / webhooks)', 'Real-time events pushed to us.', 'Land on Kafka first, then Snowpipe Streaming to bronze; receive timestamps on every message.', ['Lowest latency'], ['Operational overhead; replay depends on vendor'], false],
    ['Vendor platform only (UI / terminal)', 'Analysts use the vendor’s own tool.', 'Use for discovery and discretionary research only; no systematic use without an export right.', ['Fast to start'], ['No point-in-time capture; not usable for models'], false],
  ],

  // [step, owner, what happens, gate]
  lifecycle: [
    ['Discover', 'Data strategy team', 'Find candidate datasets via vendors, Neudata, Eagle Alpha, Snowflake Marketplace and AWS Data Exchange; log requests from teams in the dataset registry.', 'Request has a sponsor team and a hypothesis'],
    ['Due diligence', 'Compliance & legal', 'MNPI review, personal-data review, collection method and consent chain, scraping terms, licence and redistribution rights.', 'Compliance approval recorded'],
    ['Trial', 'Data engineering', 'Time-limited share or sample in a sandbox schema; entitlement only to the sponsor team.', 'Trial access with an end date'],
    ['Evaluate', 'Research team', 'Coverage and mapping rate, history depth, point-in-time integrity, correlation to KPIs, lead time, uniqueness versus existing data, backtest results.', 'Scorecard passes thresholds'],
    ['Contract & onboard', 'Data strategy + procurement', 'Price by users or teams, derived-data rights, delivery SLAs; production pipeline, mapping and data contract.', 'Signed licence; pipeline in production'],
    ['Operate', 'Data engineering', 'Freshness and quality monitors, vintage capture, schema-change alerts, usage and cost tracking per team.', 'Monitors green'],
    ['Review & renew', 'Data strategy + CIO office', 'Usage by team, alpha attribution, cost per active user; renew, renegotiate or drop.', 'Renewal decision recorded'],
    ['Offboard', 'Data engineering + compliance', 'Purge or retain data according to licence; revoke access; keep evidence of deletion.', 'Deletion certificate'],
  ],

  // [pattern, problem it solves, how]
  patterns: [
    ['Query in place, snapshot the vintages', 'Shares are live views the vendor can restate at any time.', 'Leave the data in the share for exploration, but snapshot each delivery (or daily) into a vintage table with vintage_id and captured_at so backtests use what was actually knowable.'],
    ['Delivery ledger', 'Knowing exactly what arrived, when, and in what state.', 'Every delivery gets a row in alt_delivery: dataset, delivery_id, received_at, rows, checksum, schema hash, status. All downstream rows carry delivery_id.'],
    ['Central entity-mapping service', 'Every vendor identifies companies differently (merchant names, domains, app IDs, POIs, vessels).', 'One mapping table from vendor keys to entity_id and instrument_id with confidence, method and validity dates; maintained once and shared by every dataset and team.'],
    ['Data contracts per dataset', 'Silent schema and methodology changes break signals.', 'Contract with expected columns, types, ranges and freshness; violations quarantine the delivery and alert the owner.'],
    ['Point-in-time feature layer', 'Look-ahead bias in research.', 'Gold features keyed on entity × as_of_date with known_at ≤ as_of, built only from vintages, never from the latest restated data.'],
    ['Usage metering', 'Expensive licences with unclear value.', 'Snowflake access history and query tags attribute usage to teams; feeds renewal reviews and cost allocation.'],
    ['Walled datasets', 'Some datasets are restricted to specific teams or carry MNPI risk.', 'Dataset-level tags drive row access policies; the research library shows that a dataset exists without exposing data to non-entitled teams.'],
  ],

  // Alt-data-specific modelling layers: [layer, what it holds, key tables]
  layers: [
    ['Bronze · vendor-native', 'Every delivery exactly as received, immutable, with delivery metadata. Share data is snapshotted into vintages here.', ['alt_delivery', 'alt_<vendor>_<dataset>_raw', 'alt_<vendor>_<dataset>_vintage']],
    ['Silver · conformed observations', 'Vendor data reshaped into a common long observation model, mapped to firm entities, with explicit period and knowledge time.', ['map_vendor_entity', 'alt_observation', 'alt_panel_stats', 'dim_alt_metric', 'alt_document + alt_document_chunk (text)', 'dim_location (geo, H3 index)']],
    ['Gold · point-in-time features', 'Features ready for research and PM views: aligned to fiscal periods, normalised, and comparable with consensus.', ['alt_feature_pit', 'alt_kpi_nowcast', 'alt_feature_registry']],
  ],

  // [table, columns, notes]
  tables: [
    ['dataset_registry', 'dataset_id, vendor, category, description, delivery_mechanism, licence_terms, mnpi_review_status, pii_class, sponsor_team, teams_entitled, cost, renewal_date, owner', 'Single catalogue of every alternative dataset, trial or production'],
    ['alt_delivery', 'dataset_id, delivery_id, received_at, period_covered, row_count, checksum, schema_hash, status (accepted/quarantined), notes', 'The ledger every downstream row refers to'],
    ['alt_<vendor>_<dataset>_vintage', 'vintage_id, captured_at, <vendor columns…>', 'Point-in-time snapshot of a share or API response'],
    ['map_vendor_entity', 'vendor, vendor_key, key_type (merchant/domain/app/poi/vessel/ticker), entity_id, instrument_id, brand_id, share_of_revenue, confidence, method (rule/manual/ML), valid_from, valid_to', 'Shared across all datasets; effective-dated for M&A and rebrands'],
    ['alt_observation', 'dataset_id, delivery_id, vintage_id, entity_id, brand_id, location_id, metric_id, period_start, period_end, value, unit, currency, panel_n, known_at', 'Long, conformed fact; known_at = when we first could have known it'],
    ['alt_panel_stats', 'dataset_id, period, panel_size, active_users, weighting_method, coverage_pct', 'Needed to normalise panel drift'],
    ['dim_alt_metric', 'metric_id, dataset_id, name, definition, unit, aggregation (sum/avg/last), seasonality', 'Semantic definitions so teams use metrics consistently'],
    ['alt_document / alt_document_chunk', 'doc_id, source, entity_ids[], published_at, received_at, text; chunk_id, doc_id, text, embedding (VECTOR)', 'Transcripts, news and filings for search and NLP; embeddings in Snowflake vector columns or a vector store'],
    ['dim_location', 'location_id, poi_name, brand_id, lat, lon, h3_r8, country, opened_on, closed_on', 'Geospatial joins via H3 hexagons'],
    ['alt_feature_pit', 'entity_id, as_of_date, feature_id, value, zscore, source_dataset, vintage_id, known_at', 'Gold feature table; one row per entity × day × feature'],
    ['alt_kpi_nowcast', 'entity_id, fiscal_period, kpi (revenue/units/subscribers), nowcast, consensus, surprise_pct, as_of_date', 'Aligned to company fiscal calendars for comparison with estimates'],
  ],

  // [problem, why it matters, how to model it]
  challenges: [
    ['Restatements and back-fill', 'Vendors revise history; backtests on revised data overstate performance.', 'Capture vintages; build features only from vintages with known_at; flag datasets whose history was back-filled at launch.'],
    ['Panel drift', 'Panel size and composition change over time, creating fake trends.', 'Store panel statistics; normalise per user or use vendor weights; prefer year-on-year growth within a stable cohort.'],
    ['Entity resolution', 'Merchants, brands, apps and sites must map to issuers, and mappings change with M&A.', 'Effective-dated mapping with confidence and revenue share; review queue for low-confidence mappings.'],
    ['Fiscal calendar alignment', 'Daily data must be compared to reported quarters that end on different dates.', 'Fiscal calendar table per company; aggregate observations to fiscal periods before comparing with consensus.'],
    ['Seasonality and calendar effects', 'Holidays and trading days distort raw comparisons.', 'Calendar-adjusted metrics in gold; keep raw values in silver.'],
    ['Mixed granularity', 'Store-day, brand-week and company-quarter data must combine.', 'Long observation model with explicit period_start / period_end and entity level; aggregation rules in dim_alt_metric.'],
    ['Unstructured text and imagery', 'Most of the signal is not in tables.', 'Store raw documents and imagery on object storage; keep derived metrics, entity tags and embeddings in silver; link everything with doc_id.'],
    ['Latency stamping', 'Signals depend on when data was usable, not when the event happened.', 'Keep event time, vendor publish time and our receive time on every record.'],
  ],

  // [metric, what good looks like]
  scorecard: [
    ['Universe coverage', 'Share of the team’s tradable universe with mapped data; e.g. > 60% of names by market value'],
    ['Mapping rate and confidence', 'Share of vendor rows mapped to entities with high confidence'],
    ['History depth', 'Enough history for out-of-sample tests across at least one cycle'],
    ['Point-in-time integrity', 'Vintages available or vendor guarantees no back-fill'],
    ['Predictive power', 'Correlation with reported KPIs and with returns; lead time before reporting'],
    ['Uniqueness', 'Low correlation to datasets the firm already owns'],
    ['Decay and crowding', 'Signal half-life; evidence of wide adoption'],
    ['Operational quality', 'On-time deliveries, schema stability, support responsiveness'],
    ['Cost per active team', 'Licence cost divided by teams that use it in production'],
    ['Compliance status', 'MNPI and personal-data reviews passed, with review date'],
  ],

  marketplaces: ['Snowflake Marketplace', 'Databricks Marketplace', 'AWS Data Exchange', 'Neudata', 'Eagle Alpha', 'Datarade'],
}

// ───────────────────────── Security master ─────────────────────────

export const secMaster = {
  intro: 'The security master is the dataset every other dataset depends on. Orders, positions, prices, risk, accounting, recon and regulatory filings all refer to an instrument; if two systems disagree about what that instrument is, every downstream number is suspect. The design goal is one internal identity per instrument that never changes, full history of every attribute and identifier, corporate actions applied once and published to everyone, and point-in-time answers for any date.',

  principles: [
    ['One internal ID, forever', 'instrument_id is a meaningless surrogate. Tickers, ISINs and FIGIs are attributes with validity dates, because they change and are reused.'],
    ['Model the real hierarchy', 'Issuer → instrument → listing → trading line. Identifiers attach at the level they actually describe.'],
    ['Never overwrite', 'Every change is a new version with valid time (when it was true) and recorded time (when we knew it).'],
    ['Golden copy by field, not by record', 'Each attribute group has its own source precedence; one vendor rarely wins everything.'],
    ['Corporate actions are events', 'Announcements are versioned events; positions, lots and prices are adjusted from those events, not edited by hand.'],
    ['Adjust on read', 'Store raw prices and quantities; apply cumulative adjustment factors at query time, so history is never rewritten.'],
    ['Delisted is not deleted', 'Matured, merged and delisted instruments stay forever with successor links, so universes are survivorship-free.'],
  ],

  // Entity hierarchy: [level, what it is, example, identifiers held here]
  hierarchy: [
    ['Issuer (legal entity)', 'The company, government or SPV that issues securities, with parent hierarchy.', 'Apple Inc.', 'LEI, internal entity_id'],
    ['Instrument', 'The economic security, independent of where it trades.', 'Apple Inc. common stock', 'ISIN, CUSIP, share-class FIGI, internal instrument_id'],
    ['Listing', 'The instrument on a specific venue and currency.', 'AAPL on Nasdaq in USD', 'MIC, FIGI, composite FIGI, SEDOL, exchange ticker, RIC, Bloomberg ticker'],
    ['Derivative / contract', 'Futures, options, swaps and other contracts referencing underlyings.', 'AAPL Jan-27 200 call; 10Y SOFR swap', 'OCC symbol, exchange contract code, UPI / ISDA taxonomy, internal contract_id'],
  ],

  // [table, columns, notes]
  tables: [
    ['hub_instrument', 'instrument_id, instrument_type, created_at, created_by', 'Identity only; never updated'],
    ['sat_instrument_core', 'instrument_id, name, asset_class, sub_type, currency, issuer_entity_id, country_of_risk, status, source, valid_from, valid_to, recorded_at, recorded_to', 'Bitemporal; one row per version'],
    ['sat_equity_terms', 'instrument_id, share_class, shares_outstanding, par_value, voting_rights, valid_from, valid_to, recorded_at, recorded_to', 'Asset-class satellites keep tables narrow'],
    ['sat_debt_terms', 'instrument_id, coupon_type, coupon, day_count, frequency, issue_date, maturity_date, call_schedule_id, seniority, valid_…', 'Schedules (coupons, calls, sinks) in child tables'],
    ['sat_derivative_terms', 'contract_id, underlying_id, contract_type, strike, expiry, multiplier, exercise_style, settlement_type, valid_…', 'Listed and OTC'],
    ['hub_listing / sat_listing', 'listing_id, instrument_id, mic, trading_currency, lot_size, tick_size_table, primary_flag, valid_…', 'Primary listing flag drives default pricing'],
    ['link_identifier', 'object_type (entity/instrument/listing), object_id, id_type, id_value, source, valid_from, valid_to, recorded_at', 'All identifiers with history; unique per type and value within a validity window'],
    ['sat_classification', 'instrument_id, scheme (GICS/BICS/ICB/internal), level_1…level_4, valid_from, valid_to, recorded_at', 'Several schemes side by side'],
    ['link_lineage', 'predecessor_id, successor_id, relation (merger/spin-off/conversion/rename), ratio, effective_date, ca_id', 'Chains instruments through corporate actions'],
    ['src_vendor_record', 'source, vendor_key, payload (variant), received_at, delivery_id, hash', 'Bronze: every vendor record as received'],
    ['golden_field_lineage', 'instrument_id, attribute, chosen_source, chosen_value, alternatives (variant), rule_id, decided_at', 'Explains why each golden value was chosen'],
    ['dim_instrument (gold, SCD2)', 'instrument_key, instrument_id, primary_listing_id, name, asset_class, sector, country_of_risk, currency, figi, isin, ticker, is_current, valid_from, valid_to', 'What most consumers query in Snowflake'],
  ],

  // Processing pipeline: [step, what happens, technology]
  pipeline: [
    ['Acquire', 'Bulk files and per-security requests from vendors; exchange notices; on-demand creation requests from the OMS or operations for new and OTC instruments.', 'Bloomberg Data License, ICE, LSEG, S&P; SFTP / API / shares'],
    ['Land', 'Store every vendor record untouched with delivery ID, hash and receive time.', 'S3 / Iceberg bronze; Snowflake RAW'],
    ['Normalise', 'Map vendor fields to the canonical model: codes, units, day counts, currencies, enumerations.', 'Python/Kotlin adapters per vendor'],
    ['Match', 'Find the existing instrument or create a new one, using an identifier cascade: exact identifier with matching type → composite key (issuer + type + currency + maturity/strike) → fuzzy name match to a review queue.', 'Matching service; review queue in ops console'],
    ['Build the golden copy', 'Apply field-level source precedence and survivorship rules; keep the losing values and the reason.', 'Rules engine over silver tables'],
    ['Validate', 'Business rules: identifier format and check digits, uniqueness within validity windows, mandatory fields by asset class, cross-vendor tolerance on key terms.', 'Data contracts + rule tests'],
    ['Approve exceptions', 'Conflicts, low-confidence matches and manual instruments go to maker-checker in the ops console.', 'Workflow + maker-checker service'],
    ['Publish', 'Write a new bitemporal version; emit InstrumentCreated/Updated events; refresh caches and gold.', 'Postgres → Kafka refdata.* → Redis, Snowflake'],
    ['Reconcile downstream', 'Daily compare of key terms and identifiers with the OMS, accounting system, administrator and prime brokers.', 'Recon service; breaks to exception inbox'],
  ],

  // Source precedence: [attribute group, first choice, then, notes]
  precedence: [
    ['Listed equity terms', 'Primary exchange', 'Bloomberg → ICE → LSEG', 'Lot size and tick tables from the venue'],
    ['Bond terms and schedules', 'ICE', 'Bloomberg → LSEG', 'Prospectus review for new issues held'],
    ['Listed derivatives', 'Exchange / clearing house', 'Bloomberg', 'Contract specs from the exchange'],
    ['OTC derivatives', 'Trade confirmation', 'Internal setup', 'Terms come from the ISDA confirmation, not a vendor'],
    ['Identifiers', 'Issuing agency (ANNA/CUSIP/OpenFIGI)', 'Bloomberg → LSEG', 'Check digits validated on load'],
    ['Issuer & LEI', 'GLEIF', 'Bloomberg → S&P', 'Parent hierarchy from GLEIF level 2 where available'],
    ['Classification', 'Licensed scheme owner (MSCI/S&P for GICS)', 'Bloomberg BICS', 'Internal sector overrides held separately'],
    ['Country of risk', 'Bloomberg', 'Internal override', 'Override requires approval'],
    ['Corporate actions', 'Two sources must agree', 'Custodian notice as tie-break', 'Never released on one source'],
  ],

  // CA lifecycle: [stage, timing, what happens, systems]
  caLifecycle: [
    ['Announce', 'As soon as published', 'Vendor and custodian notices land as raw records; a CA event is created or updated (new version).', ['secmaster']],
    ['Scrub', 'Same day', 'Compare sources field by field (type, ratio, dates, currency, options). Agreement → golden CA; disagreement → exception.', ['secmaster', 'opsconsole']],
    ['Enrich & validate', 'Before release', 'Derive adjustment factors, tax treatment, new instruments needed (e.g. spin-off shares, rights), and impacted holdings.', ['secmaster', 'ibor']],
    ['Notify & elect', 'Voluntary events: before deadline', 'Notify holding teams; PMs elect options in the ops console; elections sent to custodian/PB.', ['opsconsole', 'custodian', 'pb']],
    ['Pre-ex impact', 'T−2 to ex-date', 'Projected positions and cash for PMS, risk and compliance (e.g. ownership after a merger).', ['ibor', 'risk', 'compliance']],
    ['Apply on ex-date', 'Start of ex-date', 'Positions and lots adjusted by events; new instruments created and linked; adjustment factors published; option and future terms adjusted by the exchange.', ['ibor', 'secmaster', 'mdhub']],
    ['Pay date', 'Pay date', 'Cash or stock entitlements booked; accruals released in accounting.', ['accounting', 'settlement']],
    ['Reconcile & close', 'After pay date', 'Entitlements reconciled with custodian and PB; differences claimed; event closed.', ['recon', 'custodian', 'pb']],
  ],

  // CA types: [type, mandatory/voluntary, security master, positions & lots, prices, accounting]
  caTypes: [
    ['Cash dividend', 'Mandatory', 'CA event; no new instrument', 'No quantity change; receivable on ex-date', 'Total-return factor (P − D) / P', 'Dividend receivable; withholding tax'],
    ['Stock split / reverse split', 'Mandatory', 'Shares outstanding updated; identifiers usually unchanged', 'Quantity × ratio; cost per share ÷ ratio; lot dates kept', 'Price and volume factor 1 / ratio', 'No P&L'],
    ['Stock dividend / bonus issue', 'Mandatory', 'CA event', 'Quantity increases; cost reallocated', 'Factor 1 / (1 + rate)', 'No P&L'],
    ['Spin-off', 'Mandatory', 'New instrument created; lineage link parent → child', 'New position in child; cost basis split by allocation ratio', 'Parent factor (P − child value) / P', 'Cost allocation per tax rules'],
    ['Merger (cash)', 'Mandatory', 'Target delisted; lineage to acquirer as “acquired by”', 'Position closed for cash', 'Series ends', 'Realised P&L'],
    ['Merger (stock / mixed)', 'Mandatory, sometimes with election', 'Target delisted; lineage with ratio', 'Target replaced by acquirer shares (+ cash, fractional cash)', 'Target series ends; acquirer unaffected', 'Realised or rolled cost by tax rules'],
    ['Rights issue', 'Voluntary (exercise)', 'Rights instrument created with expiry', 'Rights position; exercise creates shares', 'Theoretical ex-rights price factor', 'Cost of exercise added'],
    ['Tender offer / buyback', 'Voluntary', 'CA event with options', 'Shares tendered move to pending, then cash', 'None', 'Realised P&L on acceptance'],
    ['Name, ticker or identifier change', 'Mandatory', 'New identifier versions; instrument_id unchanged', 'None', 'None', 'None'],
    ['Delisting / suspension', 'Mandatory', 'Listing status changed; instrument kept', 'Flag for valuation; may move to OTC listing', 'Pricing source changes', 'Fair value review'],
    ['Bond call / redemption / maturity', 'Mandatory (call by issuer)', 'Status matured or called; schedule updated', 'Position closed at redemption price', 'Series ends', 'Realised P&L; accrued interest paid'],
    ['Coupon / rate reset', 'Mandatory', 'Schedule row updated', 'Accrual changes', 'None', 'Interest accrual'],
    ['Convertible conversion', 'Voluntary or forced', 'Lineage bond → equity with ratio', 'Bond replaced by shares', 'Bond series ends', 'Cost rolled to shares'],
    ['Default / restructuring', 'Mandatory', 'Status defaulted; possible exchange into new instruments', 'Exchange into new instruments per terms', 'Pricing source changes', 'Impairment / fair value'],
  ],

  // Historic data: [topic, approach]
  history: [
    ['Two time axes', 'valid_from / valid_to say when a fact was true in the world; recorded_at / recorded_to say when the platform believed it. A correction adds a new recorded version; it never edits the old one.'],
    ['“As of” and “as at”', 'As of a date: what was true then, using today’s knowledge. As at a date: what we believed then. NAV reproduction and regulatory questions use “as at”; research uses “as of” with known_at controls.'],
    ['Identifier reuse and change', 'Tickers are reassigned to different companies, and identifiers such as CUSIP and ISIN change on many corporate actions. Lookups by identifier always take a date, and the unique constraint is (id_type, id_value, validity window).'],
    ['Lineage across corporate actions', 'link_lineage chains predecessors and successors, so a 2015 position in a target company can be followed into today’s acquirer.'],
    ['Survivorship-free universes', 'Matured, merged and delisted instruments are never removed; research universes are built as-of each date from status history.'],
    ['Adjusted versus raw prices', 'Raw prices and quantities are stored once. Cumulative adjustment factors (product of all factors after a date) are computed from CA events and applied on read.'],
    ['Restatement of a CA', 'If a CA is corrected after ex-date, a new CA version is recorded, factors are recomputed, and IBOR and accounting process the difference as an adjustment event.'],
    ['Retention', 'Permanent for instruments, identifiers and CAs; vendor raw records kept per licence and audit requirements.'],
  ],

  sql: [
    ['Instrument as it was on a date, as we knew it then', `select *
from sat_instrument_core
where instrument_id = :id
  and :as_of_date >= valid_from and :as_of_date < valid_to
  and :as_at_ts  >= recorded_at and :as_at_ts  < recorded_to;`],
    ['Resolve a ticker on a historical date', `select object_id as listing_id
from link_identifier
where id_type = 'EXCH_TICKER' and id_value = 'META'
  and date '2021-06-30' >= valid_from and date '2021-06-30' < valid_to;
-- does not return Meta Platforms: it traded as FB until June 2022, so ticker lookups must always be dated`],
    ['Split- and dividend-adjusted closes, applied on read', `select p.instrument_id, p.price_date,
       p.close * coalesce(f.cum_price_factor, 1) as adj_close
from price_official p
left join instrument_cum_factor f
  on f.instrument_id = p.instrument_id
 and p.price_date >= f.valid_from and p.price_date < f.valid_to;`],
  ],

  quality: [
    ['Identifier integrity', 'Check digits valid; no duplicate (type, value) in overlapping windows'],
    ['Completeness', 'Mandatory fields present per asset class; every held instrument fully set up'],
    ['Cross-source agreement', 'Key terms within tolerance across vendors'],
    ['Referential integrity', 'No trade, position or price references an unknown instrument_id'],
    ['CA timeliness', 'Golden CA released ≥ 2 business days before ex-date'],
    ['Downstream consistency', 'OMS, accounting, admin and PB agree on identifiers and key terms'],
  ],
  kpis: [['New listed instrument available', '< 5 min'], ['New OTC instrument (maker-checker)', '< 30 min'], ['Exceptions older than 1 day', '0'], ['CA released before ex-date', '100%'], ['Downstream identifier breaks', '0 at 09:00 ET']],
}
