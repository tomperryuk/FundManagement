export const contractSources = [
  ['Confluent schema evolution and compatibility', 'https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html'],
  ['Protobuf schema best practices', 'https://protobuf.dev/best-practices/dos-donts/'],
  ['Protobuf field presence', 'https://protobuf.dev/design-decisions/implicit-presence/'],
  ['Schema registration outside clients', 'https://docs.confluent.io/platform/current/schema-registry/security/index.html'],
  ['dbt model contracts', 'https://docs.getdbt.com/docs/mesh/govern/model-contracts'],
  ['dbt model versions', 'https://docs.getdbt.com/docs/mesh/govern/model-versions'],
  ['dbt constraints and warehouse enforcement', 'https://docs.getdbt.com/reference/resource-properties/constraints'],
  ['Snowflake Dynamic Table/dbt limitations', 'https://docs.snowflake.com/en/user-guide/dynamic-tables/dbt'],
]

export const contractFlow = {
  title: 'From owned contract to controlled publication',
  intro: 'A Git-authored contract becomes an approved, immutable release. Each execution environment receives local bindings and validators; data is checked where it crosses a publication boundary.',
  rows: [
    { label: 'Author & approve', tone: 'work', steps: [{ t: 'Domain owner + producer', d: 'Meaning, grain, fields, time, obligations' }, { t: 'Contract manifest + native schema', d: 'JSON metadata; Protobuf or dbt model' }, { t: 'CI + consumer review', d: 'Compatibility, fixtures, semantics and access' }, { t: 'Approved release bundle', d: 'Digest, versions, approvals and generated validators' }] },
    { label: 'Deploy the control plane', tone: 'control', between: 'A promotion identity deploys exactly the approved artefact', steps: [{ t: 'Environment binding', d: 'Resolve local topic/table, registry IDs and policy refs' }, { t: 'Schema registry / table definition', d: 'Approved versions, restricted write authority' }, { t: 'Pinned producer / consumer packages', d: 'Local validation and accepted-release metadata' }] },
    { label: 'Enforce in the data plane', tone: 'data', parallel: true, between: 'The registry is not a per-message central validator; keep cached approved schemas and native enforcement at each boundary', steps: [{ t: 'Event capture', d: 'Persist raw → validate → canonical event or owned hold' }, { t: 'Dataset publication', d: 'Stage version → quality/reconciliation → atomic acceptance' }, { t: 'Consumer access', d: 'Apply entitlement, as-of selection and supported-version checks' }] },
  ],
  callout: ['Execution boundary', 'Apply checks at execution-report capture and data publication. No contract server, catalog, warehouse or AI service is introduced as a synchronous dependency of order release. Existing market-access controls remain local to their approved execution path.'],
  loop: 'Validation results, consumer versions, delivery gaps and approved exceptions feed back to contract owners and the incident process.',
}

export const contractLayers = [
  ['Structure', 'Fields, types, presence, enums, precision and physical encoding.', 'Protobuf/compiler + registry compatibility; dbt column/type contracts; file/API schema adapters.', 'A valid schema does not prove a correct instrument, price, position or business state.'],
  ['Business meaning', 'Grain, identity, units, signs, source authority, event versus knowledge time, corrections and allocation boundaries.', 'Versioned domain validators and consumer expectations reviewed by business owners.', 'Changing currency, scale, netting or position basis is breaking even if bytes/types are unchanged.'],
  ['Quality & service', 'Expected population, completeness, freshness/cut-off, chronology, reconciliation and recovery.', 'Ingestion gates, stateful checks, staged publication, query guards and service monitoring.', 'Population and end-to-end completeness need external evidence; a row-count trend is insufficient.'],
  ['Security & ownership', 'Producer/consumer identity, data rights, team/deal walls, accountable owners, retention and escalation.', 'IAM/ACLs, storage/query/API policies, owner catalogue and audit evidence.', 'Metadata declares intended controls; enforcement must be deployed and verified on each access/export path.'],
]

