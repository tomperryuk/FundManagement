// Extending the platform into a separate market-making business.
// Latency figures, timelines and team sizes are indicative ranges to validate.

export const intro = 'A market maker earns the spread and exchange incentives by continuously quoting both sides of a market and hedging the inventory it accumulates. That is a different business from managing investor capital: it runs on the firm’s own capital in a regulated dealer entity, holds positions for seconds rather than months, sends millions of quotes a day, and competes on microseconds. Much of the enterprise platform carries over, but the trading path does not.'

// [dimension, hedge fund platform, market-making business]
export const differences = [
  ['How it makes money', 'Returns on investment positions', 'Spread capture, exchange rebates and hedged inventory'],
  ['Holding period', 'Days to months', 'Seconds to minutes; aim to stay close to flat'],
  ['Message volume', 'Thousands of orders a day per team', 'Millions of quotes a day; bursts of 100k+ messages a second'],
  ['Latency', 'Milliseconds are fine', 'Microseconds tick-to-trade; nanoseconds in competitive listed markets'],
  ['Capital', 'Investor capital in funds', 'The firm’s own capital in a regulated dealer entity (e.g. SEC net capital rule 15c3-1)'],
  ['Regulatory status', 'Investment adviser / fund manager', 'Broker-dealer or investment firm, exchange member, registered market maker with quoting obligations'],
  ['Risk controls', 'VaR, stress, drawdown, pre-trade compliance per order', 'Per-message pre-trade checks, real-time Greeks and inventory limits, kill switches (SEC 15c3-5, MiFID II RTS 6)'],
  ['Counterparties', 'Brokers and prime brokers', 'Exchanges directly, clearing firms and CCPs; clients if making markets OTC'],
  ['Infrastructure', 'Cloud-first', 'Colocation at each venue, kernel-bypass networking, often FPGAs, precise time sync'],
  ['Conflicts', 'Walls between investment teams for MNPI', 'A hard wall between market-making flow and the fund’s investment teams'],
]

export const prerequisites = [
  ['Legal entity & licences', 'A separate dealer entity, registered as a broker-dealer or investment firm in each jurisdiction, with its own governance.'],
  ['Exchange memberships', 'Membership at each venue and registration in its market-maker or liquidity-provider programme, which sets quoting obligations and fee tiers.'],
  ['Clearing', 'A clearing firm relationship to start; clearing membership at the CCP later if volumes justify it.'],
  ['Capital & funding', 'Regulatory capital for the dealer entity plus margin and default-fund contributions at the clearing firm or CCP.'],
  ['Risk & control certification', 'Documented market-access controls, algorithm testing and kill switches before going live.'],
  ['People', 'Quantitative traders, latency and hardware engineers, and dealer compliance and operations staff.'],
]

// Verdicts: reuse (works as is), extend (works with changes), separate (needs its own instance or stack), replace (changed completely), none (not needed)
export const verdicts = {
  reuse: ['Reuse', 'Works as is'],
  extend: ['Extend', 'Works with changes'],
  separate: ['Separate', 'Same design, separate instance'],
  replace: ['Replace', 'Changed completely'],
  none: ['Not needed', 'No equivalent in market making'],
}

