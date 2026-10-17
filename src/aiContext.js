// Where an ontology / context layer, AI and AI-assisted development fit the platform.
// Priorities, tools and timings are hypotheses to validate against the firm's data estate, policies and model-provider terms.

export const intro = 'The platform already has the raw material for a shared business vocabulary: a security master, a semantic layer, event schemas and an interface catalogue. An ontology or context layer joins them into one governed model of what things are, how they relate and where their data lives. People, applications and AI agents then read the same definitions instead of each guessing. AI adds value mainly where that shared context exists, so the context layer comes first and the AI use cases build on it.'

export const definition = [
  ['Ontology', 'A governed model of business concepts (fund, strategy team, instrument, issuer, counterparty, account, position, order, trade, agreement, limit, control), their definitions and the relationships between them.'],
  ['Context layer', 'The ontology plus everything needed to act on it: identifiers, metric definitions, data contracts, lineage, access policy and descriptions that tools and AI agents can retrieve.'],
  ['What it is not', 'Not a new system of record and not a replacement for the security master, IBOR or data platform. It describes and links them, and the owners of those systems stay accountable for the data.'],
]

// [layer, what it holds, where it builds on, owner]
export const layers = [
  ['Concepts & relationships', 'Definitions and links such as issuer → instrument → position → lot, or team → book → limit.', 'Data models in the data platform; the glossary', 'CDO with business owners'],
  ['Identifiers & entity resolution', 'One identity for each issuer, instrument, counterparty and legal entity, mapped to every vendor and internal identifier.', 'secmaster', 'CDO (reference data)'],
  ['Metrics & semantic layer', 'One definition of exposure, P&L, NAV, turnover and similar measures, computed the same way everywhere.', 'lake', 'CDO with CFO and CRO'],
  ['Contracts & lineage', 'Event and table schemas, owners, service levels and where each field comes from and goes to.', 'bus', 'Producing teams; data governance council'],
  ['Policy', 'Classification and entitlement attached to concepts, including information walls and material non-public information (MNPI) rules.', 'iam', 'CCO with CTO'],
  ['Agent context', 'Plain-language descriptions, examples and retrieval indexes that let AI tools find the right data and use the right definition.', 'research', 'CDO and platform team'],
]

// [component, where the context layer adds value, example, priority]
export const valueSpots = [
  ['secmaster', 'Entity resolution and cross-vendor mapping become explicit, versioned relationships instead of hidden joins.', 'An issuer’s ticker, vendor IDs and parent company map to one entity across prices, filings and alternative data.', 'High'],
  ['lake', 'Metric and table definitions are discoverable and consistent; lineage shows impact before a change.', 'Before renaming a column, list every dashboard, model and report that depends on it.', 'High'],
  ['research', 'Researchers and AI assistants find datasets, features and prior work by meaning, not by table name.', 'Ask which datasets cover supply-chain exposure for European retailers and see lineage, history and licence limits.', 'High'],
  ['compliance', 'Rules, restricted lists and wall-crossing refer to the same entities and relationships as trading and research.', 'A restriction on a parent company applies to subsidiaries, derivatives and related issuers automatically.', 'High'],
  ['risk', 'Exposures roll up consistently across instruments, issuers, factors and teams.', 'A single definition of “gross exposure to a sector” for the CRO, PMs and the administrator.', 'Medium'],
  ['recon', 'Breaks are classified by cause using known relationships between records and sources.', 'A position break is traced to a corporate action not yet applied at the custodian.', 'Medium'],
  ['reporting', 'Regulatory fields map to governed concepts with lineage back to source.', 'Each Form PF field links to the datasets, rules and approvals that produce it.', 'Medium'],
  ['opsconsole', 'Exceptions arrive with context: related trades, agreements, owners and past resolutions.', 'A settlement fail shows the counterparty’s SSI history, similar fails and who resolved them.', 'Medium'],
  ['accounting', 'Valuation and accrual rules refer to defined instrument and event types.', 'Pricing source hierarchy applies by instrument class and is auditable.', 'Later'],
  ['investorportal', 'Investor queries resolve to the right fund, share class and document set.', 'Answer which fee terms apply to a share class from the governed documents.', 'Later'],
]

// [use case, components, what AI does, human control, posture]
export const useCases = [
  ['Data discovery and questions', ['research', 'lake'], 'Finds datasets and writes governed queries using the ontology and semantic layer.', 'Queries run with the user’s own entitlements; results cite the data used.', 'Assist'],
  ['Research summarisation', ['research', 'alt'], 'Summarises filings, transcripts, broker research and news into the analyst’s own workflow.', 'Analyst owns the conclusion; sources are linked; walls and licences apply.', 'Assist'],
  ['Entity and vendor mapping', ['secmaster'], 'Proposes matches between vendor identifiers, issuers and company names.', 'Low-confidence matches go to the reference-data desk; approved mappings are versioned.', 'Automate with review'],
  ['Break and exception triage', ['recon', 'opsconsole'], 'Classifies breaks, suggests cause and next action, drafts broker or custodian queries.', 'Operations approves any message sent or booking made.', 'Assist'],
  ['Corporate-action reading', ['secmaster', 'ibor'], 'Extracts terms from notices and compares them with vendor feeds.', 'Reference-data desk confirms before election or booking.', 'Automate with review'],
  ['Surveillance and communications review', ['compliance'], 'Prioritises alerts and drafts case summaries.', 'Compliance officers decide outcomes; model use is documented.', 'Assist'],
  ['Regulatory and investor drafting', ['reporting', 'investorportal'], 'Drafts narrative sections and due-diligence responses from governed data.', 'CFO and CCO sign off; every figure traces to its source.', 'Assist'],
  ['Operations and incident support', ['obs'], 'Summarises incidents, finds likely causes and drafts runbook steps.', 'Engineers decide and execute changes.', 'Assist'],
]