export const contractFields = [
  ['Identity / release', 'Stable domain ID; semantic version; lifecycle status; immutable bundle digest. Registry versions and IDs are separate.'],
  ['Owner / consumers', 'Business owner, delivery owner, control approver, support service; registered consumers, accepted release and review evidence.'],
  ['Physical binding', 'Environment-specific topics/subjects or tables/views, schema format, registry compatibility and materialisation. IDs are resolved per environment.'],
  ['Grain / keys', 'What a row/event means, logical key, message key, deduplication key, ordering scope and key-preservation rules.'],
  ['Fields / units', 'Types, presence/nullability, exact decimal representation, units, currency basis, enum behavior and reference-data dependencies.'],
  ['Temporal meaning', 'Business event time; source publication; receipt; accepted availability; valid/recorded time where needed; calendar and clock policy.'],
  ['Correction / replay', 'Replacement versus delta semantics, predecessor references, revisions, duplicate conflicts, late events and deterministic state rebuild.'],
  ['Quality / service', 'Named rule implementations and severity, expected population, cut-off/freshness/completeness SLOs, recovery needs and acceptance tests.'],
  ['Security / retention', 'Classification, policy references, licence/purpose, allowed audiences, export/region limits and approved retention schedule.'],
  ['Examples / migrations', 'Valid and invalid fixtures, consumer replay cases, compatibility/migration strategy, deprecation owner and retirement evidence.'],
]

export const technologyChoices = [
  ['Contract source', 'Git + protected review + a small internal manifest format.', 'Adopt an external data-contract specification if it covers the required semantics; keep only necessary extensions.', 'One source of authoring truth; generated schemas/policies must not drift from the release.'],
  ['Event structure', 'Protobuf for new typed trading interfaces; explicit presence for important scalar fields.', 'Avro where Kafka Connect or existing data contracts already use it; JSON Schema for JSON APIs/files.', 'Select one native event format per boundary. Protobuf optional presence still requires business-requiredness validation.'],
  ['Registry', 'Existing Confluent Schema Registry if the backbone is Confluent/Kafka; explicit compatibility configuration.', 'Compatible managed registry or the existing enterprise registry after format/compatibility validation.', 'A registry records schemas and compatibility. Broker validation, if available, is distinct from full payload and business-rule checks.'],
  ['Analytical contracts', 'dbt contracted table models, separate quality tests and a staged publication gate.', 'Native warehouse DDL/checks or Spark/Databricks expectations under the same manifest.', 'Constraint enforcement differs by engine. This example uses table materialisation; do not assume dbt Dynamic Table contracts are supported.'],
  ['Rule execution', 'Small versioned validator libraries: stateless at adapters; stateful in canonicalisation; batch checks before publish; as-of rules at query access.', 'A rule framework already operated by the firm, such as Soda/Great Expectations for applicable batch checks.', 'One shared rule definition can need several adapters. Validate decimal/time equivalence across Java, Python and SQL.'],
  ['Visibility / workflow', 'PostgreSQL release/binding/audit records and existing catalog/incident tools; no new central product required initially.', 'Extend a mature existing governance/catalog platform if it supports the lifecycle and audit needs.', 'Git defines releases; metadata services index deployed state and evidence. Runtime should tolerate their outage using approved local artefacts.'],
]

export const controlPlaneRecords = [
  ['contract_release', 'contract_id, semantic_version, bundle_digest, manifest/schema/validator refs, rule-engine version, approval evidence', 'Immutable content; append lifecycle events for activation, deprecation or revocation.'],
  ['environment_binding', 'release_digest, environment, topic/subject or table/view, local registry IDs, deployed policy versions, deployed_at', 'Promote the same release, then resolve local infrastructure. Never copy a development registry ID into production.'],
  ['consumer_registration', 'service_id, owner, accepted contract releases, semantic expectations, last acknowledgement, observed usage', 'Use acknowledgements plus actual dependency/usage evidence before retirement; a stale catalog entry is not proof of migration.'],
  ['validation_run', 'contract_digest, delivery/event/run ID, rule/version, result, affected scope, counts, incident/evidence reference', 'Restrict payload evidence and access; keep identifiers and aggregate results in general dashboards.'],
  ['contract_exception', 'rule, affected scope, reason, approver, compensating control, start/expiry, incident and consumer acknowledgement', 'Time-bound and attributable. Hard policy/entitlement violations cannot be waived by a generic pipeline override.'],
]