// [component, verdict, what changes]
export const componentFit = [
  ['pmws', 'replace', 'A market-making trader console instead of a PM workstation: quote parameters, skew and width controls, inventory, live P&L per instrument, and one-click kill switches.'],
  ['opsconsole', 'extend', 'Add clearing breaks, exchange fee and rebate checks, and market-maker obligation alerts to the exception inbox.'],
  ['investorportal', 'none', 'The dealer trades its own capital; there are no external investors.'],
  ['lake', 'extend', 'Capture full-depth order books and every quote; volumes rise by orders of magnitude. Snowflake stays for post-trade analytics; raw capture goes to Parquet and a tick store.'],
  ['secmaster', 'extend', 'Millions of option series and intraday new strikes, exchange contract specifications, tick-size regimes and market-maker programme eligibility. Must publish to the hot path in microseconds.'],
  ['mdhub', 'replace', 'Direct exchange feeds decoded by kernel-bypass or FPGA feed handlers, building order books in memory. The existing hub keeps serving EOD prices and analytics.'],
  ['bus', 'separate', 'Kafka is too slow for quoting. The hot path uses shared memory or Aeron inside colocation; Kafka still carries drop copies and post-trade events to the enterprise.'],
  ['research', 'extend', 'Microstructure research, order-book replay and latency-aware simulation. Same research platform, different data and simulators.'],
  ['pms', 'replace', 'No portfolio construction in the quote path. An inventory and hedging engine inside the market-making stack manages positions in real time.'],
  ['risk', 'extend', 'Real-time Greeks and inventory limits move into the trading engine and risk gateways. The enterprise risk engine still aggregates the dealer entity into the firm-wide view at end of day.'],
  ['compliance', 'extend', 'Pre-trade checks move into hardware or software risk gateways in the order path (15c3-5). Add quoting-obligation monitoring, bona fide market-making exemptions and surveillance for spoofing and layering.'],
  ['capital', 'extend', 'The dealer entity gets its own capital, desk limits and regulatory capital calculation, separate from fund capital.'],
  ['oms', 'replace', 'Quotes do not go through an OMS. The quoting engine manages its own orders; an OMS may remain only for occasional block hedges.'],
  ['ems', 'replace', 'Hedging and routing are built into the market-making engine; no trader-driven EMS.'],
  ['fixgw', 'replace', 'Native binary exchange protocols (e.g. OUCH, ETI, iLink 3, Pillar) through dedicated colocated gateways. FIX remains for drop copies and post-trade.'],
  ['ibor', 'extend', 'Positions live inside the engine in real time. The IBOR receives aggregated drop copies for the dealer entity’s books and firm-wide exposure.'],
  ['posttrade', 'extend', 'Exchange trades clear through the clearing firm or CCP; no CTM affirmation for listed flow. Give-ups and allocations to the clearing account.'],
  ['settlement', 'extend', 'CCP settlement and daily variation margin through the clearing firm; much higher volumes of small trades.'],
  ['collateral', 'extend', 'CCP and clearing-firm margin, intraday calls and default-fund contributions replace prime-broker margin.'],
  ['accounting', 'separate', 'Separate books for the dealer entity: trading P&L split into spread capture, hedging and fees/rebates. Dealer accounting, not fund NAV.'],
  ['recon', 'extend', 'Very high-volume trade reconciliation against clearing-firm and exchange drop copies, plus fee and rebate reconciliation.'],
  ['reporting', 'replace', 'Dealer regulatory reporting instead of fund reporting: CAT, broker-dealer financial reports, transaction reporting, exchange obligation reports.'],
  ['ta', 'none', 'No investors, so no transfer agency.'],
  ['iam', 'extend', 'Same identity platform; add a hard information wall between the dealer and the fund’s investment teams, enforced in entitlements and data access.'],
  ['apigw', 'reuse', 'Unchanged for internal APIs and files; not used in the hot path.'],
  ['obs', 'extend', 'Add nanosecond-resolution wire capture and latency analytics, PTP time synchronisation and quote-presence monitoring.'],
  ['audit', 'extend', 'Every quote and order is a record: much larger retention volumes, CAT reporting and order-event audit trails.'],
  ['infra', 'replace', 'Colocation at each venue with tuned Linux, kernel-bypass NICs, low-latency switches and possibly FPGAs. Cloud remains for research and post-trade.'],
]

