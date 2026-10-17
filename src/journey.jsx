// The reading journey: four stages, each with a few pages; long pages are split
// into parts so each screen covers one topic. Routes are #/<page>[/<part-or-arg>].
import ArchitectureOverview from './ArchitectureOverview.jsx'
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

export const STAGES = [
  {
    id: 'context', n: 1, title: 'Context', blurb: 'What the platform must do and why it is shaped this way',
    pages: [
      { id: 'overview', title: 'Overview', own: true, render: () => <><ArchitectureOverview /><JourneyGuide /></> },
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
      { id: 'map', title: 'Platform map', own: true, wide: true, render: () => <SystemMap /> },
      {
        id: 'lifecycle', title: 'Trade lifecycle',
        summary: 'Twelve stages from idea to investor report, what happens across a trading day, and how the flow differs by instrument. Times and service levels are targets for discussion.',
        parts: [['stages', 'Stage by stage'], ['day', 'A day on the platform'], ['instruments', 'By instrument']],
        render: (part) => <Lifecycle part={part} />,
      },
    ],
  },
  {
    id: 'data', n: 3, title: 'Data', blurb: 'The data platform, the key datasets and how to model them',
    pages: [
      {
        id: 'data', title: 'Data platform',
        summary: 'Four paths for four speeds of data. Snowflake is the proposed governed analytical platform, never the trading system of record. Technologies and service levels are candidates to validate against the current estate.',
        parts: [['platform', 'Four data paths'], ['snowflake', 'Where Snowflake sits'], ['modelling', 'Modelling approach'], ['serving', 'Serving by use case'], ['vendors', 'Vendor landscape']],
        render: (part) => <DataArchitecture part={part} />,
      },
      {
        id: 'datasets', title: 'Key datasets',
        summary: `${datasets.length} datasets, each with its owner, where it lives, the recommended data model, quality checks and how it is served.`,
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
    id: 'extend', n: 5, title: 'Extend', blurb: 'Diversifying into new businesses on the same platform',
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
  const [first, second] = hash.slice(2).split('/')
  if (first === 'node') return { page: pageById.map, part: null, arg: null }
  const page = pageById[first]
  if (!page) return { page: PAGES[0], part: null, arg: null }
  if (page.parts) {
    const part = page.parts.some(([id]) => id === second) ? second : page.parts[0][0]
    return { page, part, arg: null }
  }
  return { page, part: null, arg: second || null }
}

function JourneyGuide() {
  return (
    <section className="journey-guide">
      <h3 className="sec-title">How to read this blueprint</h3>
      <p className="muted">Four stages, in order. Each page is short; use Next at the bottom of every page, or jump straight to a stage.</p>
      <ol className="jg-stages">
        {STAGES.map((s) => (
          <li key={s.id}>
            <a className="jg-head" href={href(s.pages[0].id)}><span className="sn">{s.n}</span><b>{s.title}</b></a>
            <p className="small muted">{s.blurb}</p>
            <ul>{s.pages.map((p) => <li key={p.id}><a href={href(p.id)}>{p.title}</a></li>)}</ul>
          </li>
        ))}
      </ol>
    </section>
  )
}