// Areas to keep deterministic.
export const notForAI = [
  ['Pre-trade limits and compliance checks', 'Rules must be deterministic, testable and fast. An AI may help author or review a rule, never decide an order.'],
  ['Order routing and execution', 'Execution logic is a controlled, tested algorithm with known behaviour.'],
  ['Official NAV and valuation sign-off', 'Prices and marks follow an approved hierarchy and are signed off by named people.'],
  ['Payment release and bank detail changes', 'Dual authorisation and call-back checks stay human and mandatory.'],
  ['Information wall decisions', 'Access is granted by policy and approval, not inferred.'],
]

// [stage, how AI helps, context it needs, control]
export const sdlc = [
  ['Requirements and design', 'Drafts design options, decision-register entries and interface specs; checks a proposal against existing components and principles.', 'This blueprint: component map, interface catalogue, principles and decisions', 'Architecture review board owns every design decision'],
  ['Coding', 'Writes and refactors code, adapters and tests inside the paved road, with repository and platform conventions as context.', 'Repository standards, event schemas, API contracts, security rules', 'Every change goes through normal pull-request review; no direct commits'],
  ['Testing', 'Generates unit, contract and scenario tests from schemas and the lifecycle workflows; builds synthetic data and replays recorded events.', 'Data contracts, scenario catalogue (corporate action, margin call, drawdown)', 'Tests must fail before the fix and pass after; coverage thresholds unchanged'],
  ['Review and security', 'First-pass review for bugs, secrets and policy violations; explains diffs to reviewers.', 'Coding standards, threat models, dependency policy', 'Humans approve; scanners and policy-as-code remain the gate'],
  ['Release', 'Writes change notes, checks migrations and schema compatibility, proposes rollback steps.', 'Schema registry, deployment history, dependency graph', 'Release approval and separation of duties unchanged'],
  ['Operations', 'Triages alerts, correlates logs and traces, drafts incident summaries and postmortems.', 'Runbooks, service ownership, observability data', 'On-call engineer decides; production access stays least-privilege'],
  ['Migration and legacy', 'Reads legacy code and spreadsheets, documents behaviour and proposes equivalent tests before replacement.', 'Legacy source, sample outputs, target contracts', 'Parallel run and reconciliation before cut-over'],
]

// [measure, what to track]
export const sdlcMeasures = [
  ['Lead time', 'Idea to production for a typical change'],
  ['Change failure rate', 'Share of releases causing incidents or rollbacks'],
  ['Review load', 'Time reviewers spend per change and defects found after merge'],
  ['Test health', 'Escaped defects and flaky tests'],
  ['Cost', 'Model spend per team against hours saved'],
]

// [risk, control, owner]
export const guardrails = [
  ['Information walls and MNPI', 'AI tools run with the user’s entitlements and policy attached to the ontology. No cross-team retrieval index mixes walled data.', 'CCO with CDO'],
  ['Data leaving the firm', 'Use enterprise model terms with no training on firm data, regional processing where needed, and private hosting for the most sensitive data. Classify what each tool may send.', 'CTO with CISO'],
  ['Incorrect or invented output', 'Ground answers in governed data, show sources, evaluate against test sets and keep humans on every consequential action.', 'Owning team'],
  ['Prompt injection', 'Treat vendor files, emails and web pages as untrusted. Give agents narrow tools, no standing credentials and approval for writes.', 'CTO'],
  ['Model governance', 'Register each use, risk-tier it, validate and monitor it. Independent validation for anything that influences investment, risk or valuation.', 'CRO'],
  ['Records and supervision', 'Retain prompts, outputs and approvals where they form business records or communications; review under existing supervision.', 'CCO'],
  ['Code provenance and secrets', 'Licence and secret scanning on generated code; approved models only; no credentials in prompts.', 'CTO'],
]

export const decisions = [
  ['Who owns the ontology?', 'Recommend the CDO’s office with named domain stewards, governed through the data governance council. Without a single owner it fragments into team-by-team glossaries.'],
  ['Build the graph or buy a catalogue?', 'Start with the catalogue, semantic layer and security master already proposed, and add a graph store only where relationship queries justify it. Validate catalogue candidates such as DataHub, Atlan or Collibra against lineage and policy needs.'],
  ['How do AI agents reach platform data?', 'Through governed APIs and a standard tool interface (for example the Model Context Protocol) that enforces user entitlements, rather than direct database access. Validate the standard’s security model first.'],
  ['Where do models run?', 'Vendor APIs under enterprise terms for most uses; private hosting for the most sensitive data. Decide per data class, not firm-wide.'],
  ['Which team goes first?', 'Start where context already exists and risk is low: reference-data mapping, research discovery and engineering productivity.'],
]

// [phase, when, what, gate]
export const path = [
  ['1 · Foundations', 'First 3 months', 'Name the owner, define the core concepts and identifiers, publish the glossary and metric definitions, and set the AI usage policy and approved tools.', 'Policy approved; core concepts agreed by domain stewards'],
  ['2 · Assist', 'Months 3–6', 'Roll out engineering assistants and research discovery with entitlements enforced; measure delivery and quality.', 'No policy exceptions; measures baselined'],
  ['3 · Connect', 'Months 6–12', 'Link lineage, contracts and policy to the ontology; add entity-mapping and break-triage workflows with human review.', 'Review override rate and error rate within agreed bounds'],
  ['4 · Extend', 'After 12 months', 'Add reporting and investor drafting, richer agent workflows and graph queries where justified.', 'Independent validation complete for any model that influences risk or valuation'],
]