// [capability, what it does, typical technology]
export const newCapabilities = [
  ['Pricing & quoting engine', 'Computes fair value and quotes continuously, adjusting width and skew for inventory, volatility and adverse selection.', 'C++ / Rust; FPGA for the fastest paths'],
  ['Real-time volatility & fair-value models', 'Fits volatility surfaces and fair values intraday on every tick for options and ETFs.', 'In-house C++ libraries'],
  ['Inventory & hedging engine', 'Tracks positions per instrument in memory and hedges delta and other risks automatically.', 'In-house, inside the trading engine'],
  ['Low-latency market data', 'Decodes direct exchange feeds and maintains order books in memory.', 'Exegy, FPGA feed handlers, kernel-bypass (e.g. Solarflare / AMD ef_vi)'],
  ['Native exchange gateways', 'Speak each venue’s binary order protocol with minimal latency.', 'In-house or vendor gateways in colocation'],
  ['Pre-trade risk gateway', 'Checks every message for price, size, credit and position limits within microseconds; enforces kill switches.', 'FPGA or software risk gateways'],
  ['Kill switches & market controls', 'Pulls all quotes by venue, product or firm-wide in an instant.', 'Built into gateways and the trader console'],
  ['Quoting-obligation monitor', 'Measures quote presence, spread and size against each exchange programme’s obligations.', 'In-house analytics on the order-event stream'],
  ['Fee & rebate engine', 'Models exchange fee tiers and rebates per venue for pricing and P&L.', 'In-house'],
  ['Order-book capture & replay', 'Records every market and order event for research, simulation and regulators.', 'Packet capture + kdb+ / Parquet'],
  ['Time synchronisation & latency telemetry', 'Keeps clocks within microseconds of UTC and measures tick-to-trade on the wire.', 'PTP, Corvil / Pico, Arista timestamping'],
  ['Dealer regulatory reporting', 'CAT and transaction reporting, broker-dealer financial reports, exchange obligation reports.', 'Vendor reporting tools + in-house extracts'],
  ['Client pricing & RFQ (OTC only)', 'Streams prices and answers RFQs to clients on dealer platforms; manages client credit limits and best execution.', 'Tradeweb / Bloomberg dealer connectivity, ION, smartTrade'],
]

// Target architecture: [zone, location, components, note]
export const targetZones = [
  ['Hot path (new, separate)', 'Colocation at each venue', ['Feed handlers', 'Order books', 'Pricing & quoting engine', 'Inventory & hedger', 'Risk gateway', 'Exchange gateways'], 'Shared memory or Aeron; no Kafka, no databases, no cloud calls in the path.'],
  ['Trading control (new)', 'Colocation + office', ['Trader console', 'Kill switches', 'Obligation monitor', 'Latency telemetry'], 'Humans supervise and adjust parameters; they do not enter individual quotes.'],
  ['Warm path (extended)', 'Cloud / data centre', ['Drop copies → Kafka', 'Dealer IBOR & accounting', 'Clearing & margin', 'Recon', 'Surveillance'], 'Post-trade at much higher volume, in a separate legal entity.'],
  ['Shared enterprise core (reused)', 'Cloud', ['Security master', 'Snowflake / lakehouse', 'Research platform', 'Identity & walls', 'Observability', 'Audit'], 'One core for both businesses, with a hard information wall between them.'],
]

// Indicative tick-to-trade budget: [stage, software, FPGA]
export const latencyBudget = [
  ['Market data in: decode and book update', '1–5 µs', '< 0.5 µs'],
  ['Pricing and quote decision', '1–5 µs', '< 1 µs'],
  ['Pre-trade risk checks', '0.5–2 µs', '< 0.3 µs'],
  ['Order encode and send', '1–3 µs', '< 0.3 µs'],
  ['Total tick-to-trade (in colocation)', '5–15 µs', 'Sub-microsecond to ~2 µs'],
]

const opt = (name, fit, pros, cons) => ({ name, fit, pros, cons })

