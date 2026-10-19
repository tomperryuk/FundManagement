import { nodeById, domains } from './systemData.js'
import FlowDiagram from './FlowDiagram.jsx'
import {
  definition, notSignal, anatomy, discretionVsSystematic, types, horizons, horizonTicks,
  stages, metrics, failures, platformMap, signalFlow,
} from './signals.js'

function NodeChip({ id }) {
  const n = nodeById[id]
  return <a className="node-chip" href={`#/node/${id}`} style={{ '--c': domains[n.domain].color }}>{n.label}</a>
}

function Figure({ title, caption, children }) {
  return <figure className="sig-fig">
    <figcaption><h3 className="sec-title">{title}</h3>{caption && <p className="muted small">{caption}</p>}</figcaption>
    {children}
  </figure>
}

const Arrow = () => <defs><marker id="sig-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="sig-head" /></marker></defs>

// A score over time, the thresholds that act on it and the position that results.
function ScoreToPosition() {
  const W = 640, N = 80, L = 56, R = 16
  const x = i => L + (i / (N - 1)) * (W - L - R)
  const score = Array.from({ length: N }, (_, i) => 0.9 * Math.sin(i / 6) + 0.35 * Math.sin(i / 2.3 + 1) - 0.12)
  const yS = v => 78 - v * 46
  const pos = score.map(v => (v > 0.5 ? 1 : v < -0.5 ? -1 : 0))
  const yP = v => 205 - v * 24
  const line = score.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${yS(v).toFixed(1)}`).join('')
  const step = pos.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${yP(v)}${i < N - 1 ? `L${x(i + 1).toFixed(1)} ${yP(v)}` : ''}`).join('')
  return <svg className="sig-svg" viewBox={`0 0 ${W} 250`} role="img" aria-label="A signal score over time with entry thresholds, and the long, flat or short position that follows">
    <Arrow />
    <text x={L} y="14" className="sig-h">Signal score for one instrument</text>
    <line x1={L} x2={W - R} y1={yS(0)} y2={yS(0)} className="sig-axis" />
    <line x1={L} x2={W - R} y1={yS(0.5)} y2={yS(0.5)} className="sig-thr" />
    <line x1={L} x2={W - R} y1={yS(-0.5)} y2={yS(-0.5)} className="sig-thr" />
    <text x={L - 6} y={yS(0.5) + 4} className="sig-lab" textAnchor="end">+ entry</text>
    <text x={L - 6} y={yS(0) + 4} className="sig-lab" textAnchor="end">0</text>
    <text x={L - 6} y={yS(-0.5) + 4} className="sig-lab" textAnchor="end">− entry</text>
    <path d={line} className="sig-line" fill="none" />
    <text x={L} y="150" className="sig-h">Target position the sizing step may choose</text>
    <line x1={L} x2={W - R} y1={yP(0)} y2={yP(0)} className="sig-axis" />
    <text x={L - 6} y={yP(1) + 4} className="sig-lab" textAnchor="end">long</text>
    <text x={L - 6} y={yP(0) + 4} className="sig-lab" textAnchor="end">flat</text>
    <text x={L - 6} y={yP(-1) + 4} className="sig-lab" textAnchor="end">short</text>
    <path d={step} className="sig-step" fill="none" />
    <text x={W / 2} y="244" className="sig-lab" textAnchor="middle">time →  (in practice, size scales with confidence, risk, costs and limits, not just a threshold)</text>
  </svg>
}

// Event time, availability time and decision time, and where a leaky backtest goes wrong.
function KnowledgeTimeline() {
  const W = 640, L = 40, R = 24
  const t = d => L + (d / 4.4) * (W - L - R)
  const marks = [
    [0, 'Event happens', 'Company earns more than expected', 'event'],
    [1.2, 'Filing published', 'Numbers become public', 'public'],
    [3, 'Vendor delivers', 'Data reaches the platform', 'public'],
    [3.4, 'Signal produced', 'Score computed from new data', 'sig'],
    [3.9, 'Order can be sent', 'First realistic trade', 'trade'],
  ]
  return <svg className="sig-svg" viewBox={`0 0 ${W} 250`} role="img" aria-label="Timeline of an event, its publication, vendor delivery, signal and first realistic trade, against the trade a leaky backtest assumes at the event time">
    <Arrow />
    <line x1={L} x2={W - R} y1="110" y2="110" className="sig-axis" markerEnd="url(#sig-arrow)" />
    <text x={W - R} y="130" className="sig-lab" textAnchor="end">time →</text>
    {marks.map(([d, name, sub, kind], i) => <g key={name}>
      <circle cx={t(d)} cy="110" r="6" className={'sig-dot ' + kind} />
      <line x1={t(d)} x2={t(d)} y1="110" y2={i % 2 ? 150 : 70} className="sig-axis" />
      <text x={t(d)} y={i % 2 ? 166 : 58} className="sig-h" textAnchor="middle">{name}</text>
      <text x={t(d)} y={i % 2 ? 182 : 44} className="sig-lab" textAnchor="middle">{sub}</text>
    </g>)}
    <path d={`M${t(0)} 215 L${t(3.9)} 215`} className="sig-gap" markerEnd="url(#sig-arrow)" />
    <text x={(t(0) + t(3.9)) / 2} y="208" className="sig-lab" textAnchor="middle">Information was not available in this window</text>
    <text x={t(0)} y="236" className="sig-bad" textAnchor="start">✗ Leaky backtest trades here, at event time</text>
    <text x={t(3.9)} y="236" className="sig-good" textAnchor="end">✓ Point-in-time test trades here</text>
  </svg>
}