export const enforcementStages = [
  ['Before merge', 'Compiler validates manifest and supported rules, compiles schema/model, checks old-reader/new-writer and new-reader/old-writer fixtures as required, and tests consumer expectations.', 'Block the change; domain owner and affected consumer owners resolve semantics.'],
  ['Before deployment', 'Resolve owner/SLO/policy references; register compatible native schemas; bind local IDs; deploy access controls; verify consumers support the release.', 'Block activation or keep in shadow mode. Draft manifests with unapproved SLOs cannot be activated.'],
  ['At external capture', 'Record the original report/delivery and receipt evidence where permitted. Validate structure, producer identity, decimals, timestamps and known schema.', 'Quarantine or durably hold the affected canonical output; preserve raw evidence and alert the owner. Never silently lose a fill or mark partial data as complete.'],
  ['During canonical processing', 'Validate instrument references, execution revision chain, duplicate conflicts and business state. Apply updates with a durable deduplication record and transactional state/outbox.', 'Hold the affected key, expose downstream incomplete scope and reconcile missing predecessors. Resume only from proven state; respect partition/transaction checkpoint semantics.'],
  ['Before analytical publication', 'Build an isolated candidate version, test schema/keys/PIT chronology and reconcile expected population; deploy and verify policy. Record acceptance and flip the published version atomically.', 'Keep the prior accepted version visible with explicit freshness/status, or withhold it if unsafe. Failed candidates remain non-consumable.'],
  ['At consumer access', 'Enforce supported release, rights, approved population and research decision-time selection. Reject use of stale/incomplete data when the consuming workflow requires it.', 'Return an explicit unavailable/held state or block the dependent workflow under its approved control policy.'],
]

export const incidentCases = [
  ['Registry unavailable', 'Warm services use a pinned, approved schema/validator cached in the release. Do not use arbitrary latest or register schemas at runtime.', 'A cold start unable to resolve its approved schema/binding cannot publish canonical output. Continue durable raw capture only where its own safety/capacity policy permits.'],
  ['Unknown schema / invalid payload', 'Preserve original input; hold that event/delivery and record the schema/version failure and affected scope.', 'Record canonical stream incompleteness. Consumers may need to restrict affected risk/trading activity; never equate a dead-letter queue with business completion.'],
  ['Duplicate / conflicting event', 'Same ID and same immutable content is an idempotent replay. Same ID with changed content is a control incident.', 'Quarantine the conflict; keep accepted state and investigate. Retain deduplication evidence for the approved replay horizon.'],
  ['Revision arrives out of order', 'Persist the report and pending chain; reconcile against the source. Advance a transport checkpoint only after data is durably recoverable.', 'Do not apply revision 3 on top of revision 1 or lose revision 2. Rebuild and verify the complete chain before releasing the affected projection.'],
  ['Bad vendor batch / correction', 'Stage the new delivery, fail the gate, retain raw/vintage evidence and open an owned exception.', 'The last accepted version remains labelled by its real as-of/freshness. A later correction gets a new availability time; do not backdate it into research history.'],
]

