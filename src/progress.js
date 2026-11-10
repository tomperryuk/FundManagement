// Remembers which pages this reader has opened, in this browser only. Storage can be blocked, so every call is guarded.
const KEY = 'fpb-progress'

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return { seen: Array.isArray(v?.seen) ? v.seen.filter(x => typeof x === 'string') : [], last: v?.last && typeof v.last.page === 'string' ? v.last : null }
  } catch { return { seen: [], last: null } }
}

export function getProgress() { return read() }

export function markVisited(pageId, part) {
  const cur = read()
  const seen = cur.seen.includes(pageId) ? cur.seen : [...cur.seen, pageId]
  try { localStorage.setItem(KEY, JSON.stringify({ seen, last: { page: pageId, part: part || null } })) } catch { /* progress is a convenience */ }
  return seen
}

export function clearProgress() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}
