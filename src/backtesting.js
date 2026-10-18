// How backtesting works on the platform. Thresholds and tolerances are indicative starting points to validate with the CIO and CRO.

export const intro = 'A backtest replays a strategy against history to estimate how it would have traded. It is the main evidence used to decide whether a signal earns capital, and also the easiest place to fool yourself. The platform therefore treats a backtest as a governed experiment: the data is point-in-time, the simulator charges realistic costs, every run is pinned to code and data versions, and a result only counts once it has passed independent validation.'

// [question, answer]
export const role = [
  ['What it is for', 'Screening ideas cheaply, sizing a strategy’s capacity and costs, choosing parameters without overfitting, and giving the CIO and model-risk reviewers evidence for promotion.'],
  ['What it cannot prove', 'That a strategy will make money. A backtest shows consistency with history under stated assumptions; live paper trading and ramped capital provide the remaining evidence.'],
  ['Who owns it', 'Research platform engineering owns the engine and data access; each PM or quant team owns its strategy and results; model risk independently validates anything proposed for production.'],
]

// [stage, owner, what happens, output]
export const lifecycle = [
  ['1. Hypothesis', 'Researcher', 'Write down the economic rationale, universe, horizon, expected sign and the tests that would falsify it before looking at results.', 'Pre-registered hypothesis in the experiment record'],
  ['2. Data selection', 'Researcher', 'Pull only point-in-time datasets from the lakehouse, including delisted names, corporate actions and vendor vintages as known at each date.', 'Pinned dataset versions and availability cutoffs'],
  ['3. Fast screen', 'Researcher', 'Run a vectorised backtest with simple cost assumptions to reject weak ideas quickly. Count every variant tried.', 'Screening result and trial count'],
  ['4. Event-driven simulation', 'Researcher', 'Replay the surviving strategy through the event-driven engine with order-book, latency, borrow, financing and capacity models.', 'Net-of-cost performance, turnover and capacity curve'],
  ['5. Robustness', 'Researcher, peer reviewer', 'Walk-forward and out-of-sample tests, parameter sensitivity, regime and sub-period splits, cost and delay stress.', 'Robustness report and deflated performance'],
  ['6. Independent validation', 'Model risk', 'Re-run from the pinned inputs on a clean environment, check for look-ahead and leakage, and challenge assumptions.', 'Validation memo with findings'],
  ['7. Paper trading', 'PM, Trading', 'Run the signal live without capital to compare real signals and simulated fills with the backtest.', 'Slippage and drift comparison'],
  ['8. Promotion and monitoring', 'CIO, CRO', 'Promote with limits, then monitor live results against the backtest envelope and trigger review or a kill switch on divergence.', 'Signal registry entry and live drift dashboard'],
]

// [bias, how it happens, control]
export const biases = [
  ['Look-ahead bias', 'Using information that was not yet available, such as restated fundamentals, end-of-day prices for intraday decisions or index membership known later.', 'Join on knowledge time, not event time. Availability cutoffs per dataset; automated check that no feature timestamp exceeds the decision time.'],
  ['Survivorship bias', 'Testing only on securities that still exist, which overstates returns.', 'Universes are built as of each date and include delisted, merged and bankrupt securities with their final returns.'],
  ['Data leakage', 'Training or tuning on data that overlaps the test period, or normalising with full-sample statistics.', 'Purged and embargoed splits, features fitted only on the training window, and a held-out period nobody tunes against.'],
  ['Overfitting and data mining', 'Trying many variants and reporting the best; the winner is often noise.', 'Log every trial, report deflated Sharpe and probability of backtest overfitting, require economic rationale and a final untouched holdout.'],
  ['Selection and reporting bias', 'Reporting favourable periods, instruments or parameters only.', 'Fixed evaluation windows set before testing, results stored for all runs, and peer review of the full trial history.'],
  ['Vendor restatement bias', 'Vendors back-fill or revise history, so a backtest uses numbers nobody had at the time.', 'Capture vendor vintages with known-at timestamps and flag datasets that cannot supply them.'],
  ['Regime and sample-size risk', 'A short or single-regime sample says little about other conditions.', 'Minimum history by horizon, sub-period and stress-period reports, and explicit capacity of the signal to fail in unseen regimes.'],
]

