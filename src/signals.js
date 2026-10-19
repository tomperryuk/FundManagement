// What a signal is, how it is built, how it moves from idea to production, and where it lives on the platform.
// Reference definitions and proposals; thresholds, owners and gates need internal acceptance.

export const definition = 'A signal is a versioned, reproducible, time-stamped estimate about future returns, risk or flow for a defined set of instruments over a stated horizon, built only from information that was available at the time. It is an input to an investment decision. It is not an order, and it is not the profit that follows.'

export const notSignal = [
  ['Idea or thesis', 'A story about why something may move. Becomes a signal only when it is written down as a testable, repeatable estimate.'],
  ['Feature', 'An input to a model, such as a spread or revision. Several features may combine into one signal.'],
  ['Factor', 'A signal many instruments share exposure to (value, momentum). A factor is a signal that is useful across a whole universe.'],
  ['Alpha', 'The excess return that actually followed. A signal is a forecast of alpha; alpha is the outcome, measured afterwards.'],
  ['Target position', 'The size the portfolio wants, after the signal is combined with risk, costs and limits. Sizing is a separate step with its own owner.'],
  ['Order', 'An instruction to a broker or venue. It exists only after sizing and pre-trade checks.'],
]

// Fields of a signal record: the contract between research and everything downstream.
export const anatomy = [
  ['Identity & version', 'signal_id, version, owner, status', 'Which signal this is and exactly which release. A change in code, data or parameters is a new version.', 'Registry'],
  ['Universe', 'instrument set, identifiers', 'The instruments it covers, keyed to the security master so splits, mergers and ticker changes do not break history.', 'Security master'],
  ['Value', 'score or forecast, units, sign', 'The number itself. State whether it is a rank, a z-score, an expected return or a probability, and what a positive value means.', 'Research'],
  ['Time', 'as-of time, availability time, horizon', 'When the estimate applies, when it could first be known, and how long it is meant to hold. Availability time is what stops look-ahead.', 'Data platform'],
  ['Confidence', 'uncertainty, coverage, staleness flag', 'How sure the model is and how many inputs were missing or old. Downstream sizing and controls need this, not just the score.', 'Research'],
  ['Lineage', 'dataset versions, code, parameters, experiment id', 'Every input and run that produced it, so any value can be reproduced and audited.', 'Experiment record'],
  ['Restrictions', 'data rights, MNPI flags, team or wall limits', 'Who may see and use it, inherited from the most restricted input.', 'Entitlements'],
  ['Operating terms', 'refresh cadence, latency class, expected decay', 'How often it updates, how fast it must reach the decision, and how quickly its value fades after it is produced.', 'Owner'],
]

export const discretionVsSystematic = [
  ['How the signal is formed', 'A PM or analyst forms a view from research, models and judgement. The signal is the recorded thesis with catalyst, horizon and invalidation.', 'A model turns data into a score by a defined rule or learned function. The signal is its repeatable output.'],
  ['Form of the output', 'Conviction, target range or price view, often with a note.', 'Numeric score or forecast for every instrument in the universe, on a schedule.'],
  ['Reproducibility', 'Needs the thesis, evidence and data versions saved. Judgement itself cannot be replayed.', 'Must be exactly reproducible from code, parameters and data versions.'],
  ['Who sizes it', 'The PM, within limits.', 'A portfolio construction process, within limits, with the PM or committee overseeing.'],
  ['What goes wrong', 'Anchoring, undocumented reasoning, thesis drift, concentration the PM cannot see.', 'Overfitting, leakage, silent data change, decay, crowded trades.'],
  ['What the platform must provide', 'Idea tracker, evidence links, point-in-time data, a record of why a position was taken.', 'Versioned datasets, reproducible experiments, a registry, staged deployment and monitoring.'],
]

