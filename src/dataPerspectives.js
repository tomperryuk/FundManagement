// How the ontology / context layer relates to Data Vault and other design perspectives.
// Tool names and patterns are candidates to validate against the data team's skills and workloads.

export const intro = 'The ontology says what the business concepts are. A physical model has to store them with history, from many sources, for many uses. Data Vault is a good fit for part of that, not all of it. This page maps the ontology to Data Vault construct by construct, shows which datasets should use it, and compares other design perspectives so the choice is deliberate.'

// [ontology / flow concept, Data Vault construct, example, note]
export const mapping = [
  ['Concept (instrument, issuer, counterparty, fund, team, account, agreement)', 'Hub', 'hub_instrument, hub_entity, hub_account', 'Holds the business key and nothing else. Identity never changes.'],
  ['Identifier', 'Link to an identifier satellite', 'link_identifier (FIGI, ISIN, CUSIP, LEI)', 'Identifiers change and collide, so they carry their own history.'],
  ['Relationship (parent company, issuer to instrument, team to book)', 'Link with an effectivity satellite', 'link_entity_parent, link_instrument_underlying', 'Links handle many-to-many and changing relationships.'],
  ['Attribute', 'Satellite, split by source, rate of change and sensitivity', 'sat_instrument_terms, sat_entity', 'A separate satellite per sensitivity class lets MNPI or licensed fields carry their own policy.'],
  ['Availability time', 'Load timestamp', 'recorded_at', 'The vault is insert-only, so “as known at a cutoff” is a filter on this field.'],
  ['Effective time', 'Applied or effective date', 'valid_from, valid_to', 'The second time dimension in the bitemporal model.'],
  ['Correction', 'A new satellite row', 'Revision metadata on the row', 'Nothing is overwritten, so earlier decisions stay reproducible.'],
  ['Entity-resolution result', 'Same-as link in the business vault', 'link_same_as_entity', 'Resolution is a business rule, so the raw vault keeps what each source said.'],
  ['Corporate-action lineage', 'Link between hubs', 'link_lineage', 'Follows a position through mergers, spin-offs and renames.'],
]

// [layer, what it holds, where the ontology shows up, existing blueprint layer]
export const layers = [
  ['Operational and event layer', 'Events and operational stores: orders, fills, positions, payments.', 'Event contracts and domain definitions', 'Real-time and operational paths'],
  ['Raw vault', 'Every source’s data, historised and untouched, in hubs, links and satellites.', 'Hub, link and satellite definitions come from the ontology', 'Silver · conformed'],
  ['Business vault', 'Derived and agreed rules: entity resolution, official price, mappings.', 'Rules reference ontology concepts; results are versioned', 'Silver · conformed'],
  ['Information marts', 'Shaped for use: star schemas, point-in-time features, regulatory marts.', 'Conformed dimensions are ontology concepts', 'Gold · curated'],
  ['Semantic layer', 'One definition of each metric, served to tools and agents.', 'Metrics are defined against ontology concepts', 'Serving'],
]

export const namingNote = ['Two meanings of “PIT”', 'In Data Vault, a PIT table is a join-performance structure that snapshots which satellite row applied at a date. In this blueprint, point-in-time data is a research property: only what was available at a decision date. A vault PIT table can help serve point-in-time data, but they are not the same thing.']