// [area, what it models, typical approach]
export const realism = [
  ['Transaction costs', 'Commission, exchange and clearing fees, spread crossing and taxes.', 'Per-venue fee schedules by date; spread from historical quotes rather than a flat assumption.'],
  ['Market impact and slippage', 'Price moves caused by the strategy’s own trading and by delay between decision and fill.', 'Square-root or calibrated impact model scaled by participation and volatility, checked against the firm’s own execution history.'],
  ['Liquidity and capacity', 'How much can be traded without overwhelming volume or moving the price.', 'Participation caps by average daily volume; performance reported at several capital levels to show where returns decay.'],
  ['Order handling', 'Whether limit orders would have filled, partial fills and queue position.', 'Event-driven replay of tick or order-book data for execution-sensitive strategies; simpler fill rules for low-turnover ones.'],
  ['Shorting and borrow', 'Availability and fee of borrow, recalls and hard-to-borrow names.', 'Historical borrow rates and availability where licensed; conservative default fees otherwise.'],
  ['Financing and margin', 'Cost of leverage, cash interest and margin requirements.', 'Use the same financing and margin assumptions treasury applies to live trading.'],
  ['Timing and latency', 'When signals are computed and when orders can actually reach the market.', 'Explicit decision, order and fill timestamps; a delay stress test of one or more bars.'],
  ['Corporate actions and calendars', 'Splits, dividends, mergers, halts, holidays and currency.', 'Adjustments from the security master as known at the time; local calendars and FX at the trade date.'],
]

// [method, what it tests, when to use]
export const methods = [
  ['Vectorised backtest', 'Fast array-based replay with simple costs.', 'Screening many ideas; never sufficient for promotion.'],
  ['Event-driven backtest', 'Bar-by-bar or tick-by-tick simulation with order, fill and portfolio logic shared with production where possible.', 'Required before any signal is promoted.'],
  ['Walk-forward analysis', 'Fit on a rolling window, test on the next, then roll forward.', 'Parameterised or machine-learned signals; mimics periodic re-estimation.'],
  ['Out-of-sample holdout', 'A final period kept untouched until one confirmatory run.', 'Every candidate for promotion; a reuse spends the holdout.'],
  ['Cross-validation with purging', 'K-fold splits with overlapping labels purged and embargoed.', 'Machine-learning models with overlapping return horizons.'],
  ['Monte Carlo and bootstrap', 'Resamples returns or trade order to put confidence ranges around results.', 'Estimating drawdown and Sharpe uncertainty.'],
  ['Parameter sensitivity', 'Perturbs each parameter to see whether performance is a stable plateau or a lone peak.', 'Any tuned strategy; a sharp peak is a warning.'],
  ['Stress and scenario replay', 'Replays crises or shocks, such as 2008, 2020 and rate spikes, against current positions.', 'Risk review and capacity sizing.'],
]

// [metric, why it matters, caution]
export const metrics = [
  ['Net Sharpe and Sortino', 'Return per unit of risk after all costs.', 'Report deflated Sharpe that accounts for the number of trials; a high raw Sharpe from many tries means little.'],
  ['Max drawdown and recovery time', 'The pain an investor would have lived through.', 'Compare with the strategy’s risk budget and stop-loss rules.'],
  ['Turnover and cost drag', 'How much of gross return trading costs consume.', 'A signal with strong gross returns can vanish net of costs.'],
  ['Capacity', 'Capital at which returns fall below an agreed threshold.', 'Report the curve, not one number.'],
  ['Hit rate and payoff', 'Win frequency and average win versus loss.', 'Interpret together; neither alone defines quality.'],
  ['Exposure and factor attribution', 'Whether returns are alpha or loaded market, sector and style factors.', 'Residual alpha after factors is what adds to the existing book.'],
  ['Correlation to the book', 'Diversification versus current strategies.', 'A modest, uncorrelated signal can beat a strong one that duplicates existing risk.'],
  ['Backtest-to-live gap', 'Difference between simulated and realised results during paper trading and live use.', 'Tracked per signal; persistent shortfall triggers review.'],
]

