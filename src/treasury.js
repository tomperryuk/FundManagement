// How treasury fits the platform. Cadences, buffers and tolerances are indicative starting points to validate.

export const intro = 'Treasury makes sure the fund and its investors’ cash are in the right place, in the right currency, at the right time, and that every payment is authorised. It sits between trading, which creates cash needs, and the banks, custodians and prime brokers, which hold the cash. On this platform it is a team and a set of controls, not a separate system: it runs on the Settlement & Treasury and Margin & Collateral components, reads positions from the IBOR, and is reconciled by Reconciliation.'

// [question, answer]
export const role = [
  ['What it owns', 'Cash positions and forecasts, payments and sweeps, funding and financing terms, FX conversions and share-class hedging, and the liquidity buffer.'],
  ['What it does not own', 'Positions (IBOR), margin calculations and dispute handling (Collateral Operations, with treasury funding the result), the official NAV (administrator) and investor dealing (transfer agency).'],
  ['Who runs it', 'The COO organisation, led by a Treasurer, with the CFO and CRO as consumers. Prime-broker and bank agreements are owned here; the CRO challenges the exposure they create.'],
]

// [flow, from, to, how treasury is involved]
export const flows = [
  ['Settlement cash', 'custodian', 'settlement', 'Settlement instructions create projected debits and credits by value date; actual balances come back from banks and custodians.'],
  ['Margin and collateral', 'pb', 'collateral', 'Margin calls are agreed by collateral operations; treasury forecasts the cash and eligible securities needed and funds the transfer.'],
  ['Financing', 'pb', 'ibor', 'Leverage, borrow and financing costs depend on the terms treasury negotiates; positions show how much is drawn.'],
  ['Investor flows', 'investorportal', 'accounting', 'Subscriptions and redemptions from the transfer agent drive cash in and out and the dealing calendar the buffer is sized to.'],
  ['Fees and expenses', 'accounting', 'settlement', 'Management and performance fees, expenses and distributions are approved in accounting and paid by treasury.'],
  ['Cash proof', 'recon', 'settlement', 'Bank and custodian cash is reconciled daily to the internal projection; breaks route to the exception inbox.'],
]

// [stage, when, what happens, output]
export const dailyCycle = [
  ['Opening cash position', 'Early morning', 'Load overnight bank, custodian and prime-broker statements, then compare actual balances with projected.', 'Confirmed opening cash by account and currency'],
  ['Forecast', 'Morning', 'Project the day and the next weeks: settlements, margin calls, investor flows, fees and FX needs, combining IBOR and collateral forecasts.', 'Cash ladder by currency and value date'],
  ['Funding decisions', 'Before market close in each region', 'Cover shortfalls, sweep surplus cash, move collateral between accounts and execute FX for cash and share-class hedges.', 'Approved payments and FX trades'],
  ['Payments', 'Intraday, before bank cut-offs', 'Release payments with dual authorisation after call-back checks on any changed bank details.', 'Sent payments with an audit trail'],
  ['End-of-day proof', 'Evening and overnight', 'Reconcile cash, investigate breaks, update the forecast and report limit and buffer status to the COO and CRO.', 'Reconciled cash and exceptions report'],
]

// [area, what treasury manages, how it connects]
export const liquidity = [
  ['Liquidity buffer', 'Unencumbered cash and quickly saleable assets held against margin shocks, redemptions and fails.', 'Sized from stress margin forecasts supplied by the risk engine and from the redemption terms.'],
  ['Prime-broker and bank cash', 'Balances spread across several prime brokers, banks and custodians to limit counterparty exposure.', 'Counterparty limits are set with the CRO; excess cash is swept to approved accounts or money-market funds.'],
  ['Margin and collateral funding', 'Initial and variation margin for OTC, cleared and futures positions, and PB margin.', 'Collateral operations agree calls; treasury ensures eligible assets and cash are in the right place.'],
  ['Leverage and financing', 'Financing lines, repo and synthetic financing terms, and their costs.', 'Terms inform capital allocation and the cost of carry the PMs see.'],
  ['FX and share-class hedging', 'Converts cash to the currency needed and hedges non-base share classes.', 'Uses the same positions and prices as the rest of the platform; hedge results are allocated to the share class.'],
  ['Investor liquidity', 'Subscriptions, redemptions, gates and side pockets.', 'Redemption notices come from the transfer agent and feed the forecast before dealing days.'],
]

// [risk, control, owner]
export const controls = [
  ['Payment fraud or error', 'Dual authorisation, call-back verification of new or changed bank details, and payment limits by user and account.', 'Treasurer'],
  ['Unauthorised bank access', 'Role-based entitlements, maker–checker on beneficiary changes, quarterly access reviews and bank mandates kept current.', 'Treasurer with CTO (identity)'],
  ['Unknown cash position', 'Daily reconciliation of bank, custodian and prime-broker cash to internal records, with an age on every break.', 'Operations'],
  ['Liquidity shortfall', 'Buffer floors, forward cash ladder, early-warning triggers and a documented escalation to the CIO and CRO.', 'Treasurer, CRO'],
  ['Counterparty concentration', 'Limits on cash and collateral held at each prime broker, bank and custodian, reviewed after market events.', 'CRO'],
  ['Funding terms drift', 'Track each agreement’s margin, financing and termination terms; alert when a counterparty changes them.', 'Treasurer'],
]

export const decisions = [
  ['Standalone treasury management system or operations platform module?', 'A dedicated TMS adds multi-bank connectivity, payment workflow and forecasting; the platform module is simpler and keeps one operational view. Decide after counting banks, currencies and payment volume.'],
  ['Bank connectivity model', 'SWIFT service bureau, host-to-host or bank portals. Each trades cost, control and onboarding effort per bank.'],
  ['How many prime brokers and banks', 'More counterparties reduce concentration but multiply cash accounts, margin calls and reconciliations.'],
  ['Where cash forecasting lives', 'In treasury as a spreadsheet-free tool, or as a data-platform product that treasury, risk and the PMs all read.'],
]
