import { useMemo, useState } from 'react'

import { terms } from './glossaryTerms.js'
import { withoutGlossary } from './gloss/transform.js'

const categories = ['All areas', ...new Set(terms.map(([category]) => category))]

export default function Glossary() {
  return withoutGlossary(() => GlossaryPage())
}

function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All areas')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return terms.filter(([area, name, definition]) =>
      (category === 'All areas' || area === category) &&
      (!q || `${area} ${name} ${definition}`.toLowerCase().includes(q)))
  }, [query, category])

  return <section className="glossary">
    <p className="eyebrow">Reference · research, trading & operations</p>
    <h3 className="sec-title">Key terms in context</h3>
    <p className="muted">Definitions reflect how the terms are used in this blueprint. Policies, market conventions and provider capabilities can vary; validate operational meanings with the relevant owner.</p>
    <div className="glossary-controls">
      <label>Search terms<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="For example: locate, point-in-time, settlement" /></label>
      <label>Area<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(x => <option key={x}>{x}</option>)}</select></label>
      <p aria-live="polite">{filtered.length} of {terms.length} terms</p>
    </div>
    {filtered.length ? <div className="glossary-grid">{filtered.map(([area, term, definition]) => <article className="glossary-entry" key={area + term}>
      <p>{area}</p><h4>{term}</h4><div>{definition}</div>
    </article>)}</div> : <p className="glossary-empty">No terms match that search. Try a shorter word or choose “All areas”.</p>}
  </section>
}
