// The reading journey: four core stages and an optional extension, each with a few pages; long pages are split
// into parts so each screen covers one topic. Routes are #/<page>[/<part-or-arg>].
import ArchitectureOverview, { Workflows } from './ArchitectureOverview.jsx'
import SystemMap from './SystemMap.jsx'
import DecisionRegister from './DecisionRegister.jsx'
import DataArchitecture from './DataArchitecture.jsx'
import { AltDataSection, SecMasterSection } from './DataDeepDives.jsx'
import { BusinessFit, Lifecycle, Principles } from './OperatingViews.jsx'
import { Options, Stack } from './SourcingViews.jsx'
import { principleGroups } from './operatingModel.js'
import { datasets } from './dataArchitecture.js'
import Roadmap from './Roadmap.jsx'
import OrgView from './OrgView.jsx'
import MarketMakingView from './MarketMakingView.jsx'
import Glossary from './Glossary.jsx'
import TreasuryView from './TreasuryView.jsx'
import AIContextView from './AIContextView.jsx'

export const STAGES = [
  {
    id: 'context', n: 1, title: 'Context', blurb: 'What the platform must do and why it is shaped this way',
    pages: [
      { id: 'overview', title: 'Overview', own: true, render: () => <ArchitectureOverview guide={<JourneyGuide />} /> },
      {
        id: 'fit', title: 'Verition business fit',
        summary: 'Verition’s public profile and operating principles, the workflows of its four strategy groups, Photon integration options, and the internal questions to confirm before committing.',
        parts: [['assumptions', 'Verition profile & principles'], ['groups', 'Strategy group needs'], ['risk', 'Photon fit & diligence'], ['review', 'Responses & open questions']],
        render: (part) => <BusinessFit part={part} />,
      },
      {
        id: 'principles', title: 'Design principles',
        summary: 'Seventeen principles: five that come from the business model, then the architecture, control and operating rules that make them hold.',
        parts: principleGroups.map(([id, name]) => [id, name]),
        render: (part) => <Principles part={part} />,
      },
    ],
  },
  {
    id: 'architecture', n: 2, title: 'Architecture', blurb: 'The systems, how they connect, and how a trade moves through them',
    pages: [
      { id: 'workflows', title: 'Research & trading workflows', summary: 'Follow the work, the control gates and the hand-offs between investment teams and the shared platform.', parts: [['research', 'Research journey'], ['trading', 'Trading journey']], render: part => <Workflows part={part} /> },
      { id: 'map', title: 'Platform map', own: true, wide: true, render: () => <SystemMap /> },
      {
        id: 'lifecycle', title: 'Lifecycle & success measures',
        summary: 'A shared view across research, trading, operations, data and technology delivery: detailed trade stages, strategy-specific workflows, accountable owners, measures and end states.',
        parts: [['stages', 'Trade stages'], ['day', 'A day on the platform'], ['instruments', 'By instrument'], ['metrics', 'Measures across the business']],
        render: (part) => <Lifecycle part={part} />,
      },
      {
        id: 'treasury', title: 'Treasury',
        summary: 'How cash, funding and payments fit the platform: what treasury owns, the daily cycle, the liquidity areas it manages and the controls around it.',
        parts: [['role', 'Role & cash flows'], ['cycle', 'Daily cycle'], ['liquidity', 'Liquidity & financing'], ['controls', 'Controls & decisions']],
        render: (part) => <TreasuryView part={part} />,
      },
      {
        id: 'ai', title: 'Ontology, AI & SDLC',
        summary: 'Where a shared ontology and context layer adds value across the platform, which AI uses it enables, how AI fits software delivery, and the guardrails and decisions needed.',
        parts: [['context', 'Ontology & context layer'], ['usecases', 'AI use cases'], ['sdlc', 'AI in the SDLC'], ['guardrails', 'Guardrails & decisions'], ['path', 'Adoption path']],
        render: (part) => <AIContextView part={part} />,
      },
      {
        id: 'glossary', title: 'Research & trading glossary',
        summary: 'Search clear, workflow-specific definitions for the research, portfolio, trading, post-trade, data and technology terms used throughout this blueprint.',
        render: () => <Glossary />,
      },
    ],
  },
  {
    id: 'data', n: 3, title: 'Data', blurb: 'The data platform, the key datasets and how to model them',
    pages: [
      {
        id: 'data', title: 'Data platform',
        summary: 'Four paths for four speeds of data, how history and corrections are kept point-in-time, and how team workspaces sit on shared services. Snowflake is the proposed governed analytical platform, never the trading system of record. Technologies and service levels are candidates to validate against the current estate.',
        parts: [['platform', 'Four data paths'], ['snowflake', 'Where Snowflake sits'], ['modelling', 'Modelling approach'], ['pit', 'Point-in-time & corrections'], ['teams', 'Team workspaces'], ['serving', 'Serving by use case'], ['vendors', 'Vendor landscape']],
        render: (part) => <DataArchitecture part={part} />,
      },
      {
        id: 'datasets', title: 'Key datasets',
        summary: `${datasets.length} datasets with provider shortlists, recommendations and selection owners, alongside storage, data models, quality checks and serving paths.`,
        render: (_, arg) => <DataArchitecture part="datasets" dataset={arg} />,
      },
      { id: 'secmaster', title: 'Security master', own: true, render: () => <SecMasterSection /> },
      { id: 'altdata', title: 'Alternative data', own: true, render: () => <AltDataSection /> },
    ],
  },
  {
    id: 'deliver', n: 4, title: 'Decide & deliver', blurb: 'Sourcing, technology, organisation, open decisions and the delivery sequence',
    pages: [
      {
        id: 'options', title: 'Sourcing options',
        summary: 'Four platform strategies scored against what matters to the firm, then what each means for every component. Scores and effort bands are starting hypotheses, not diligence or estimates.',
        parts: [['strategies', 'Compare strategies'], ['matrix', 'By component']],
        render: (part) => <Options part={part} />,
      },
      {
        id: 'stack', title: 'Technology stack',
        summary: 'Candidate technologies layer by layer, with why each is considered, the alternatives and which components use it.',
        parts: [['layers', 'By layer'], ['components', 'By component']],
        render: (part) => <Stack part={part} />,
      },
      { id: 'register', title: 'Decision register', own: true, render: () => <DecisionRegister /> },
      {
        id: 'org', title: 'Organisation',
        summary: 'A reference organisation aligned to the business model and the architecture: who builds and owns each component, where decisions are made, and the trade-offs behind the shape.',
        parts: [['structure', 'Structure'], ['ownership', 'Component ownership'], ['forums', 'Governance forums'], ['decisions', 'Decisions & trade-offs']],
        render: (part) => <OrgView part={part} />,
      },
      { id: 'roadmap', title: 'Roadmap', own: true, render: () => <Roadmap /> },
    ],
  },
  {
    id: 'extend', n: 5, optional: true, title: 'Optional extension', blurb: 'Diversifying into new businesses on the same platform',
    pages: [
      {
        id: 'marketmaking', title: 'Market making',
        summary: 'What it would take to add a separate market-making business: how it differs, which components carry over, what is new, and the decisions and entry path.',
        parts: [['model', 'How it differs'], ['fit', 'Component fit'], ['new', 'New capabilities'], ['target', 'Target architecture'], ['decisions', 'Decisions & trade-offs'], ['path', 'Entry path & teams']],
        render: (part) => <MarketMakingView part={part} />,
      },
    ],
  },
]