// The path from idea to production, with the exits.
function LifecycleStates() {
  const W = 640
  const row1 = ['Idea', 'Hypothesis', 'Backtest', 'Validation']
  const row2 = ['Paper', 'Shadow', 'Limited live', 'Scaled']
  const bw = 118, bh = 40, gap = 36, x0 = 12
  const bx = c => x0 + c * (bw + gap)
  const box = (label, c, y, cls = '') => <g key={label + y}><rect x={bx(c)} y={y} width={bw} height={bh} rx="3" className={'sig-box ' + cls} /><text x={bx(c) + bw / 2} y={y + bh / 2 + 4} textAnchor="middle" className="sig-h">{label}</text></g>
  const arrowH = (c, y) => <line key={'a' + c + y} x1={bx(c) + bw} x2={bx(c + 1)} y1={y + bh / 2} y2={y + bh / 2} className="sig-flow" markerEnd="url(#sig-arrow)" />
  return <svg className="sig-svg" viewBox={`0 0 ${W} 270`} role="img" aria-label="Signal lifecycle from idea to scaled production, with rejection, decay and retirement exits">
    <Arrow />
    {row1.map((l, c) => box(l, c, 20))}
    {[0, 1, 2].map(c => arrowH(c, 20))}
    {row2.map((l, c) => box(l, c, 110, c === 3 ? 'live' : ''))}
    {[0, 1, 2].map(c => arrowH(c, 110))}
    <path d={`M${bx(3) + bw / 2} 60 V82 H${bx(0) + bw / 2} V110`} className="sig-flow" fill="none" markerEnd="url(#sig-arrow)" />
    <text x={(bx(3) + bw / 2 + bx(0) + bw / 2) / 2} y="76" textAnchor="middle" className="sig-lab">approved: owner, limits and data rights recorded</text>
    {box('Rejected or archived', 0, 200, 'exit')}
    <text x={bx(0) + bw + 10} y="224" className="sig-lab">Any stage can end here when a gate fails.</text>
    {box('Decayed → retired', 3, 200, 'exit')}
    <line x1={bx(3) + bw / 2} x2={bx(3) + bw / 2} y1="150" y2="200" className="sig-dash" markerEnd="url(#sig-arrow)" />
    <text x={bx(3) + bw / 2 + 8} y="180" className="sig-lab">edge fades</text>
    <text x={bx(0)} y="256" className="sig-lab">Each step up needs evidence and a named approver. Lessons feed new ideas.</text>
  </svg>
}

// Holding period on a log axis, and which path each family uses.
function HorizonMap() {
  const W = 640, L = 170, R = 14, top = 14, rowH = 34
  const lo = -5, hi = 8
  const x = s => L + ((Math.log10(s) - lo) / (hi - lo)) * (W - L - R)
  const H = top + horizons.length * rowH + 44
  return <svg className="sig-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Holding periods of signal families on a log scale, split between the live trading path and the shared platform path">
    {horizonTicks.map(([s, label]) => <g key={label}>
      <line x1={x(s)} x2={x(s)} y1={top} y2={top + horizons.length * rowH} className="sig-grid" />
      <text x={x(s)} y={top + horizons.length * rowH + 16} textAnchor="middle" className="sig-lab">{label}</text>
    </g>)}
    {horizons.map(([name, a, b, path], i) => <g key={name}>
      <text x={L - 8} y={top + i * rowH + 21} textAnchor="end" className="sig-h">{name}</text>
      <rect x={x(a)} y={top + i * rowH + 7} width={Math.max(4, x(b) - x(a))} height="20" rx="3" className={'sig-bar ' + path} />
    </g>)}
    <rect x={L} y={H - 20} width="12" height="10" className="sig-bar live" /><text x={L + 18} y={H - 11} className="sig-lab">Dedicated live path: local state, no shared service in the loop</text>
    <rect x={L + 330} y={H - 20} width="12" height="10" className="sig-bar platform" /><text x={L + 348} y={H - 11} className="sig-lab">Shared platform</text>
  </svg>
}