export const mmDecisions = [
  {
    id: 'mm-1', q: 'Inside the fund, a separate entity, or acquire?',
    context: 'Market making uses the firm’s own capital and needs a dealer licence; the fund manages investor capital under a different regime.',
    options: [
      opt('Inside the existing fund entity', 'Never for a regulated dealer business', ['No new entity'], ['Mixes investor and proprietary capital', 'Wrong regulatory status for quoting obligations']),
      opt('Separate affiliated dealer entity', 'Default', ['Clean capital, books and regulation', 'Shares group infrastructure under service agreements'], ['Licensing takes 6–12+ months', 'Group conflicts must be governed']),
      opt('Acquire or partner with an existing market maker', 'Speed matters more than control', ['Licences, memberships and tech in place'], ['Integration and culture risk', 'Expensive']),
    ],
    rec: 'Separate affiliated dealer entity', why: 'It keeps investor capital and proprietary trading apart, gives the dealer the right licences and lets it reuse group infrastructure under clear service agreements.', revisit: 'A suitable acquisition target appears that shortens time to market materially.',
  },
  {
    id: 'mm-2', q: 'Which market first?',
    context: 'Each market needs different technology, licences and relationships.',
    options: [
      opt('ETFs and listed equity options', 'Volatility and equity expertise in-house', ['No client franchise needed; exchange programmes pay incentives', 'Clear, measurable obligations'], ['Intense latency competition', 'Options series volumes stress the security master and risk']),
      opt('FX or rates, streaming to clients (OTC)', 'Strong macro franchise and dealer relationships', ['Closer to existing macro expertise', 'Less latency-bound than listed options'], ['Needs a client franchise, credit lines and balance sheet', 'Client onboarding and best-execution duties']),
      opt('Digital assets', 'Appetite for a newer market', ['24/7 opportunity; lower barriers'], ['Venue and custody risk; evolving regulation', '24/7 operations']),
    ],
    rec: 'ETFs and listed equity options', why: 'It needs no client franchise, exchange incentive programmes reward liquidity provision, and success is measurable from day one. Choose FX or rates instead if the macro franchise and dealer relationships are stronger.', revisit: 'Latency competition in the chosen venues makes the economics unattractive.',
  },
  {
    id: 'mm-3', q: 'Share the platform or build a separate stack?',
    context: 'The fund platform is built for correctness and governance; market making needs microseconds.',
    options: [
      opt('Run market making on the existing platform', 'Never for competitive quoting', ['No new build'], ['Milliseconds of latency; OMS and Kafka in the path', 'Market-making volume would overwhelm fund systems']),
      opt('Separate hot path, shared enterprise core', 'Default', ['Speed where it matters; reuse security master, data, identity and post-trade patterns', 'One firm-wide risk and data view'], ['Clear contracts between hot path and core', 'Hard information wall needed']),
      opt('Completely separate technology', 'Acquired or fully independent business', ['No coupling at all'], ['Duplicates security master, data platform and controls']),
    ],
    rec: 'Separate hot path, shared enterprise core', why: 'Latency-critical components must be new and colocated; everything after the trade, plus reference data, identity and the data platform, can be reused with extensions.', revisit: 'The dealer is spun out or sold.',
  },
  {
    id: 'mm-4', q: 'Build or buy the trading technology?',
    context: 'Vendors sell complete market-making platforms; leading market makers build their own.',
    options: [
      opt('Buy a vendor market-making platform', 'Fast entry, less competitive markets', ['Live in months', 'Exchange connectivity included'], ['Same latency and logic as other vendor clients', 'Limited edge']),
      opt('Build everything in-house', 'Latency is the edge', ['Full control of speed and pricing'], ['Years and scarce specialists']),
      opt('Buy connectivity and market data, build pricing and strategy', 'Default', ['Edge where it matters; commodity plumbing bought'], ['Integration between vendor and in-house components']),
    ],
    rec: 'Buy connectivity and market data, build pricing and strategy', why: 'Feed handling, gateways and risk gateways are increasingly commodity hardware and software; pricing, hedging and quoting logic are where the money is made.', revisit: 'Latency becomes the binding constraint; bring feed handling in-house or onto FPGAs.',
  },
  {
    id: 'mm-5', q: 'Software or FPGA?',
    context: 'Hardware acceleration cuts latency by an order of magnitude but is slow and expensive to change.',
    options: [
      opt('Kernel-bypass software', 'Start here', ['Fast to change; mainstream skills'], ['Single-digit microseconds; may lose races in the busiest products']),
      opt('FPGA for the whole path', 'Most competitive products', ['Sub-microsecond tick-to-trade'], ['Hardware engineers; slow iteration']),
      opt('FPGA for feed handling and risk, software for pricing', 'Scaling phase', ['Most of the latency gain with flexible strategy code'], ['Two toolchains']),
    ],
    rec: 'Kernel-bypass software', why: 'Prove the economics first in software; move feed handling and risk checks onto FPGAs in the products where fill rates show you are losing races.', revisit: 'Fill and adverse-selection analysis shows latency losses in key products.',
  },
  {
    id: 'mm-6', q: 'Clear through a clearing firm or become a clearing member?',
    context: 'Clearing membership lowers costs at scale but needs capital, operations and default-fund contributions.',
    options: [
      opt('Clearing firm', 'Start here', ['Fast; the clearing firm carries membership'], ['Fees per contract; margin set by the clearing firm']),
      opt('Self-clearing member', 'High, stable volumes', ['Lower cost per trade; direct CCP relationship'], ['Capital, default-fund contributions and clearing operations']),
    ],
    rec: 'Clearing firm', why: 'Keep capital and operations light until volumes are proven.', revisit: 'Clearing fees become a material share of revenue.',
  },
  {
    id: 'mm-7', q: 'How strict is the wall between the dealer and the fund?',
    context: 'A market maker sees order flow and quotes that fund teams must not trade on; regulators will expect firm separation.',
    options: [
      opt('Shared teams and data', 'Never', ['Simple'], ['Conflicts of interest; regulatory risk']),
      opt('Separate people, systems and data, with a governed shared core', 'Default', ['Clear separation that can be evidenced', 'Central risk sees both at an aggregate level'], ['Entitlements, monitoring and physical separation to maintain']),
    ],
    rec: 'Separate people, systems and data, with a governed shared core', why: 'The dealer’s order data is restricted to the dealer; only central risk and compliance see aggregated exposure across both businesses, under surveillance.', revisit: 'Never weaken; review annually with compliance.',
  },
  {
    id: 'mm-8', q: 'Who builds and runs it?',
    context: 'Low-latency trading needs different engineers and a different operating rhythm.',
    options: [
      opt('Existing technology teams take it on', 'Small pilots only', ['Uses existing people'], ['Wrong skills; distracts from the fund platform']),
      opt('A dedicated dealer technology team on the shared core', 'Default', ['Specialists own the hot path', 'Core platform, data and security teams serve both businesses'], ['Two cultures under one CTO']),
    ],
    rec: 'A dedicated dealer technology team on the shared core', why: 'Latency engineering is a specialism; sharing the core avoids duplicating reference data, data platform and security.', revisit: 'The dealer becomes large enough to justify its own CTO.',
  },
]