export const CORE_STAGES = STAGES.filter(s => !s.optional)

export const PAGES = STAGES.flatMap((s) => s.pages.map((p) => ({ ...p, stage: s })))
const pageById = Object.fromEntries(PAGES.map((p) => [p.id, p]))

// Linear reading order: every part of every page.
export const STEPS = PAGES.flatMap((p) => (p.parts ? p.parts.map(([id, title]) => ({ page: p, part: id, title })) : [{ page: p, part: null, title: p.title }]))

export const href = (page, part) => `#/${page}${part ? '/' + part : ''}`

// Old links from earlier versions of the site.
const LEGACY_HASH = { '#security-master': '#/secmaster', '#alternative-data': '#/altdata', '#risk-platform': '#/fit/risk', '#photon': '#/fit/risk' }
const LEGACY_TAB = { overview: 'overview', fit: 'fit', data: 'data', register: 'register', lifecycle: 'lifecycle', principles: 'principles', options: 'options', stack: 'stack' }

export function legacyRedirect() {
  const h = window.location.hash
  if (LEGACY_HASH[h]) return LEGACY_HASH[h]
  const tab = new URLSearchParams(window.location.search).get('tab')
  if (!h && tab && LEGACY_TAB[tab]) return href(LEGACY_TAB[tab])
  return null
}

