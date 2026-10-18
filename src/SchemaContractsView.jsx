import { useState } from 'react'
import FlowDiagram from './FlowDiagram.jsx'
import {
  contractSources, contractFlow, contractLayers, contractFields, technologyChoices,
  controlPlaneRecords, enforcementStages, incidentCases, evolutionRules,
  versionMeanings, rollout, contractMetrics,
} from './schemaContracts.js'
import eventManifest from '../contracts/trading/execution-reported/1.0.0/contract.json?raw'
import eventProto from '../contracts/trading/execution-reported/1.0.0/execution_reported.proto?raw'
import eventFixtures from '../contracts/trading/execution-reported/1.0.0/events.protojson.json?raw'
import researchManifest from '../contracts/research/fundamentals-pit/1.0.0/contract.json?raw'
import researchModel from '../contracts/research/fundamentals-pit/1.0.0/model.yml?raw'
import researchFixtures from '../contracts/research/fundamentals-pit/1.0.0/vintages.json?raw'
import manifestSchema from '../contracts/contract.schema.json?raw'
import acceptanceCases from '../contracts/acceptance-cases.json'

function ContractTable({ headings, rows }) {
  return <div className="tbl-wrap"><table className="tbl operating-table"><thead><tr>{headings.map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(([name, ...cells]) => <tr key={name}><th>{name}</th>{cells.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>
}

const artefacts = {
  event: [['manifest', 'Contract manifest', eventManifest], ['native', 'Protobuf schema', eventProto], ['fixtures', 'Synthetic events', eventFixtures]],
  research: [['manifest', 'Contract manifest', researchManifest], ['native', 'dbt model contract', researchModel], ['fixtures', 'Synthetic vintages', researchFixtures]],
}

export default function SchemaContractsView({ part = 'design' }) {
  const [example, setExample] = useState('event')
  const [artefact, setArtefact] = useState('manifest')
  const selected = artefacts[example].find(([id]) => id === artefact)
  return <section className="schema-contracts">
    <p className="operating-proposal"><b>Reference implementation design.</b> The examples are draft artefacts with synthetic data. The manifest language and rule adapters are proposed internal tooling; they are not already deployed schema or validation services.</p>

    {part === 'design' && <>
      <p className="lede">Treat a contract as a versioned agreement about structure, financial meaning, service quality and access. Git holds the approved definition; a schema registry holds native event schemas; local adapters and data-product gates enforce the agreement.</p>
      <FlowDiagram flow={contractFlow} />
      <h3 className="sec-title">Four layers of the contract</h3>
      <ContractTable headings={['Layer', 'What it defines', 'Where enforced', 'Important boundary']} rows={contractLayers} />
      <h3 className="sec-title">Recommended technology composition</h3>
      <ContractTable headings={['Capability', 'Starting point', 'Alternative', 'Design choice / trade-off']} rows={technologyChoices} />
      <p className="small">See the <a href="#/data-blueprint/components/contracts">schema-registry component</a>, <a href="#/contracts/examples">concrete contract artefacts</a> and <a href="#/contracts/enforcement">runtime enforcement design</a>.</p>
    </>}

    {part === 'examples' && <>
      <h3 className="sec-title">One manifest, native schemas for each boundary</h3>
      <p className="muted"><code>blueprint.contract/1</code> is a proposed internal manifest format. The envelope below links metadata to native Protobuf or dbt definitions. The rule vocabulary must be implemented, parameter-validated and tested by the compiler; neither Confluent nor dbt executes these manifest rules automatically. Null SLOs and role-only owners intentionally leave these examples in draft.</p>
      <ContractTable headings={['Contract area', 'Required definition']} rows={contractFields} />
      <div className="seg contract-example-tabs" role="group" aria-label="Contract example"><button aria-pressed={example === 'event'} className={example === 'event' ? 'on' : ''} onClick={() => { setExample('event'); setArtefact('manifest') }}>Trading event</button><button aria-pressed={example === 'research'} className={example === 'research' ? 'on' : ''} onClick={() => { setExample('research'); setArtefact('manifest') }}>Research dataset</button></div>

      {example === 'event' ? <div className="contract-example-context">
        <h4>ExecutionReported · listed cash equities</h4>
        <p>Capture a reported fill before allocation. Keep fund/book allocation in a separate contract. Decimal strings preserve exact quantity/price; adapters validate presence, precision, sign, currency, instrument mapping and the revision chain. Protobuf field names are snake_case; the fixtures use standard ProtoJSON camelCase and string encoding for uint64.</p>
        <ol><li><b>Original:</b> revision 1 creates a BUY of 100 units.</li><li><b>Duplicate:</b> the same event ID/content leaves exposure at 100; conflicting content is an incident.</li><li><b>Correction:</b> revision 2 replaces the image with 80 units; exposure becomes 80.</li><li><b>Bust:</b> revision 3 references revision 2 and makes the execution inactive; exposure becomes zero.</li></ol>
        <p className="small">Deduplicate, verify predecessor/revision and update state plus an outbox in one local transaction. Retried downstream effects need their own idempotency key. Missing predecessors hold the affected key and expose incompleteness; arrival order is not evidence of the correct business chain.</p>
      </div> : <div className="contract-example-context">
        <h4>Fundamentals PIT · retained knowledge history</h4>
        <p>Stage each candidate delivery, validate structure/quality/population, append immutable vintages and publish only accepted deliveries through a ledger-controlled view. Keep prior accepted vintages visible for historical selection. Assign accepted availability during publication; never trust a supplied timestamp without source and delivery evidence.</p>
        <ol><li><b>16 Oct, 09:04 decision:</b> the first vintage is excluded because it became available at 09:06.</li><li><b>16 Oct, 10:00 decision:</b> the available revenue is 1,000,000 USD.</li><li><b>17 Oct, 09:07 decision:</b> the correction permits 1,050,000 USD.</li><li><b>Replay the 16 Oct decision:</b> it still uses 1,000,000 USD; the later correction cannot enter that earlier view.</li></ol>
        <p className="small">The illustrative dbt table contract checks all column types. Add composite uniqueness, chronology, mapping and population tests. Set and validate <code>available_at</code> at the accepted publication boundary; the staging model alone does not authorise consumer access. Snowflake standard-table primary/foreign/unique declarations do not replace these checks.</p>
      </div>}

      <div className="seg" role="group" aria-label="Example artefact">{artefacts[example].map(([id, label]) => <button key={id} aria-pressed={artefact === id} className={artefact === id ? 'on' : ''} onClick={() => setArtefact(id)}>{label}</button>)}</div>
      <figure className="contract-code"><figcaption>{selected[1]} · draft reference</figcaption><pre tabIndex={0} aria-label={selected[1]}><code>{selected[2]}</code></pre></figure>
      <details className="blueprint-sources"><summary>Manifest envelope JSON Schema</summary><p className="small">This validates the envelope only. Bindings, rule parameters and service/security references require additional compiler checks; schema-valid draft metadata is not activation approval.</p><figure className="contract-code"><pre tabIndex={0} aria-label="Manifest envelope JSON Schema"><code>{manifestSchema}</code></pre></figure></details>
    </>}

    {part === 'enforcement' && <>
      <h3 className="sec-title">Validation at each publication boundary</h3>
      <p className="muted">The same contract produces different checks at build, capture, canonical state, analytical publication and consumption. Rule severity and hold scope are approved by the relevant business/control owner. A pipeline cannot waive data rights or hard trading controls.</p>
      <ContractTable headings={['Boundary', 'Implementation', 'Failure behavior']} rows={enforcementStages} />
      <h3 className="sec-title">Correctness and incident handling</h3>
      <ContractTable headings={['Condition', 'Required behavior', 'Recovery / consequence']} rows={incidentCases} />
      <aside className="flow-callout"><b>Durability before acknowledgement.</b> Keep the raw record and hold/DLQ evidence durable before advancing a source checkpoint. Couple consumed offsets to state/output using the chosen transactional pattern. A Kafka processing guarantee does not make a database write, payment or position update automatically exactly once.</aside>
      <h3 className="sec-title">State transition for a delivery or key</h3>
      <p className="contract-state-flow">Received → Raw retained → Validating → Accepted / Held / Quarantined → Reconciled or replayed</p>
      <p className="small"><b>Accountable outcome:</b> the domain owner accepts meaning and materiality. The delivery owner runs the validator and restores the pipeline. Compliance/Security deploy access policy. The consumer owner accepts supported versions and safe behavior when inputs are incomplete.</p>
      <h3 className="sec-title">Minimum acceptance test pack</h3>
      <ContractTable headings={['Case / boundary', 'Scenario', 'Expected result']} rows={acceptanceCases.map((x, i) => [`${i + 1} · ${x.boundary}`, x.case, x.expected])} />
      <p className="small">Related: <a href="#/operating/resilience">failure playbooks</a>, <a href="#/lifecycle/metrics">business-wide success measures</a>, <a href="#/data/pit">point-in-time and corrections</a>.</p>
    </>}

    {part === 'evolution' && <>
      <h3 className="sec-title">Version meaning and safe evolution</h3>
      <ContractTable headings={['Version', 'Example', 'Meaning']} rows={versionMeanings} />
      <aside className="flow-callout"><b>Event compatibility recommendation.</b> Explicitly configure BACKWARD_TRANSITIVE for the Protobuf subject: the new reader schema must read all retained writer versions. This does not promise old readers can understand new writers. Upgrade and verify readers before writers. Consider FULL_TRANSITIVE only where both directions are required and supported by the actual schemas and consumer behavior; registry defaults must not determine policy.</aside>
      <ContractTable headings={['Change', 'Classification', 'Rollout rule']} rows={evolutionRules} />
      <h3 className="sec-title">Major-version migration</h3>
      <ol className="operating-steps">{[
        ['Propose v2', 'Publish a new manifest and physical binding with mapping rationale, owner approvals, consumer list and migration acceptance criteria. Keep v1 schemas and decoders.'],
        ['Shadow / compare', 'Replay representative history and compare quantities, values, states, time semantics and access. Shadow outputs cannot affect live positions twice.'],
        ['Migrate consumers', 'Pin each consumer to one authoritative version per key/scope. Use a defined cutover checkpoint and durable deduplication; preserve correlation across v1/v2.'],
        ['Move writers / retire', 'Switch producers under controlled rollout, watch business completeness, acknowledge migrated consumers and retire only when replay/records obligations permit.'],
      ].map(([name, text], i) => <li key={name}><span>{i + 1}</span><div><h4>{name}</h4><p>{text}</p></div></li>)}</ol>
      <p className="small"><b>Rollback:</b> restore a previously approved compatible producer/binding only after checking reader and state compatibility. Never delete schema history or rewind published business state as a shortcut. Correct already-published data with explicit revisions and reconcile affected consumers.</p>
    </>}

    {part === 'rollout' && <>
      <h3 className="sec-title">Control-plane records and interfaces</h3>
      <p className="muted">Start with an existing Git/CI platform, registry, warehouse and service catalogue. A small metadata service can index release and deployment evidence; it is outside the message validation hot path.</p>
      <ContractTable headings={['Record', 'Key content', 'Design rule']} rows={controlPlaneRecords} />
      <div className="operating-cards">{[
        ['Read contracts', 'Proposed GET /contracts/{id}/versions/{version} returns immutable content/digest and lifecycle evidence. Producers read/cache only authorised releases.'],
        ['CI compatibility', 'Proposed POST /compatibility-checks runs native and domain checks in CI. Only a promotion identity may register approved schemas or change deployment bindings.'],
        ['Bindings / consumers / evidence', 'Proposed environment bindings, consumer acknowledgements, validation-run and exception records are separately authorised and audited. These are target platform interfaces, not APIs implemented on this website.'],
      ].map(([name, text]) => <article key={name}><h4>{name}</h4><p>{text}</p></article>)}</div>
      <h3 className="sec-title">Phased implementation</h3>
      <ol className="operating-steps">{rollout.map(([name, owner, work, gate], i) => <li key={name}><span>{i + 1}</span><div><h4>{name}</h4><p className="small"><b>Owner:</b> {owner}</p><p>{work}</p><p className="operating-gate"><b>Acceptance:</b> {gate}</p></div></li>)}</ol>
      <h3 className="sec-title">Measures of success</h3>
      <ContractTable headings={['Measure', 'Definition', 'Accountable role']} rows={contractMetrics} />
      <p className="small">Local starter artefacts are kept in <code>contracts/</code> in the project source. They require implementation of the compiler/rule adapters, native compilation/compatibility checks, actual warehouse builds, source integration and consumer acceptance before activation.</p>
    </>}

    <details className="blueprint-sources"><summary>Primary implementation references · checked 18 Oct 2026</summary><ul>{contractSources.map(([name, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{name} ↗</a></li>)}</ul></details>
  </section>
}