export const evolutionRules = [
  ['New optional descriptive field', 'Potential minor release after native compatibility and consumer-fixture checks.', 'Upgrade readers first with BACKWARD_TRANSITIVE; only then publish writers using the new field. A field becoming economically mandatory needs a separate change review.'],
  ['Change field type, requiredness, name/tag or key', 'Breaking by default; determine wire, source-code, JSON and business compatibility separately.', 'Use a new major contract/binding, translate explicitly, shadow/dual-run and migrate consumers. Never reuse deleted Protobuf tags or names.'],
  ['Change units, signs, currency basis, aggregation or position basis', 'Semantic breaking change even if the physical schema is identical.', 'New major release and domain acceptance; dual-run numerical reconciliation on representative books and historical replay.'],
  ['Add enum value / operation', 'Treat as breaking unless all affected consumers explicitly support the new case.', 'Do not rely on unknown-enum decoding to establish safe business behavior. Expand readers and policy before writers emit it.'],
  ['Change freshness, cut-off, population, access or retention', 'Service/policy change; breaking if existing obligations or consumer permissions are reduced.', 'Require affected consumer and control-owner acceptance. Apply stricter rights immediately where required; never grant old access merely for compatibility.'],
  ['Source restatement / new delivery vintage', 'Data revision, usually not a contract-version change.', 'Append the vintage with real publication/receipt/availability and link prior records. Recompute explicitly without rewriting what was knowable earlier.'],
]

export const versionMeanings = [
  ['Manifest specVersion', 'blueprint.contract/1', 'Version of the internal manifest language and supported rule vocabulary.'],
  ['Contract semantic version', '1.0.0 → 2.0.0', 'Business interface and obligations; the approved release digest fixes its exact contents.'],
  ['Registry version / schema ID', 'Environment-local integer IDs', 'Registry bookkeeping for physical schemas. They are not semantic contract versions and may differ between environments.'],
  ['Event revision / dataset vintage', 'source_revision 1 → 2; VINTAGE-001 → 002', 'Changes to data under an existing contract; corrections do not automatically change the schema.'],
  ['dbt model major version', 'v1 candidate → v2 candidate', 'Parallel analytical interfaces during migration. Tie it explicitly to a contract major release.'],
]

export const rollout = [
  ['Start with two contracts', 'Trading + Research Data owners', 'Use ExecutionReported for one cash-equity adapter and fundamentals PIT for one research dataset. Confirm actual source semantics and map role owners to named service records.', 'Scope and consumer expectations accepted; event/order/allocation boundaries and source-history rights are explicit.'],
  ['Build compiler and evidence pipeline', 'Data Platform / Integration team', 'Implement the internal envelope/rule schemas, native-code generation, compatibility checks and immutable release packaging; deploy environment bindings and restrictive promotion identities.', 'Every supported rule has positive/negative fixtures; unsupported or ambiguous rules fail compilation; generated artefacts match the approved digest.'],
  ['Shadow real deliveries', 'Producer + consumer service owners', 'Run validation and reconciliation beside current production without silently dropping source data. Compare native timestamp, decimal, correction and population behavior.', 'No unexplained loss/duplication; consumer replay gives reconciled states. Test bad schema, missing references, unavailable registry and late revisions.'],
  ['Activate publication gates', 'Domain owner + relevant control approver', 'Approve measured SLOs, support, policy, backfill and recovery; release gated canonical events/table versions and onboard consumers in a controlled sequence.', 'Named owners and consumer sign-off; deterministic correction/replay; observed business completion; rollback to a compatible release demonstrated.'],
  ['Extend and retire deliberately', 'CDO / Chief Architect + domain owners', 'Reuse proven patterns for positions, prices, allocation and capital/limit contracts. Track reader versions and deprecations; retain old decoders and approved evidence through replay/records horizons.', 'Consumers migrated, no active old writers/readers needing the binding, retention/legal duties accepted and retirement approved.'],
]

export const contractMetrics = [
  ['Coverage', 'Critical interfaces/products with active, owned contracts and known consumers / agreed critical-interface population.', 'CDO / Chief Architect'],
  ['Business completeness', 'Eligible source executions or deliveries reaching accepted downstream state; unresolved omissions by age and materiality.', 'Trading Operations / data product owner'],
  ['Change safety', 'Breaking changes caught before production; contract-related incidents and time to restore; unreviewed/drifted deployments.', 'Engineering/service owner'],
  ['Operational response', 'Invalid delivery/event rate by cause, held scope and age, false-positive burden, exception expiry and owner response.', 'Data Operations / domain service owner'],
  ['Research integrity', 'Reproduced experiments using original availability/vintages; look-ahead failures and entity/universe coverage.', 'Research Data owner / strategy sponsor'],
]
