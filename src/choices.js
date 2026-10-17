import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from 'react'

const Context = createContext(null)
const PREVIEW = import.meta.env.DEV || import.meta.env.MODE === 'preview'
const LOCAL_KEY = 'fpb-preview-decisions-v2'
function local(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback } }

export function ChoiceProvider({ children }) {
  const [state, setState] = useState(() => ({ revision: 0, records: {}, actor: '', ...(PREVIEW ? local(LOCAL_KEY, {}) : {}) }))
  const current = useRef(state)
  const [status, setStatus] = useState(PREVIEW ? 'preview' : 'loading')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const busy = useRef(false)
  const accept = useCallback(next => {
    if (next.revision >= current.current.revision) { current.current = next; setState(next) }
  }, [])
  const refresh = useCallback(async () => {
    if (PREVIEW) return
    try {
      const response = await fetch('/api/decisions', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Shared decisions could not be loaded.')
      accept(data); setStatus('ready'); setError('')
    } catch (e) { setStatus('unavailable'); setError(e.message) }
  }, [accept])
  useEffect(() => {
    refresh()
    const timer = PREVIEW ? null : setInterval(refresh, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [refresh])

  const saveRecord = async input => {
    if (busy.current) throw new Error('Please wait for the current save to finish.')
    if (!PREVIEW && status !== 'ready') throw new Error('Shared decisions are unavailable. Reload before editing.')
    busy.current = true; setSaving(true); setError('')
    try {
      if (PREVIEW) {
        const previous = current.current.records[input.id]
        if ((previous?.version || 0) !== input.version) throw new Error('This decision changed. Reopen the editor to load the latest record.')
        const entry = { ...input, version: input.version + 1, updatedBy: 'Local preview', updatedAt: new Date().toISOString() }
        const next = { ...current.current, revision: current.current.revision + 1, records: { ...current.current.records, [input.id]: { ...entry, history: [...(previous?.history || []), entry] } } }
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); accept(next)
      } else {
        const response = await fetch('/api/decisions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
        const data = await response.json()
        if (!response.ok) {
          if (response.status === 409) await refresh()
          throw new Error(data.error || 'The decision could not be saved.')
        }
        accept(data)
      }
      return true
    } catch (e) { setError(e.message); throw e }
    finally { busy.current = false; setSaving(false) }
  }
  const choose = async (id, option) => {
    const previous = current.current.records[id]
    const choice = option === previous?.choice ? null : option
    try {
      return await saveRecord({ id, version: previous?.version || 0, choice, status: choice ? 'proposed' : 'open', rationale: '', owner: previous?.owner || current.current.actor || '' })
    } catch { return false }
  }
  const choices = Object.fromEntries(Object.entries(state.records).filter(([, r]) => r.choice).map(([id, r]) => [id, r.choice]))
  return createElement(Context.Provider, { value: { ...state, choices, choose, saveRecord, refresh, status, error, saving, editable: !saving && ['ready', 'preview'].includes(status), legacy: local('fpb-decision-choices', {}) } }, children)
}
export function useDecisionState() { return useContext(Context) }
export function useChoices() { const state = useDecisionState(); return [state.choices, state.choose, state] }