// [component, role, detail]
export const platform = [
  ['Point-in-time data access', 'Single entry point for historical data as known at each date.', 'Lakehouse API with knowledge-time joins, delisted universes and dataset versions; research cannot read raw or restated tables.'],
  ['Experiment record', 'Links every run to inputs and outputs.', 'Stores hypothesis, dataset versions, availability cutoffs, code commit, parameters, random seeds, environment image and results so any run can be reproduced.'],
  ['Backtest engine', 'Runs simulations.', 'Python orchestration with a Rust or C++ event loop; shared strategy interface and order logic with the production runtime to avoid a rewrite gap.'],
  ['Compute', 'Runs large parameter and walk-forward grids.', 'Ray clusters on Kubernetes with quotas per team; research warehouses sized so a large backtest never slows the NAV pack.'],
  ['Results store and reports', 'Keeps and compares runs.', 'MLflow or equivalent for metrics and artifacts; standard tear sheet; trial count shown on every report.'],
  ['Signal registry', 'Gatekeeper to production.', 'Records owner, horizon, decay, correlation and approval state; promotion requires linked validation evidence.'],
  ['Live drift monitoring', 'Closes the loop.', 'Compares live signals and fills with the backtest envelope and raises alerts or disables the signal.'],
]

// [role, responsibility]
export const governance = [
  ['Researcher / PM', 'Defines the hypothesis, runs the tests, discloses all trials and owns the result.'],
  ['Peer reviewer', 'Reads the code and full trial history, and challenges assumptions before submission.'],
  ['Model risk', 'Independently reproduces the run, checks bias controls and signs off on promotion.'],
  ['CIO', 'Decides capital allocation using validated results, capacity and fit with the book.'],
  ['CRO', 'Sets limits, monitors live drift and can withdraw a signal.'],
  ['Compliance', 'Confirms every dataset has MNPI and licence clearance, including permission to use it in backtests.'],
]

// [item, requirement]
export const evidence = [
  ['Reproducibility', 'Re-running from the experiment record gives the same result within a stated tolerance.'],
  ['Bias checks', 'Look-ahead, survivorship and leakage checks passed and documented.'],
  ['Trial disclosure', 'Total number of variants tried and a deflated performance estimate.'],
  ['Net-of-cost result', 'Costs, impact, borrow and financing included, with a capacity curve.'],
  ['Robustness', 'Stable under parameter, period, cost and delay perturbation.'],
  ['Out-of-sample proof', 'A confirmatory run on an untouched holdout and a paper-trading comparison.'],
  ['Independent sign-off', 'Model-risk validation memo and CIO approval recorded in the signal registry.'],
]

export const decisions = [
  ['Build or buy the backtester', 'In-house gives realistic fills and one code path to production; a vendor tool is faster to start. The current proposal is event-driven in-house, with vectorised screening.'],
  ['Single code path or two', 'Sharing strategy code between backtest and production avoids translation errors but constrains the simulator design.'],
  ['How much tick-level fidelity', 'Order-book replay is expensive in data and compute and only matters for execution-sensitive strategies.'],
  ['Holdout policy', 'Who guards the final holdout, and how many looks each team gets before it is considered spent.'],
  ['Borrow and quote history', 'Whether to license historical borrow and quote data, which materially improves realism but adds cost.'],
]