// [data area, recommended pattern, why, components]
export const fit = [
  ['Security master and identifiers', 'Data Vault, bitemporal', 'Many sources, changing keys and corporate actions.', ['secmaster']],
  ['Legal entities, counterparties and hierarchies', 'Data Vault with effectivity links', 'Ownership and parent relationships change over time.', ['secmaster', 'compliance']],
  ['Accounts, agreements and settlement instructions', 'Data Vault with approval metadata', 'Several sources and a need to prove what was in force.', ['settlement', 'collateral']],
  ['Vendor-ID mapping and alternative-data entity mapping', 'Same-as links in the business vault', 'Mappings are judgements that change and must be explained.', ['secmaster', 'alt']],
  ['Fundamentals and estimates', 'Bitemporal long fact keyed on knowledge time', 'One source family, high volume, queried by time.', ['lake']],
  ['Prices and ticks', 'Time-series stores, not a vault', 'Very high volume and queried by time range.', ['mdhub', 'lake']],
  ['Orders, fills and trades', 'Event log; non-historised links if the vault needs them', 'They are events, not changing master data.', ['bus', 'ibor']],
  ['Positions, cash and lots', 'Event fold in the IBOR; bitemporal snapshots', 'Derived from events; consumers want snapshots.', ['ibor']],
  ['Fund accounting and NAV', 'Kimball star schema', 'Reporting-shaped, fixed definitions.', ['accounting']],
  ['Risk exposures', 'Snapshot facts and semantic layer', 'Consumed as measures across dimensions.', ['risk']],
  ['Regulatory filings', 'Marts frozen at submission', 'Must match what was filed.', ['reporting']],
  ['Team features and research datasets', 'Point-in-time feature tables in the team workspace', 'Private, versioned and built for reproducible research.', ['research']],
]

// [lens, how it applies here, what it adds, caution]
export const lenses = [
  ['Domain-driven design', 'The ontology is the shared kernel. Each component or team is a bounded context, and vendor ingestion is the anti-corruption layer.', 'Explains why team-private concepts stay in the workspace and only shared concepts enter the ontology.', 'A context map is needed, or teams quietly redefine shared terms.'],
  ['Data mesh and data products', 'Domain owners publish contracted data products. The CDO’s office runs federated governance with named stewards.', 'Ownership matches the Organisation page and keeps contracts explicit.', 'The platform stays central; adopt the governance ideas, not a decentralised architecture.'],
  ['Knowledge graph', 'A projection of vault links, answering relationship questions such as ownership chains and supply-chain exposure.', 'Traversals that are awkward in SQL; a natural source for AI agent context.', 'Not a second source of truth. Recursive SQL covers corporate hierarchies; add a graph store only for deeper traversals.'],
  ['Event sourcing and bitemporality', 'Positions and trades derive from the event log; the ontology defines the event contracts.', 'Replay and audit come from the design.', 'Needs disciplined schema evolution through the registry.'],
  ['Dimensional (Kimball) and semantic layer', 'Conformed dimensions are ontology concepts; the semantic layer holds metric definitions.', 'Simple, fast consumption for finance, risk and BI.', 'Marts are built for questions known today; keep the vault or events as the base.'],
  ['Lakehouse medallion', 'Raw vault and business vault sit in silver; marts sit in gold.', 'A familiar layout for the data platform team.', 'Do not copy every dataset through every layer.'],
]

// [step, what happens]
export const generate = [
  ['1 · Author', 'Concepts, relationships, attributes, sensitivity classes and metric definitions are kept as versioned files in git, owned by the data governance council.'],
  ['2 · Generate', 'Hub, link and satellite models, tests and documentation are generated from the files. Candidates to evaluate include AutomateDV and datavault4dbt for dbt.'],
  ['3 · Publish', 'Catalogue entries, semantic-layer metrics, lineage and agent context come from the same source.'],
  ['4 · Check', 'CI compares the ontology with the physical models and fails on drift, such as an undefined column or an unmapped concept.'],
  ['5 · Review', 'Changes go through the architecture review board and data owners, like code, with a release note for consumers.'],
]

// [risk, mitigation]
export const risks = [
  ['Over-modelling', 'Use the vault only for the datasets above. Keep events, prices and simple facts in simpler patterns.'],
  ['Join cost and complexity', 'Add PIT and bridge tables where queries need them, and serve consumers from marts, not the raw vault.'],
  ['Skills', 'Data Vault is specialist. Start with the security master, where the pattern is already proposed, and measure effort.'],
  ['Ontology drift from production', 'Generate from the ontology and fail builds on mismatch.'],
  ['Ontology becomes a committee', 'Keep it small: shared concepts only, named stewards, quick review cycles.'],
  ['Naming collisions', 'Document the two meanings of PIT and keep a glossary entry for each.'],
]

