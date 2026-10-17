import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { decisionCatalogue } from './src/decisionCatalogue.js'

const catalogue = new Map(decisionCatalogue.map(d => [d.id, d]))
export class DecisionError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

// One process owns the mounted volume. Each write is serialized and atomically
// replaces the document; both record versions and the durable history survive deploys.
export function decisionStore(filename) {
  let pending = Promise.resolve()
  const read = async () => {
    if (!filename) throw new DecisionError(503, 'Shared decisions are not configured.')
    try {
      const value = JSON.parse(await readFile(filename, 'utf8'))
      if (!Number.isInteger(value.revision) || value.revision < 0 || !value.records || typeof value.records !== 'object' || Array.isArray(value.records)) throw new Error()
      return value
    } catch (error) {
      if (error.code === 'ENOENT') return { revision: 0, records: {} }
      throw new DecisionError(503, 'Shared decisions could not be loaded. Please try again.')
    }
  }
  return {
    read,
    update(input, actor) {
      const action = pending.then(async () => {
        const d = catalogue.get(input?.id)
        if (!d || !Number.isInteger(input.version) || input.version < 0
          || (input.choice !== null && !d.options.some(o => o.name === input.choice))
          || !['open', 'proposed', 'agreed'].includes(input.status)
          || typeof input.rationale !== 'string' || input.rationale.length > 4000
          || typeof input.owner !== 'string' || input.owner.length > 120
          || (input.choice === null ? input.status !== 'open' : input.status === 'open')
          || (input.status === 'agreed' && !input.rationale.trim())) {
          throw new DecisionError(400, 'Select a valid option and status. Agreed decisions need a rationale.')
        }
        const state = await read()
        const previous = state.records[input.id]
        if ((previous?.version || 0) !== input.version) throw new DecisionError(409, 'This decision changed. Reload the latest record before saving again.')
        const entry = {
          choice: input.choice, status: input.status, rationale: input.rationale.trim(), owner: input.owner.trim() || actor,
          updatedBy: actor, updatedAt: new Date().toISOString(), version: input.version + 1,
        }
        state.records[input.id] = { ...entry, history: [...(previous?.history || []), entry] }
        state.revision++
        await mkdir(dirname(filename), { recursive: true })
        const temporary = `${filename}.${randomUUID()}.tmp`
        try {
          const file = await open(temporary, 'wx', 0o600)
          try { await file.writeFile(JSON.stringify(state)); await file.sync() } finally { await file.close() }
          await rename(temporary, filename)
          const directory = await open(dirname(filename), 'r')
          try { await directory.sync() } finally { await directory.close() }
        } finally { await unlink(temporary).catch(() => {}) }
        return state
      })
      pending = action.catch(() => {})
      return action
    },
  }
}
