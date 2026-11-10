import { lazy, Suspense, useEffect, useState } from 'react'
import { STAGES, TOOLS, STEPS, READING_PATHS, pathSteps, href, legacyRedirect, parseRoute } from './journey.jsx'
import { useDecisionState } from './choices.js'
import { DecisionSyncNotice } from './DecisionEditor.jsx'
import { TechTooltipHost } from './Tech.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { graphNodeForRoute } from './graphRoutes.js'
import { getProgress, markVisited } from './progress.js'
import { CHECKED } from './freshness.js'

const SearchDialog = lazy(() => import('./SearchDialog.jsx'))

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
  const decisionState = useDecisionState()
  const [searchOpen, setSearchOpen] = useState(false)
  const [seen, setSeen] = useState(() => getProgress().seen)
  const [manual, setManual] = useState({})
  const stagePages = page.stage.pages
  useEffect(() => { setManual({}) }, [page.stage.id])
  useEffect(() => { if (!page.stage.tool || page.id !== 'graph') setSeen(markVisited(page.id, page.parts ? part : null)) }, [page.id, part])
  useEffect(() => {
    // Expand every disclosure for printing, then put them back as they were.
    let closed = []
    const before = () => { closed = [...document.querySelectorAll('main details:not([open])')]; closed.forEach(d => d.setAttribute('open', '')) }
    const after = () => { closed.forEach(d => d.removeAttribute('open')); closed = [] }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after) }
  }, [])
  useEffect(() => {
    const on = (e) => {
      const typing = e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')
      const slash = e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey
      const chord = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (slash || chord) { e.preventDefault(); setSearchOpen(true) }
    }
    document.addEventListener('keydown', on)
    return () => document.removeEventListener('keydown', on)
  }, [])
  const graphId = graphNodeForRoute[window.location.hash.slice(2).split('/').slice(0, 2).join('/')] || graphNodeForRoute[page.id]
  const partTitle = page.parts?.find(([id]) => id === part)?.[1]

  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true })
    if (arg) document.getElementById(`decision-${arg}`)?.scrollIntoView({ block: 'start' })
    document.querySelector('.part-tabs a.on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
    document.title = `${partTitle || page.title} · Fund Platform Blueprint`
  }, [page, partTitle, arg])

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="masthead">
        <div className="masthead-inner">
          <a className="brand" href={href('overview')}>
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1>Fund Platform Blueprint</h1>
              <p>Verition alignment · reference architecture</p>
            </div>
          </a>
          <ol className="stepper" aria-label="Journey stages">
            {STAGES.map((s) => (
              <li key={s.id}>
                <a className={s.id === page.stage.id ? 'on' : ''} href={href(s.pages[0].id)} aria-current={s.id === page.stage.id ? 'step' : undefined} aria-label={s.title} title={s.title}>
                  <span className="sn">{s.optional ? "+" : s.n}</span>
                  <span className="st">{s.short}</span>
                </a>
              </li>
            ))}
          </ol>
          <label className="mobile-stage-picker">Jump to a stage · 4 core + optional<select aria-label="Jump to a blueprint stage" value={page.stage.tool ? '' : page.stage.id} onChange={e => { const stage = STAGES.find(s => s.id === e.target.value); window.location.hash = href(stage.pages[0].id).slice(1) }}>{page.stage.tool && <option value="" disabled>{page.title}</option>}{STAGES.map(s => <option key={s.id} value={s.id}>{s.optional ? 'Optional' : s.n} · {s.title}</option>)}</select></label>
          <div className="mast-actions">
            <button type="button" className="mast-search" onClick={() => setSearchOpen(true)} aria-haspopup="dialog" aria-keyshortcuts="/ Control+K Meta+K"><span aria-hidden="true">⌕</span> Search <kbd aria-hidden="true">/</kbd></button>
            <nav className="mast-tools" aria-label={TOOLS.title}>{TOOLS.pages.map(p => <a key={p.id} className={p.id === page.id ? 'on' : ''} href={href(p.id)} aria-current={p.id === page.id ? 'page' : undefined}>{p.short}</a>)}</nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      {searchOpen && <Suspense fallback={null}><SearchDialog onClose={() => setSearchOpen(false)} /></Suspense>}

      <div className={'shell' + (navOpen ? '' : ' nav-closed')}>
        <aside className="sidenav" aria-label="Contents">
          <button className="nav-toggle" onClick={() => setNavPref(!navOpen)} aria-expanded={navOpen} aria-label={navOpen ? 'Hide contents' : 'Show contents'}>
            {navOpen ? '← Hide contents' : <><span aria-hidden="true">☰</span><span className="nt-label">Contents</span></>}
          </button>
          <nav hidden={!navOpen} onClick={e => { if (e.target.closest("a") && window.matchMedia("(max-width: 900px)").matches) setNavPref(false) }}>
            {STAGES.map((s) => {
              const isOpen = manual[s.id] ?? s.id === page.stage.id
              return <section key={s.id} className={(s.id === page.stage.id ? 'cur' : '') + (isOpen ? ' open' : '')}>
                <h4><button type="button" className="stage-toggle" aria-expanded={isOpen} onClick={() => setManual(m => ({ ...m, [s.id]: !isOpen }))}><span className="sn">{s.optional ? "+" : s.n}</span><span className="stt">{s.title}</span><span className="chev" aria-hidden="true">{isOpen ? '▾' : '▸'}</span></button></h4>
                {isOpen && <ul>
                  {s.pages.map((p) => (
                    <li key={p.id}>
                      <a className={(p.id === page.id ? 'on' : '') + (seen.includes(p.id) && p.id !== page.id ? ' seen' : '')} href={href(p.id)} aria-current={p.id === page.id && !p.parts ? 'page' : undefined}>{p.title}{seen.includes(p.id) && p.id !== page.id && <span className="sr-only"> (visited)</span>}</a>
                      {p.id === page.id && p.parts && <ol className="side-parts" aria-label={`${p.title} sections`}>{p.parts.map(([id, title]) => <li key={id}><a className={id === part ? 'on' : ''} href={href(p.id, id)} aria-current={id === part ? 'page' : undefined}>{title}</a></li>)}</ol>}
                    </li>
                  ))}
                </ul>}
              </section>
            })}
            <section className={'tools' + (page.stage.tool ? ' cur' : '')}>
              <h4>{TOOLS.title}</h4>
              <ul>{TOOLS.pages.map(p => <li key={p.id}><a className={p.id === page.id ? 'on' : ''} href={href(p.id)} aria-current={p.id === page.id ? 'page' : undefined}>{p.title}</a></li>)}</ul>
            </section>
          </nav>
        </aside>

        <main id="main-content" tabIndex={-1} className={'page' + (page.wide ? ' wide' : '')}>
          <div className="crumb-row">
            <nav className="crumbs" aria-label="Breadcrumb">
              {!page.stage.tool && <><span>{page.stage.optional ? "Optional" : `Stage ${page.stage.n} of 4`} · {page.stage.title}</span>
              <span>›</span></>}
              {partTitle ? <a href={href(page.id)}>{page.title}</a> : <b>{page.title}</b>}
              {partTitle && <><span>›</span><b>{partTitle}</b></>}
            </nav>
            {page.id !== 'overview' && <div className="reference-note"><span className="status-chip" title="Validate current systems, owners and service levels before relying on this page.">{page.stage.optional ? 'Optional proposal' : 'Reference proposal'}</span>{graphId && <a href={`#/graph/${graphId}`}>Connections</a>}<a href="#/fit/assumptions">Public facts & sources</a></div>}
          </div>

          {readingPath && page.stage.tool && stepIndex < 0 && <nav className="reading-path compact" aria-label="Selected reading path"><b>{readingPath.title} path</b><a href={href(steps[resume].page.id, steps[resume].part)}>← Back to topic {resume + 1} of {steps.length}: {steps[resume].title}</a><a href={window.location.pathname + window.location.hash}>Exit path</a></nav>}
          {readingPath && !(page.stage.tool && stepIndex < 0) && <nav className="reading-path compact" aria-label="Selected reading path">
            <b>{readingPath.title} path</b>
            <span>{stepIndex >= 0 ? `Topic ${stepIndex + 1} of ${steps.length}` : 'Exploring a supporting detail'}</span>
            {stepIndex >= 0 && prev && <a href={href(prev.page.id, prev.part)} aria-label={`Previous topic: ${prev.title}`}>‹ Prev</a>}
            {stepIndex >= 0 && next && <a href={href(next.page.id, next.part)} aria-label={`Next topic: ${next.title}`}>Next ›</a>}
            <details className="path-topics"><summary>All {steps.length} topics</summary><ol>{steps.map((st, i) => <li key={i}><a href={href(st.page.id, st.part)} aria-current={stepIndex === i ? 'page' : undefined}>{st.title}</a></li>)}</ol></details>
            <a href={window.location.pathname + '#/overview'}>Exit path</a>
          </nav>}
          {(decisionState.error || decisionState.saving) && <DecisionSyncNotice />}
          {!page.own && (
            <header className="page-head">
              <h2>{page.title}</h2>
              {page.summary && <p className="lede">{page.summary}</p>}
              {page.related && <p className="related small">Related: {page.related.map(([label, to], i) => <span key={to}>{i > 0 && ' · '}<a href={to}>{label}</a></span>)}</p>}
            </header>
          )}
          {page.parts && <label className="part-picker">Part {Math.max(0, page.parts.findIndex(([id]) => id === part)) + 1} of {page.parts.length}<select value={part} onChange={e => { window.location.hash = href(page.id, e.target.value).slice(1) }}>{page.parts.map(([id, title], i) => <option key={id} value={id}>{i + 1} · {title}</option>)}</select></label>}
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
          {!(page.stage.tool && stepIndex < 0) && <nav className="pager" aria-label="Previous and next">
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
          </nav>}
          {!page.stage.tool && <p className="progress">{page.stage.optional ? "Optional extension" : `Stage ${page.stage.n} of 4`} · {page.stage.title} · page {stagePages.findIndex(p => p.id === page.id) + 1} of {stagePages.length}{page.parts ? ` · part ${Math.max(0, page.parts.findIndex(([id]) => id === part)) + 1} of ${page.parts.length}` : ''}</p>}
          <footer className="page-foot small muted">Working proposal · public facts and sources last checked {CHECKED} · <button type="button" className="link small" onClick={() => window.print()}>Print this page</button></footer>
        </main>
        <TechTooltipHost />
      </div>
    </div>
  )
}