// Returns { page, part, arg } for the current hash, or null for plain in-page anchors.
export function parseRoute(hash) {
  if (!hash || hash === '#' || hash === '#/') return { page: PAGES[0], part: null, arg: null }
  if (!hash.startsWith('#/')) return null
  const [first, second, third] = hash.slice(2).split('/')
  if (first === 'node') return { page: pageById.map, part: null, arg: null }
  const page = Object.hasOwn(pageById, first) ? pageById[first] : null
  if (!page) return { page: PAGES[0], part: null, arg: null }
  if (page.parts) {
    const part = page.parts.some(([id]) => id === second) ? second : page.parts[0][0]
    return { page, part, arg: third || null }
  }
  return { page, part: null, arg: second || null }
}

export const READING_PATHS = {
  leadership: { title: 'Leadership', detail: 'Understand the proposal, compare sourcing and resolve the decisions that gate delivery.', stops: [['overview'], ['options', 'strategies'], ['register'], ['roadmap']] },
  investment: { title: 'Investment teams', detail: 'Follow research into trading, then validate strategy needs, business-wide measures and key terminology.', stops: [['workflows', 'research'], ['workflows', 'trading'], ['fit', 'groups'], ['lifecycle', 'stages'], ['lifecycle', 'metrics'], ['glossary'], ['register']] },
  technology: { title: 'Technology & controls', detail: 'Explore components, controls, data ownership, delivery outcomes, service responsibilities and key terminology.', stops: [['map'], ['lifecycle', 'stages'], ['data', 'platform'], ['data', 'pit'], ['data', 'teams'], ['datasets'], ['lifecycle', 'metrics'], ['glossary'], ['org', 'ownership'], ['register'], ['roadmap']] },
}
export const pathSteps = key => READING_PATHS[key]?.stops.map(([id, part]) => ({ page: pageById[id], part: part || null, title: pageById[id].parts?.find(([k]) => k === part)?.[1] || pageById[id].title }))

function JourneyGuide() {
  const selected = new URLSearchParams(window.location.search).get('journey')
  if (Object.hasOwn(READING_PATHS, selected)) return <p className="outcome"><b>Start with the proposal below.</b> Use Next to continue through your selected path, or open a supporting detail and return using the path links above.</p>
  return <section className="journey-guide start-guide">
    <h3>Start with your task</h3>
    <p>Choose a guided path, or use Contents to browse the four core stages.</p>
    <div className="start-paths">{Object.entries(READING_PATHS).map(([key, path]) => <article key={key}><h4>{path.title}</h4><p>{path.detail}</p><span>{path.stops.length} topics</span><a className="primary-link" href={`?journey=${key}${href(...path.stops[0])}`}>Start this path →</a></article>)}</div>
    <details className="core-outline"><summary>Browse the complete blueprint · {CORE_STAGES.length} core stages</summary><ol className="jg-stages">{CORE_STAGES.map(s => <li key={s.id}><a className="jg-head" href={href(s.pages[0].id)}><span className="sn">{s.n}</span><b>{s.title}</b></a><p>{s.blurb}</p><ul>{s.pages.map(p => <li key={p.id}><a href={href(p.id)}>{p.title}</a></li>)}</ul></li>)}</ol></details>
    <p className="small muted">Optional extension: <a href="#/marketmaking/model">Market Making</a> explores a separate business and is outside the core reading sequence.</p>
  </section>
}
