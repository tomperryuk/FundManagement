import { useEffect, useState } from 'react'
import { nodeById, domains } from './systemData.js'
import {
  strategyGroups, profile, pillars, groupNeeds, reviewChanges, openQuestions,
  phases, lifecycle, dayTimeline, assetVariations, principleGroups, principles, riskPlatform,
} from './operatingModel.js'

function NodeChip({ id }) {
  const n = nodeById[id]
  return (
    <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>
      {n.label}
    </a>
  )
}

const Chips = ({ ids }) => <div className="chip-row">{ids.map((id) => <NodeChip key={id} id={id} />)}</div>

// ───────────────────────── Business fit ─────────────────────────

const STATUS = { aligned: 'Already aligned', changed: 'Changed in this review', open: 'Open question' }

export function BusinessFit({ part } = {}) {
  const show = (k) => !part || part === k
  return (
    <section className="fit">
      {!part && (<>
<p className="eyebrow">Business alignment review</p>
      <h2>Fit to Verition’s operating model</h2>
      <p className="lede">
        Verition’s public materials describe a collaborative multi-manager platform with dynamic capital allocation and
        internal and external risk controls. This blueprint maps that context to proposed systems, interfaces and workflows.
        Public facts are sourced; the current application estate and internal implementation still require confirmation.
      </p>
      </>)}

      {show('assumptions') && (<>
<div className="fit-profile">
        <dl className="facts">
          {profile.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <div className="fit-side">
          <h4>Published office locations</h4>
          <p>{profile.offices.join(' · ')}</p>
          <h4>Business context</h4>
          <ul className="news">{profile.news.map(([date, text]) => <li key={date}><span>{date}</span>{text}</li>)}</ul>
          <h4>Sources</h4>
          <ul className="news">{profile.sources.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{label} ↗</a></li>)}</ul>
          <p className="source">Profile checked 17 Oct 2026. Capital and staff figures retain their published dates. The Northern Trust portal link does not establish administrator or transfer-agent scope.</p>
        </div>
      </div>

      <h3 className="sec-title">Operating principles and what they demand</h3>
      <p className="muted small">Principle statements summarise Verition’s public materials in our own words. Design responses are proposed architecture choices.</p>
      <div className="pillars">
        {pillars.map(([name, quote, demand, response, ids, status]) => (
          <article key={name} className={'pillar s-' + status}>
            <header>
              <h3>{name}</h3>
              <span className={'status s-' + status}>{STATUS[status]}</span>
            </header>
            <blockquote>{quote.replace(/^“|”$/g, '')}</blockquote>
            <div className="pillar-body">
              <div><h4>What it demands</h4><p>{demand}</p></div>
              <div><h4>How the design responds</h4><p>{response}</p></div>
            </div>
            <Chips ids={ids} />
          </article>
        ))}
      </div>
      </>)}

      {show('risk') && <RiskPlatformSection />}

      {show('groups') && (<>
<h3 className="sec-title">What each strategy group needs</h3>
      <p className="muted small">Strategy group names follow Verition’s published categories. The strategies, instruments and workflows below illustrate requirements to validate with each group.</p>
      <div className="groups">
        {groupNeeds.map(([key, strategies, instruments, needs, ids]) => (
          <article key={key} className="group-card">
            <h3>{strategyGroups[key]}</h3>
            <p className="g-line"><span>Typical strategies</span>{strategies}</p>
            <p className="g-line"><span>Instruments</span>{instruments}</p>
            <h4>Platform needs</h4>
            <ul>{needs.map((x) => <li key={x}>{x}</li>)}</ul>
            <Chips ids={ids} />
          </article>
        ))}
      </div>
      </>)}

      {show('review') && (<>
<div className="fit-bottom">
        <section>
          <h3 className="sec-title">Design responses in this reference architecture</h3>
          <ol className="changes">{reviewChanges.map((x) => <li key={x}>{x}</li>)}</ol>
        </section>
        <section>
          <h3 className="sec-title">Open questions to confirm</h3>
          <dl className="questions">
            {openQuestions.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>
      </div>
      </>)}
    </section>
  )
}

// ───────────────────────── Trade lifecycle ─────────────────────────

export function Lifecycle({ part } = {}) {
  const show = (k) => !part || part === k
  const [i, setI] = useState(0)
  const [group, setGroup] = useState('equity')
  const s = lifecycle[i]

  return (
    <section className="lc">
      {!part && (<>
<p className="eyebrow">Trade lifecycle</p>
      <h2>From idea to investor report</h2>
      <p className="lede">
        Twelve stages across four phases, with the systems, messages, controls, exceptions and service levels at each
        one, and how the stage differs for each strategy group. Times and service levels are targets for discussion,
        not verified requirements; calibrate them from strategy latency, venue cut-offs, control obligations and current systems.
      </p>
      </>)}

      {show('stages') && (<>
<div className="lc-phases">
        {phases.map((p) => (
          <div key={p} className="lc-phase">
            <h4>{p}</h4>
            <ol>
              {lifecycle.map((x, idx) => x.phase === p && (
                <li key={x.step}>
                  <button className={idx === i ? 'on' : idx < i ? 'done' : ''} onClick={() => setI(idx)}>
                    <span className="n">{idx + 1}</span>{x.step}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <article className="lc-detail">
        <header className="lc-head">
          <div>
            <p className="eyebrow">{s.phase} · stage {i + 1} of {lifecycle.length}</p>
            <h3>{s.step}</h3>
            <p>{s.detail}</p>
          </div>
          <dl className="lc-meta">
            <div><dt>Owner</dt><dd>{s.owner}</dd></div>
            <div><dt>When</dt><dd>{s.when}</dd></div>
          </dl>
        </header>

        <div className="lc-systems"><h4>Systems involved</h4><Chips ids={s.systems} /></div>

        <div className="lc-grid">
          <div><h4>Inputs</h4><ul>{s.inputs.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div><h4>Outputs</h4><ul>{s.outputs.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div><h4>Key messages</h4><ul className="mono">{s.messages.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div><h4>Controls</h4><ul className="checks">{s.controls.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="wide">
            <h4>What can go wrong</h4>
            <div className="risks">
              {s.exceptions.map(([r, m]) => <div key={r} className="risk"><p className="r">{r}</p><p className="m">{m}</p></div>)}
            </div>
          </div>
          <div>
            <h4>Service levels</h4>
            <table className="tbl sla"><tbody>{s.kpis.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
          </div>
        </div>

        <div className="lc-vars">
          <h4>By strategy group</h4>
          <div className="seg" role="tablist">
            {Object.entries(strategyGroups).map(([k, v]) => (
              <button key={k} role="tab" aria-selected={group === k} className={group === k ? 'on' : ''} onClick={() => setGroup(k)}>{v}</button>
            ))}
          </div>
          <p className="var-text">{s.variations[group]}</p>
        </div>

        <div className="row">
          <button disabled={i === 0} onClick={() => setI(i - 1)}>← {i > 0 ? lifecycle[i - 1].step : 'Back'}</button>
          <button disabled={i === lifecycle.length - 1} onClick={() => setI(i + 1)}>{i < lifecycle.length - 1 ? lifecycle[i + 1].step : 'Next'} →</button>
        </div>
      </article>
      </>)}

      {show('day') && (<>
<div className="lc-lower">
        <section>
          <h3 className="sec-title">A day on the platform</h3>
          <p className="muted small">Times in US Eastern (daylight time); they shift by an hour around clock changes.</p>
          <ol className="timeline-day">
            {dayTimeline.map(([t, region, text, ids]) => (
              <li key={t + text}>
                <span className="t">{t}</span>
                <span className={'region r-' + region.toLowerCase()}>{region}</span>
                <div><p>{text}</p><Chips ids={ids} /></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      </>)}

      {show('instruments') && (<>
<section>
        <h3 className="sec-title">How the lifecycle differs by instrument</h3>
        <div className="tbl-wrap">
          <table className="tbl assets">
            <thead><tr><th>Instrument</th><th>Execution</th><th>Confirmation</th><th>Settlement / clearing</th><th>Financing & booking</th><th>Watch out for</th></tr></thead>
            <tbody>{assetVariations.map((r) => <tr key={r[0]}>{r.map((c, j) => (j === 0 ? <th key={j}>{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
          </table>
        </div>
      </section>
      </>)}
    </section>
  )
}

// ───────────────────────── Design principles ─────────────────────────

export function Principles({ part } = {}) {
  return (
    <section className="pr">
      {!part && (<>
<p className="eyebrow">Design principles</p>
      <h2>How the platform is designed</h2>
      <p className="lede">
        Seventeen principles. The first five come straight from the business model; the rest are the architecture,
        control and operating rules that make them hold. Each has its reasoning, what it means in practice, where it
        applies, what to avoid and how to tell whether it is working.
      </p>
      <nav className="jump">
        {principleGroups.map(([id, name]) => (
          <button key={id} onClick={() => document.getElementById('pg-' + id)?.scrollIntoView({ behavior: 'smooth' })}>{name}</button>
        ))}
      </nav>
      </>)}
      {principleGroups.filter(([id]) => !part || part === id).map(([id, name, desc]) => (
        <section key={id} id={'pg-' + id} className="pr-group">
          <header>
            <h3 className="sec-title">{name}</h3>
            <p className="muted">{desc}</p>
          </header>
          <div className="pr-grid">
            {principles.filter((p) => p.group === id).map((p) => (
              <article key={p.title} className="principle">
                <p className="eyebrow">{p.source}</p>
                <h3>{p.title}</h3>
                <p className="statement">{p.statement}</p>
                <p className="why"><span>Why</span>{p.why}</p>
                <h4>In practice</h4>
                <ul>{p.implications.map((x) => <li key={x}>{x}</li>)}</ul>
                <div className="pr-foot">
                  <p><span>Avoid</span>{p.avoid}</p>
                  <p><span>Measure</span>{p.measure}</p>
                </div>
                <Chips ids={p.where} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </section>
  )
}

// ───────────────────────── Risk platform integration ─────────────────────────

export function RiskPlatformSection() {
  useEffect(() => {
    if (window.location.hash === '#risk-platform') document.getElementById('risk-platform')?.scrollIntoView({ block: 'start' })
  }, [])
  return (
    <section className="risk-platform" id="risk-platform">
      <header className="risk-platform-head">
        <div>
          <p className="eyebrow">Photon · reported licence · proposed integration</p>
          <h3>Where Photon fits</h3>
          <p className="lede">{riskPlatform.thesis}</p>
        </div>
        <a className="primary-link" href="#/node/risk">Open the Risk Engine design →</a>
      </header>

      <div className="risk-platform-grid">
        <dl className="risk-platform-facts">
          {riskPlatform.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <div>
          <h4>Candidate role on the reference architecture</h4>
          <table className="tbl risk-platform-fit">
            <thead><tr><th>Component</th><th>Candidate role to validate</th><th>Proposed ownership boundary</th></tr></thead>
            <tbody>
              {riskPlatform.fit.map(([id, role, outside]) => (
                <tr key={id} className={riskPlatform.primary.includes(id) ? 'primary' : ''}>
                  <td><NodeChip id={id} /></td><td>{role}</td><td className="muted">{outside}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="risk-platform-cols">
        <div>
          <h4>Integration</h4>
          <table className="tbl"><tbody>
            {riskPlatform.interfaces.map(([dir, id, what]) => (
              <tr key={dir + id}><td><span className={'dir d-' + dir.toLowerCase()}>{dir}</span></td><td><NodeChip id={id} /></td><td>{what}</td></tr>
            ))}
          </tbody></table>
        </div>
        <div>
          <h4>Potential benefits to test</h4>
          <ul className="checks">{riskPlatform.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
          <h4 className="gap">Questions for the Photon team and control owners</h4>
          <ol className="changes">{riskPlatform.questions.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
      </div>

      <h4>Risks and how to handle them</h4>
      <div className="risks">
        {riskPlatform.risks.map(([r, m]) => <div key={r} className="risk"><p className="r">{r}</p><p className="m">{m}</p></div>)}
      </div>

      <p className="source">
        Sources: {riskPlatform.sources.map(([label, url], i) => <span key={url}>{i > 0 && ' · '}<a href={url} target="_blank" rel="noreferrer">{label}</a></span>)}.
        The licence is reported; the integration footprint, data feeds and control responsibilities above are proposals to validate.
      </p>
    </section>
  )
}
