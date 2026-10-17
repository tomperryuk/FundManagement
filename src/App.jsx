import { useEffect, useState } from 'react'
import { roadmap } from './data.js'
import { Options, Stack } from './SourcingViews.jsx'
import SystemMap from './SystemMap.jsx'
import DecisionRegister from './DecisionRegister.jsx'
import { BusinessFit, Lifecycle, Principles } from './OperatingViews.jsx'
import DataArchitecture from './DataArchitecture.jsx'
import ArchitectureOverview from './ArchitectureOverview.jsx'

const DATA_ANCHORS = ['#security-master', '#alternative-data']
const TAB_PARAM = { overview: 'Architecture Overview', options: 'Options', stack: 'Tech Stack', data: 'Data Architecture', fit: 'Business Fit', register: 'Decision Register', lifecycle: 'Trade Lifecycle', principles: 'Design Principles' }
const TABS = ['Architecture Overview', 'Platform Map', 'Business Fit', 'Data Architecture', 'Trade Lifecycle', 'Decision Register', 'Design Principles', 'Options', 'Tech Stack', 'Roadmap']

export default function App() {
  const [tab, setTab] = useState(() => {
    if (window.location.hash === '#photon') return 'Business Fit'
    if (DATA_ANCHORS.includes(window.location.hash)) return 'Data Architecture'
    return TAB_PARAM[new URLSearchParams(window.location.search).get('tab')] || TABS[0]
  })

  // Links to a component (#/node/...) open the platform map; #photon opens the Photon review.
  useEffect(() => {
    const on = () => {
      if (window.location.hash.startsWith('#/node/')) setTab('Platform Map')
      if (window.location.hash === '#photon') {
        setTab('Business Fit')
        setTimeout(() => document.getElementById('photon')?.scrollIntoView({ block: 'start' }), 0)
      }
      if (DATA_ANCHORS.includes(window.location.hash)) {
        setTab('Data Architecture')
        setTimeout(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' }), 0)
      }
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1>Fund Platform Blueprint</h1>
              <p>Multi-strategy · multi-manager operating platform</p>
            </div>
          </div>
          <nav>
            {TABS.map((t) => (
              <button key={t} className={t === tab ? 'active' : ''} onClick={() => { setTab(t); if (t !== 'Platform Map') window.location.hash = '' }}>
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className={['Architecture Overview', 'Platform Map', 'Business Fit', 'Data Architecture', 'Decision Register', 'Trade Lifecycle', 'Design Principles', 'Options', 'Tech Stack'].includes(tab) ? 'wide' : ''}>
        {tab === 'Architecture Overview' && <ArchitectureOverview />}
        {tab === 'Platform Map' && <SystemMap />}
        {tab === 'Business Fit' && <BusinessFit />}
        {tab === 'Data Architecture' && <DataArchitecture />}
        {tab === 'Decision Register' && <DecisionRegister />}
        {tab === 'Trade Lifecycle' && <Lifecycle />}
        {tab === 'Design Principles' && <Principles />}
        {tab === 'Options' && <Options />}
        {tab === 'Tech Stack' && <Stack />}
        {tab === 'Roadmap' && <Roadmap />}
      </main>
    </div>
  )
}

function Roadmap() {
  return (
    <section>
      <h2>Delivery roadmap</h2>
      <div className="timeline">
        {roadmap.map((r) => (
          <article className="card" key={r.phase}>
            <span className="tag">{r.phase}</span>
            <h3>{r.title}</h3>
            <ul>{r.items.map((x) => <li key={x}>{x}</li>)}</ul>
          </article>
        ))}
      </div>
    </section>
  )
}