export default function SignalView({ part = 'anatomy' }) {
  if (part === 'anatomy') return (
    <div className="mm">
      <p className="lede">{definition}</p>
      <FlowDiagram flow={signalFlow} />
      <Figure title="A score becomes a position only through sizing" caption="One instrument’s signal over time. The thresholds are an illustration; real sizing weighs confidence, risk, costs, capacity and limits.">
        <ScoreToPosition />
      </Figure>
      <h3 className="sec-title">What a signal is not</h3>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Often confused with</th><th>How it differs</th></tr></thead>
        <tbody>{notSignal.map(([t, d]) => <tr key={t}><th>{t}</th><td>{d}</td></tr>)}</tbody>
      </table></div>
      <h3 className="sec-title">Anatomy of a signal record</h3>
      <p className="muted small">The fields every downstream consumer relies on. Treat them as a data contract: see <a href="#/contracts/examples">Schema contracts</a>.</p>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Part</th><th>Fields</th><th>Why it matters</th><th>Held by</th></tr></thead>
        <tbody>{anatomy.map(([p, f, w, h]) => <tr key={p}><th>{p}</th><td><code>{f}</code></td><td>{w}</td><td className="muted">{h}</td></tr>)}</tbody>
      </table></div>
      <Figure title="What the signal knew, and when" caption="Time in a signal has three meanings: when the event happened, when it could be known, and when you could trade. Testing at event time is look-ahead bias.">
        <KnowledgeTimeline />
      </Figure>
      <p className="small">Related: <a href="#/data/pit">Point-in-time & corrections</a> and <a href="#/workflows/research">Research journey</a>.</p>
    </div>
  )

  if (part === 'types') return (
    <div className="mm">
      <p className="muted">Signals differ by what they estimate, how long they hold and who forms them. Holding period decides the data, latency and path they need.</p>
      <h3 className="sec-title">Discretionary and systematic signals</h3>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Point</th><th>Discretionary</th><th>Systematic</th></tr></thead>
        <tbody>{discretionVsSystematic.map(([p, d, s]) => <tr key={p}><th>{p}</th><td>{d}</td><td>{s}</td></tr>)}</tbody>
      </table></div>
      <h3 className="sec-title">Families of signal</h3>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Family</th><th>Estimates</th><th>Where used</th><th>Typical horizon</th></tr></thead>
        <tbody>{types.map(([f, e, w, h]) => <tr key={f}><th>{f}</th><td>{e}</td><td className="muted">{w}</td><td className="nowrap">{h}</td></tr>)}</tbody>
      </table></div>
      <Figure title="Horizon decides the path" caption="Holding periods on a log scale. The shortest horizons run on a dedicated low-latency path; the rest use the shared platform. Ranges are indicative.">
        <HorizonMap />
      </Figure>
      <p className="small">The two paths are described in <a href="#/data/platform">Four data paths</a> and the <a href="#/workflows/trading">Trading journey</a>.</p>
    </div>
  )

  if (part === 'lifecycle') return (
    <div className="mm">
      <p className="muted">A signal moves from idea to production in stages. Each stage has an owner and a gate; any stage can end in rejection, and every live signal eventually decays.</p>
      <Figure title="Signal lifecycle" caption="The main path runs left to right, then down. Exits are dashed.">
        <LifecycleStates />
      </Figure>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Stage</th><th>What happens</th><th>Who</th><th>Gate or control</th></tr></thead>
        <tbody>{stages.map(([s, w, o, g]) => <tr key={s}><th>{s}</th><td>{w}</td><td className="muted">{o}</td><td>{g}</td></tr>)}</tbody>
      </table></div>
      <p className="small">The same path from the platform’s side is in <a href="#/workflows/research">Research journey</a>; capital steps are in <a href="#/operating/capital">Capital & decisions</a>.</p>
    </div>
  )

  return (
    <div className="mm">
      <p className="muted">How to judge a signal, how it fails, and which platform components carry it from data to order.</p>
      <h3 className="sec-title">Where a signal lives on the platform</h3>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Stage</th><th>What happens</th><th>Components</th></tr></thead>
        <tbody>{platformMap.map(([s, w, ids]) => <tr key={s}><th>{s}</th><td>{w}</td><td><div className="chip-row tight">{ids.map(id => <NodeChip key={id} id={id} />)}</div></td></tr>)}</tbody>
      </table></div>
      <h3 className="sec-title">How a signal is measured</h3>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Measure</th><th>What it tells you</th></tr></thead>
        <tbody>{metrics.map(([m, d]) => <tr key={m}><th>{m}</th><td>{d}</td></tr>)}</tbody>
      </table></div>
      <h3 className="sec-title">How signals fail</h3>
      <div className="risks">{failures.map(([t, what, fix]) => <div key={t} className="risk"><p className="r">{t}</p><p className="small">{what}</p><p className="small"><b>Control:</b> {fix}</p></div>)}</div>
      <p className="small">See <a href="#/ai/guardrails">Guardrails & decisions</a> for AI-generated signals and <a href="#/lifecycle/metrics">Measures across the business</a> for platform measures.</p>
    </div>
  )
}