export const types = [
  ['Directional / alpha', 'Expected return of an instrument over a horizon.', 'Equity long/short, macro, credit', 'Days to months'],
  ['Relative value', 'Mispricing between related instruments, such as a pair, curve or basis.', 'Stat arb, convertibles, rates', 'Hours to weeks'],
  ['Event-driven', 'Expected reaction to a scheduled or unscheduled event.', 'Earnings, M&A, index changes', 'Hours to weeks'],
  ['Alternative-data', 'Information from non-traditional data, turned into an estimate of fundamentals or flow.', 'Card spend, web traffic, satellite', 'Days to quarters'],
  ['Risk and factor', 'Estimates of volatility, correlation or factor exposure that shape sizing rather than direction.', 'All strategies', 'Intraday to months'],
  ['Execution and microstructure', 'Short-term price, liquidity or order-flow estimates used to time and place trades.', 'Execution algos, market making', 'Microseconds to minutes'],
  ['Hedging', 'The size and instrument of an offsetting trade for an existing exposure.', 'Delta, FX, beta hedging', 'Continuous'],
]

// Bars for the horizon diagram: [name, start, end] on a log scale of holding period, in seconds.
export const horizons = [
  ['Microstructure & market making', 1e-5, 60, 'live'],
  ['Execution timing', 1, 3600, 'live'],
  ['Intraday stat arb', 60, 86400, 'live'],
  ['Event-driven', 3600, 2592000, 'platform'],
  ['Quant equity factors', 86400, 15552000, 'platform'],
  ['Discretionary & macro', 604800, 63072000, 'platform'],
]
export const horizonTicks = [[1e-3, '1 ms'], [1, '1 s'], [60, '1 min'], [3600, '1 hr'], [86400, '1 day'], [2592000, '1 mo'], [31536000, '1 yr']]

export const stages = [
  ['Idea', 'Observation or thesis', 'Owner: researcher or PM', 'Logged in the idea tracker with owner and data needs.'],
  ['Hypothesis', 'Testable statement with universe, horizon and invalidation', 'Owner: researcher', 'Written before testing to limit data-mining; recorded in the experiment record.'],
  ['Backtest', 'Historical test on point-in-time data with costs and capacity', 'Owner: researcher', 'Leakage, survivorship and multiple-testing checks; dataset versions and code pinned.'],
  ['Validation', 'Independent challenge', 'Owner: peer reviewer, model validation, compliance', 'Peer review; compliance check of data rights and MNPI; independent validation if the model is material.'],
  ['Paper', 'Live data, no capital', 'Owner: researcher and engineering', 'Live feeds and timing proven; outputs compared with the backtest.'],
  ['Shadow', 'Run alongside real decisions', 'Owner: PM', 'Would-be trades compared with actual; costs and slippage estimated from reality.'],
  ['Limited live', 'Small capital under tight limits', 'Owner: PM; CRO limits', 'Capital cap, kill switch, daily review, rollback plan.'],
  ['Scaled', 'Approved size', 'Owner: PM; CRO and CIO approve', 'Capacity evidence, monitoring, named production owner, recorded approval.'],
  ['Decayed / retired', 'Value has faded or risk outweighs it', 'Owner: PM; model owner', 'Reduce, archive with lineage, release data and compute, record lessons.'],
]

export const metrics = [
  ['Information coefficient (IC)', 'Correlation between the signal and the return that followed. It says whether the ranking is informative, not how much money it makes.'],
  ['Hit rate', 'Share of calls that were right. High hit rate with small wins and large losses can still lose money.'],
  ['Turnover', 'How much the portfolio must trade to follow the signal. High turnover erodes the edge through costs.'],
  ['Decay (half-life)', 'How fast the signal’s predictive power fades after it is produced. It sets the needed latency and refresh cadence.'],
  ['Capacity', 'How much capital can follow the signal before its own trading moves the price against it.'],
  ['Correlation to the book', 'Whether the signal adds something new or repeats exposure the firm already holds.'],
  ['Net contribution', 'Return after costs, borrow and financing, and after the risk it adds.'],
]

