import { useEffect, useState } from 'react'
import { STAGES, STEPS, href, legacyRedirect, parseRoute } from './journey.jsx'

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
  const stepIndex = STEPS.findIndex((s) => s.page.id === page.id && s.part === (page.parts ? part : null))
  const prev = STEPS[stepIndex - 1]
  const next = STEPS[stepIndex + 1]
  const partTitle = page.parts?.find(([id]) => id === part)?.[1]

  useEffect(() => {
    document.title = `${partTitle || page.title} · Fund Platform Blueprint`
  }, [page, partTitle])

  return (
    <div className="app">
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
                <a className={s.id === page.stage.id ? 'on' : ''} href={href(s.pages[0].id)} aria-current={s.id === page.stage.id ? 'step' : undefined}>
                  <span className="sn">{s.n}</span>
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
          <nav hidden={!navOpen}>
            {STAGES.map((s) => (
              <section key={s.id} className={s.id === page.stage.id ? 'cur' : ''}>
                <h4><span className="sn">{s.n}</span>{s.title}</h4>
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

        <main className={'page' + (page.wide ? ' wide' : '')}>
          <nav className="crumbs" aria-label="Breadcrumb">
            <span>{page.stage.n} · {page.stage.title}</span>
            <span>›</span>
            {partTitle ? <a href={href(page.id)}>{page.title}</a> : <b>{page.title}</b>}
            {partTitle && <><span>›</span><b>{partTitle}</b></>}
          </nav>

          {!page.own && (
            <header className="page-head">
              <h2>{page.title}</h2>
              {page.summary && <p className="lede">{page.summary}</p>}
            </header>
          )}
          {page.parts && (
            <div className="part-tabs" role="tablist" aria-label={`${page.title} sections`}>
              {page.parts.map(([id, title], i) => (
                <a key={id} role="tab" aria-selected={id === part} className={id === part ? 'on' : ''} href={href(page.id, id)}>
                  <span className="pn">{i + 1}</span>{title}
                </a>
              ))}
            </div>
          )}

          <div className="page-body" key={page.id + (part || '')}>{page.render(part, arg)}</div>

          <nav className="pager" aria-label="Previous and next">
            {prev ? (
              <a className="prev" href={href(prev.page.id, prev.part)}>
                <span>← Previous</span>
                <b>{prev.part ? `${prev.page.title}: ${prev.title}` : prev.title}</b>
              </a>
            ) : <span />}
            {next ? (
              <a className="next" href={href(next.page.id, next.part)}>
                <span>Next{next.page.stage.id !== page.stage.id ? ` · stage ${next.page.stage.n}` : ''} →</span>
                <b>{next.part ? `${next.page.title}: ${next.title}` : next.title}</b>
              </a>
            ) : <span />}
          </nav>
          <p className="progress">Step {stepIndex + 1} of {STEPS.length}</p>
        </main>
      </div>
    </div>
  )
}
