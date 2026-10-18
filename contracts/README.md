# Schema-contract reference design

These are draft design artefacts for the private blueprint. They do not provision
a registry, change a live trading interface, or implement a production validator.
`specVersion: blueprint.contract/1` is a proposed internal manifest format, not an
external data-contract standard. Its `quality.rules` vocabulary must be implemented
and tested by the contract compiler and runtime adapters before activation.

## Files

- `contract.schema.json`: JSON Schema for the manifest envelope. Rule-specific
  parameters need additional compiler validation; schema validation alone is not
  business validation.
- `acceptance-cases.json`: positive/negative acceptance scenarios and required
  behavior to implement in the real adapters, publication gates and consumer tests.
- `trading/execution-reported/1.0.0/`: Protobuf event, manifest and synthetic
  ProtoJSON fixtures covering original, correction and bust.
- `research/fundamentals-pit/1.0.0/`: analytical product manifest, synthetic
  availability/correction fixtures and illustrative dbt model definition.

## Recommended implementation

1. Domain owners author the manifest and native schema/model in Git. Resolve role
   owners to actual service records and assign measured SLOs before activation.
2. CI validates the envelope, supported rule parameters, lint/compatibility,
   generated types, fixtures, downstream expectations and permissions. Financial
   semantics, history and population require explicit domain review.
3. Approval produces an immutable bundle containing manifest, physical schemas,
   validators, rule implementations/versions and a digest. An environment binding
   records the local registry IDs and database/topic names. Never assume registry
   IDs match between environments.
4. Deployment registers approved schemas and distributes pinned manifests/types.
   Producers cannot auto-register or select arbitrary latest schemas. A consumer
   must explicitly support the contract release and relevant business semantics.
5. Runtime validates at capture/publication boundaries. Preserve raw evidence,
   quarantine or hold affected derived products, emit owned incidents and prevent
   silent data loss. Database constraints and broker schema-ID checks do not
   establish end-to-end correctness.

The trading example is deliberately scoped to executions of listed cash equities.
It records fills before fund/book allocation; allocation is a separate domain
event. Quantity and price are exact decimal strings on the wire. Generated
validators must reject noncanonical, out-of-range, NaN or infinite values and
convert them using a decimal library, never binary floating-point coercion.

`source_revision` is monotonic for a `(producer_id, execution_id)` chain. Corrections
are complete replacement images; busts make the execution inactive. Adapters must
resolve native references durably and hold ambiguous or missing predecessor chains.
The consumer transaction deduplicates `event_id`, verifies chain state and writes
the projection plus an outbox atomically. It does not simply add every quantity.

Research `available_at` records the earliest permitted, accepted availability of
that vintage in the platform, at or after receipt and source publication. A source
publication timestamp alone does not establish platform availability. Revised
values append vintages; they never replace historical knowledge. Retain relevant
licence and access snapshots for reproducibility.

The dbt example assumes a supported table materialization and a Snowflake adapter.
It is not a Dynamic Table example. dbt contract enforcement checks model structure;
data tests and a staged publication gate must establish uniqueness, referential
coverage, chronology and the expected delivery population. Generate table/view
access policies separately from approved security metadata and verify every engine
and export path.

## Validation limits

JSON syntax, manifest shape and fixture invariants can be checked locally.
The design still requires CI compilation/registry compatibility tests against the chosen deployed toolchain,
dbt build/data tests against the chosen warehouse, adapter integration tests,
consumer replay tests and operational acceptance before production use.

Public technical references are linked in the site's Schema contracts section.