// Data Vault and data mesh side by side. They answer different questions, so this is a comparison of trade-offs and a guide to choosing, not a contest.
export const compareIntro = 'Data Vault is a way to model and store data. Data mesh is a way to organise who owns and publishes it. They sit at different layers, so a firm can use both, neither or one. The table compares them on the points that decide the choice.'

export const compare = [
  ['What it answers', 'How do we store many sources, with full history, so keys can change and models can be rebuilt?', 'Who owns each dataset, who publishes it, and how do consumers trust it?'],
  ['Layer', 'Physical and logical model inside the platform (hubs, links, satellites).', 'Operating model and governance across teams (domain ownership, data products, contracts).'],
  ['Main strength', 'Auditable history; adding a source or attribute does not break existing tables; loads are parallel and repeatable; models can be generated from the ontology.', 'Owners close to the meaning of the data; explicit contracts and quality promises; less central bottleneck; clear accountability.'],
  ['Main cost', 'Many narrow tables and joins; consumers cannot query it directly, so marts or views are needed on top; skills are specialised; slower for simple datasets.', 'Needs capable engineering in every domain; risks duplicated tooling and inconsistent standards; shared entities (instruments, counterparties) are hard to own by one domain.'],
  ['Cost of getting it wrong', 'A vault built for everything adds layers and delay with little gain, especially for prices, ticks and events that are already append-only.', 'Ownership without platform standards becomes a set of silos; contracts without enforcement are documentation only.'],
  ['Fit with control needs', 'Strong: load time and source are kept, so “what did we know, when, from where” is answerable. Supports bitemporal views.', 'Strong if governance is federated: entitlements, MNPI walls and retention are set centrally and applied in each product. Weak if left to each team.'],
  ['Team and skill demand', 'A small central data engineering team with Data Vault experience, helped by generation tooling.', 'A data product owner and engineer in each domain, plus a central platform team and stewards.'],
  ['Time to first value', 'Slower start: ontology, keys and load patterns first. Pays back as sources grow.', 'Fast for a single domain with a ready team; slows as cross-domain products multiply.'],
  ['Works against', 'Simple, single-source, current-state data; ad hoc analysis directly on the vault.', 'Small or central teams; entities shared by every domain; firms without the engineering to staff each domain.'],
]

export const chooseVault = [
  'Several vendors or systems describe the same entity and their identifiers change (security master, entities, counterparties, accounts).',
  'You must show what each source said at a past time, for audit or to rebuild a model after a rule change.',
  'New sources arrive often and existing models must not break.',
  'The ontology is versioned and you want to generate hubs, links and satellites from it.',
]

export const chooseMesh = [
  'Domains have real data engineering capacity and want to own their datasets end to end.',
  'The central team is the bottleneck and consumers wait for changes in data they do not own.',
  'Datasets have clear owners and consumers in different teams who need a contract, quality promise and support route.',
  'Governance can be federated: central standards for entitlements, retention and quality, applied by each domain.',
]

export const compareVerdict = [
  ['Data Vault', 'Use for multi-source masters only: security master, entities, counterparties, accounts, vendor-ID and alt-data mappings. Do not use it for prices, ticks, events or accounting records.'],
  ['Data mesh', 'Adopt the ownership and contract ideas: named data owners, versioned data products, quality promises and federated governance. Do not decentralise the platform itself.'],
  ['Why not full mesh', 'The firm has a small number of shared entities used by every strategy, central controls that must not vary by team (MNPI walls, point-in-time rules, entitlements), and strategy teams that are better used on research than on platform engineering.'],
  ['Why not all-vault', 'Most data is append-only or current-state and gains little from the vault pattern. The vault adds layers that slow consumers if applied everywhere.'],
  ['How they combine', 'Owners publish data products with contracts (mesh). Behind a master data product, the multi-source history sits in a vault (Data Vault). Consumers see the product and its contract, not the hubs and satellites.'],
]

export const compareRevisit = 'Revisit if the number of domain teams with their own data engineers grows, if a central team becomes the delivery bottleneck, or if the vault grows beyond the masters it was meant for.'
