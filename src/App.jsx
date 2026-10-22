import { useEffect, useState } from 'react'
import { STAGES, STEPS, READING_PATHS, pathSteps, href, legacyRedirect, parseRoute } from './journey.jsx'
import { useDecisionState } from './choices.js'
import { DecisionSyncNotice } from './DecisionEditor.jsx'
import { TechTooltipHost } from './Tech.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { graphNodeForRoute } from './graphRoutes.js'

function useRoute() {
  const [route, setRoute] = useState(() => {
    const to = legacyRedirect()
    if (to) window.history.replaceState(null, '', window.location.pathname + to)
    return parseRoute(window.location.hash) || parseRoute('')
  })
  useEffect(() => {
    const on = () => {
      const to = legacyRedirect()
      if (to) { window.location.replace(to); return }
      const next = parseRoute(window.location.hash)
      if (!next) return // plain in-page anchor: let the browser scroll
      setRoute((prev) => {
        if (prev.page.id !== next.page.id || prev.part !== next.part) window.scrollTo({ top: 0 })
        return next
      })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export default function App() {
  const { page, part, arg } = useRoute()
  // null = automatic (closed on wide pages); phones start closed.
  const [navPref, setNavPref] = useState(() => (window.matchMedia?.('(max-width: 900px)').matches ? false : null))
  const navOpen = navPref ?? !page.wide
  const pathKey = new URLSearchParams(window.location.search).get('journey')
  const readingPath = Object.hasOwn(READING_PATHS, pathKey) ? READING_PATHS[pathKey] : null
  const steps = readingPath ? pathSteps(pathKey) : STEPS.filter(s => Boolean(s.page.stage.optional) === Boolean(page.stage.optional))
  const stepIndex = steps.findIndex(s => s.page.id === page.id && s.part === (page.parts ? part : null))
  const [resume, setResume] = useState(0)
  useEffect(() => { if (stepIndex >= 0) setResume(stepIndex) }, [stepIndex])
  const prev = stepIndex >= 0 ? steps[stepIndex - 1] : null
  const next = stepIndex >= 0 ? steps[stepIndex + 1] : steps[resume] || steps[0]
  const stageSteps = STEPS.filter(s => s.page.stage.id === page.stage.id)
  const stageIndex = stageSteps.findIndex(s => s.page.id === page.id && s.part === (page.parts ? part : null))
  const decisionState = useDecisionState()
  const graphId = graphNodeForRoute[window.location.hash.slice(2).split('/').slice(0, 2).join('/')] || graphNodeForRoute[page.id]
  const partTitle = page.parts?.find(([id]) => id === part)?.[1]

  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
    if (arg) document.getElementById(`decision-${arg}`)?.scrollIntoView({ block: 'start' })
    document.title = `${partTitle || page.title} · Fund Platform Blueprint`
  }, [page, partTitle, arg])

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="masthead">
        <div className="masthead-inner">
          <ThemeToggle />
          <a className="brand" href={href('overview')}>
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1>Fund Platform Blueprint</h1>
              <p>Verition alignment · reference architecture</p>
            </div>
          </a>
          <label className="mobile-stage-picker">Jump to a stage · 4 core + optional<select aria-label="Jump to a blueprint stage" value={page.stage.id} onChange={e => { const stage = STAGES.find(s => s.id === e.target.value); window.location.hash = href(stage.pages[0].id).slice(1) }}>{STAGES.map(s => <option key={s.id} value={s.id}>{s.optional ? 'Optional' : s.n} · {s.title}</option>)}</select></label>
          <ol className="stepper" aria-label="Journey stages">
            {STAGES.map((s) => (
              <li key={s.id}>
                <a className={s.id === page.stage.id ? 'on' : ''} href={href(s.pages[0].id)} aria-current={s.id === page.stage.id ? 'step' : undefined}>
                  <span className="sn">{s.optional ? "+" : s.n}</span>
                  <span className="st">{s.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className={'shell' + (navOpen ? '' : ' nav-closed')}>
        <aside className="sidenav" aria-label="Contents">
          <button className="nav-toggle" onClick={() => setNavPref(!navOpen)} aria-expanded={navOpen} aria-label={navOpen ? 'Hide contents' : 'Show contents'}>
            {navOpen ? '← Hide contents' : <><span aria-hidden="true">☰</span><span className="nt-label">Contents</span></>}
          </button>
          <nav hidden={!navOpen} onClick={e => { if (e.target.closest("a") && window.matchMedia("(max-width: 900px)").matches) setNavPref(false) }}>
            {STAGES.map((s) => (
              <section key={s.id} className={s.id === page.stage.id ? 'cur' : ''}>
                <h4><span className="sn">{s.optional ? "+" : s.n}</span>{s.title}</h4>
                <p className="blurb">{s.blurb}</p>
                <ul>
                  {s.pages.map((p) => (
                    <li key={p.id}>
                      <a className={p.id === page.id ? 'on' : ''} href={href(p.id)} aria-current={p.id === page.id ? 'page' : undefined}>{p.title}</a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </aside>

        <main id="main-content" tabIndex={-1} className={'page' + (page.wide ? ' wide' : '')}>
          <nav className="crumbs" aria-label="Breadcrumb">
            <span>{page.stage.optional ? "Optional" : `Stage ${page.stage.n} of 4`} · {page.stage.title}</span>
            <span>›</span>
            {partTitle ? <a href={href(page.id)}>{page.title}</a> : <b>{page.title}</b>}
            {partTitle && <><span>›</span><b>{partTitle}</b></>}
          </nav>

          {readingPath && <nav className="reading-path" aria-label="Selected reading path"><div><b>{readingPath.title} path</b><span>{stepIndex >= 0 ? `Topic ${stepIndex + 1} of ${steps.length}` : 'Exploring a supporting detail'}</span></div><ol>{steps.map((s, i) => <li key={i}><a href={href(s.page.id, s.part)} aria-current={stepIndex === i ? 'page' : undefined}>{s.title}</a></li>)}</ol><a href={window.location.pathname + '#/overview'}>Exit path · browse all contents</a></nav>}
          {page.id !== 'overview' && <div className="reference-note"><span><b>{page.stage.optional ? 'Optional business proposal' : 'Reference design proposal'}</b> · Validate current systems, owners and service levels.</span>{graphId && <a href={`#/graph/${graphId}`}>View in knowledge graph</a>}<a href="#/fit/assumptions">Public facts & sources</a></div>}
          {(decisionState.error || decisionState.saving) && <DecisionSyncNotice />}
          {!page.own && (
            <header className="page-head">
              <h2>{page.title}</h2>
              {page.summary && <p className="lede">{page.summary}</p>}
            </header>
          )}
          {page.parts && (
            <nav className="part-tabs" aria-label={`${page.title} sections`}>
              {page.parts.map(([id, title], i) => (
                <a key={id} aria-current={id === part ? 'page' : undefined} className={id === part ? 'on' : ''} href={href(page.id, id)}>
                  <span className="pn">{i + 1}</span>{title}
                </a>
              ))}
            </nav>
          )}

          <div className="page-body" key={page.id + (part || '')}>{page.render(part, arg)}</div>

          {stepIndex === steps.length - 1 && <section className="journey-complete"><h3>{readingPath ? `${readingPath.title} path complete` : page.stage.optional ? 'Extension review complete' : 'Core blueprint complete'}</h3><p>Use the decision register to capture owners, rationale and outstanding questions, then agree the next delivery gate.</p><a href="#/register">Review shared decisions →</a><a href={window.location.pathname + '#/overview'}>Choose another path →</a>{!page.stage.optional && <a href="#/marketmaking/model">Explore the optional Market Making extension →</a>}</section>}
          <nav className="pager" aria-label="Previous and next">
            {prev ? (
              <a className="prev" href={href(prev.page.id, prev.part)}>
                <span>← Previous</span>
                <b>{prev.part ? `${prev.page.title}: ${prev.title}` : prev.title}</b>
              </a>
            ) : <span />}
            {next ? (
              <a className="next" href={href(next.page.id, next.part)}>
                <span>{stepIndex < 0 ? 'Return to path' : 'Next'}{!readingPath && next.page.stage.id !== page.stage.id && !next.page.stage.optional ? ` · stage ${next.page.stage.n}` : ''} →</span>
                <b>{next.part ? `${next.page.title}: ${next.title}` : next.title}</b>
              </a>
            ) : <span />}
          </nav>
          <p className="progress">{page.stage.optional ? "Optional extension" : `Stage ${page.stage.n} of 4`} · {page.stage.title} · section {stageIndex + 1} of {stageSteps.length}</p>
        </main>
        <TechTooltipHost />
      </div>
    </div>
  )
}