// [phase, indicative timing, what happens, gate to the next phase]
export const entryPath = [
  ['0 · Feasibility', '0–3 months', 'Choose the first market, model economics (spread capture, rebates, adverse selection, latency), select legal structure and clearing firm.', 'Board approval of business case and capital'],
  ['1 · Set up', '3–12 months', 'Form the dealer entity, apply for licences and memberships, hire the core team, secure colocation and market data.', 'Licences granted; clearing agreement signed'],
  ['2 · Build & simulate', '6–15 months', 'Build the hot path, risk gateway and trader console; replay historical order books; paper-quote against live markets.', 'Simulated P&L and risk controls signed off; market-access controls certified'],
  ['3 · Pilot', '12–18 months', 'Quote a small set of products on one venue with tight limits and small capital.', 'Obligations met; P&L and fill quality in line with the business case'],
  ['4 · Scale', '18 months +', 'Add products and venues, move hot spots to FPGA, consider clearing membership.', 'Returns on capital justify expansion'],
]

// [team, role, indicative size]
export const mmTeams = [
  ['Quantitative trading', 'Pricing models, quoting strategies, parameters and daily P&L ownership', '4–10'],
  ['Low-latency engineering', 'Hot path: feed handlers, engine, gateways, risk gateway', '6–15'],
  ['Hardware & network', 'Colocation, network, time sync, FPGA (later)', '2–6'],
  ['Dealer operations', 'Clearing, fees and rebates, breaks, regulatory reports', '3–6'],
  ['Dealer compliance & risk', 'Market-access controls, surveillance, obligations, capital', '2–5'],
]
