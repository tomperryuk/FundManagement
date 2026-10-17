import { useEffect, useState } from 'react'

// The option chosen for each design decision, kept in this browser only.
const KEY = 'fpb-decision-choices'
const EVENT = 'fpb-choices-changed'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export function useChoices() {
  const [choices, setChoices] = useState(read)
  useEffect(() => {
    const on = () => setChoices(read())
    window.addEventListener(EVENT, on)
    window.addEventListener('storage', on)
    return () => {
      window.removeEventListener(EVENT, on)
      window.removeEventListener('storage', on)
    }
  }, [])
  const choose = (decisionId, option) => {
    const next = { ...read() }
    if (option == null || next[decisionId] === option) delete next[decisionId]
    else next[decisionId] = option
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // Storage unavailable: keep the choice for this session only.
    }
    setChoices(next)
    window.dispatchEvent(new Event(EVENT))
  }
  return [choices, choose]
}
