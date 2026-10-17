import { useState } from 'react'
import { useDecisionState } from './choices.js'

const labels = { open: 'Open', proposed: 'Under review', agreed: 'Agreed' }
const date = value => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
export function DecisionSyncNotice() {
  const state = useDecisionState()
  return <div className={'sync-notice' + (state.error ? ' has-error' : '')} role="status">
    <span>{state.status === 'preview' ? 'Local preview · changes stay in this browser.' : state.status === 'loading' ? 'Loading shared decisions…' : state.status === 'unavailable' ? 'Shared decisions unavailable · editing is paused.' : state.saving ? 'Saving shared decision…' : 'Shared decisions · visible to both reviewers; refresh every 15 seconds.'}</span>
    {state.error && <><span>{state.error}</span><button className="link" onClick={state.refresh}>Reload latest decisions</button></>}
  </div>
}
export default function DecisionEditor({ decision: d }) {
  const state = useDecisionState()
  const record = state.records[d.id]
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const edit = (choice = record?.choice || null) => {
    setError('')
    setDraft({ id: d.id, version: record?.version || 0, choice, status: choice ? record?.status === 'agreed' && choice === record?.choice ? 'agreed' : 'proposed' : 'open', rationale: record?.rationale || '', owner: record?.owner || state.actor || '' })
  }
  const change = update => setDraft({ ...draft, ...update })
  const submit = async event => {
    event.preventDefault()
    try { await state.saveRecord(draft); setDraft(null) } catch (e) { setError(e.message) }
  }
  return <div className="decision-review">
    <p className="small"><b>{labels[record?.status || 'open']}</b>{record?.updatedAt && <> · {record.owner} · updated {date(record.updatedAt)} by {record.updatedBy}</>}</p>
    {record?.rationale && <p className="review-rationale">{record.rationale}</p>}
    {!draft && <button className="secondary-action" disabled={!state.editable} onClick={() => edit()}>Edit choice, rationale & owner</button>}
    {!record?.choice && state.legacy[d.id] && d.options.some(o => o.name === state.legacy[d.id]) && !draft && <button className="secondary-action" disabled={!state.editable} onClick={() => edit(state.legacy[d.id])}>Review previous browser choice</button>}
    {draft && <form className="decision-form" onSubmit={submit}>
      <label>Selected option<select value={draft.choice || ''} onChange={e => change({ choice: e.target.value || null, status: e.target.value ? 'proposed' : 'open', rationale: '' })}><option value="">Open · no selection</option>{d.options.map(o => <option key={o.name}>{o.name}</option>)}</select></label>
      <label>Review status<select value={draft.status} onChange={e => change({ status: e.target.value })} disabled={!draft.choice}><option value="open" disabled={Boolean(draft.choice)}>Open</option><option value="proposed">Under review</option><option value="agreed">Agreed</option></select></label>
      <label>Decision owner<input value={draft.owner} maxLength={120} onChange={e => change({ owner: e.target.value })} placeholder="Person or accountable role" /></label>
      <label className="full">Rationale<textarea value={draft.rationale} maxLength={4000} rows={3} required={draft.status === 'agreed'} onChange={e => change({ rationale: e.target.value })} placeholder="Why this option? Record constraints, evidence and follow-up." /></label>
      {error && <p className="form-error full" role="alert">{error} <button type="button" className="link" onClick={() => edit()}>Load latest record</button></p>}
      <div className="row full"><button className="primary" disabled={!state.editable} type="submit">{state.saving ? 'Saving…' : 'Save decision'}</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
    </form>}
    {record?.history?.length > 0 && <details className="decision-history"><summary>Change history ({record.history.length})</summary><ol>{[...record.history].reverse().map(entry => <li key={entry.version}><b>{labels[entry.status]} · {entry.choice || 'No selection'}</b><span>{date(entry.updatedAt)} · {entry.updatedBy} · owner: {entry.owner}</span>{entry.rationale && <p>{entry.rationale}</p>}</li>)}</ol></details>}
  </div>
}