export const failures = [
  ['Look-ahead leakage', 'The test used a fact before it was available. The backtest looks excellent and live results do not.', 'Availability-time data, point-in-time datasets, review of every feature’s timestamp.'],
  ['Survivorship bias', 'Only instruments that still exist were tested, so failures are missing.', 'Universe history from the security master, including delisted names.'],
  ['Overfitting', 'Many variants were tried and the best one was kept. It fits noise.', 'Record every experiment, adjust for multiple testing, hold back untouched data.'],
  ['Stale or missing input', 'A feed is late or a field is empty, so the score is wrong without warning.', 'Staleness flag on the signal, freshness checks at the data contract, safe default in sizing.'],
  ['Silent change', 'Code, data or parameters changed and the signal changed with them, unrecorded.', 'Versioned registry, contract checks, a new version for every change.'],
  ['Decay and crowding', 'The edge fades as others find it or as conditions change.', 'Live-versus-backtest monitoring, decay limits, capital that steps down.'],
  ['Rights and restrictions', 'An input has licence limits or carries MNPI, and the signal spreads it.', 'Restrictions inherited from inputs, entitlement checks, compliance review.'],
]

// Where each stage lives on the platform: component ids from systemData.
export const platformMap = [
  ['Inputs', 'Approved data, identifiers and corporate actions, point-in-time.', ['md', 'ref', 'alt', 'lake', 'secmaster']],
  ['Build & test', 'Features, models, backtests, experiment records.', ['research', 'lake']],
  ['Register & approve', 'Versioned model, code and parameters; approvals.', ['research', 'compliance']],
  ['Deliver', 'Signal values published with their contract and lineage.', ['bus', 'lake']],
  ['Size & check', 'Combine with risk, costs and limits into a target; pre-trade checks.', ['pms', 'risk', 'compliance', 'capital']],
  ['Execute & learn', 'Orders, fills, costs; outcomes feed monitoring and the next hypothesis.', ['oms', 'ems', 'ibor']],
]

export const signalFlow = {
  title: 'From data to signal to order',
  intro: 'The signal is the middle of the chain. Sizing and controls come after it, owned by different people.',
  rows: [
    { label: 'Inputs', tone: 'data', steps: [
      { t: 'Point-in-time data', d: 'Prices, fundamentals, alternative data', to: '#/data/pit' },
      { t: 'Features', d: 'Spreads, revisions, momentum, text scores' },
    ] },
    { label: 'Signal', tone: 'work', between: 'Model turns features into an estimate', steps: [
      { t: 'Model or judgement', d: 'Rule, learned function or recorded thesis' },
      { t: 'Raw score', d: 'Per instrument, with as-of and availability time' },
      { t: 'Normalise & combine', d: 'Rank or z-score; blend with other signals' },
      { t: 'Versioned signal', d: 'Value, confidence, lineage, restrictions', to: '#/node/research' },
    ] },
    { label: 'Portfolio construction', tone: 'control', between: 'The signal is an input to sizing, not an instruction', steps: [
      { t: 'Combine with risk & costs', d: 'Volatility, correlation, capacity, borrow, fees' },
      { t: 'Apply limits & capital', d: 'Mandate, risk and compliance limits', to: '#/node/risk' },
      { t: 'Target position', d: 'What the book should hold' },
    ] },
    { label: 'Trading', tone: 'live', between: 'Pre-trade checks before release', steps: [
      { t: 'Orders', d: 'Staged by PM or portfolio process', to: '#/workflows/trading' },
      { t: 'Execution & fills', d: 'Costs and slippage measured' },
    ] },
  ],
  loop: 'Realised fills, costs and returns return to research as evidence: the signal is kept, changed or retired.',
  callout: ['Why the split matters', 'A good signal can lose money if it is sized badly, traded at high cost or applied beyond its capacity. Keeping signal, sizing and execution separate lets each be tested and owned on its own.'],
}
