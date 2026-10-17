import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { decisionStore } from './decision-store.mjs'

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'blueprint-decisions-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const filename = join(directory, 'records.json')
  return { filename, store: decisionStore(filename) }
}
const input = { id: 'pmws-1', version: 0, choice: 'Plain browser', status: 'proposed', rationale: 'Start with a browser workspace.', owner: 'Platform owner' }

test('shared records and attributed history persist across store restarts', async t => {
  const { store, filename } = await fixture(t)
  await store.update(input, 'tom1.perry@gmail.com')
  const restarted = decisionStore(filename)
  const first = (await restarted.read()).records[input.id]
  assert.equal(first.updatedBy, 'tom1.perry@gmail.com')
  assert.equal(first.version, 1)
  const second = await restarted.update({ ...input, version: 1, status: 'agreed', rationale: 'Reviewed together; meets the first delivery gate.' }, 'nigel.slinn@gmail.com')
  assert.equal(second.revision, 2)
  assert.deepEqual(second.records[input.id].history.map(r => r.updatedBy), ['tom1.perry@gmail.com', 'nigel.slinn@gmail.com'])
  assert.equal(JSON.parse(await readFile(filename, 'utf8')).records[input.id].status, 'agreed')
})
test('concurrent writes preserve different records and reject stale edits of the same record', async t => {
  const { store } = await fixture(t)
  const results = await Promise.allSettled([store.update(input, 'Tom'), store.update(input, 'Nigel')])
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1)
  assert.equal(results.find(r => r.status === 'rejected').reason.status, 409)
  await Promise.all([store.update({ ...input, version: 1 }, 'Tom'), store.update({ ...input, id: 'pmws-2', choice: 'AG Grid Enterprise' }, 'Nigel')])
  const saved = await store.read()
  assert.equal(saved.revision, 3)
  assert.equal(Object.keys(saved.records).length, 2)
})
test('invalid options, unknown IDs, oversized notes and agreement without rationale are rejected', async t => {
  const { store } = await fixture(t)
  for (const bad of [{ choice: 'Invented' }, { id: '__proto__' }, { rationale: 'x'.repeat(4001) }, { status: 'agreed', rationale: '' }, { status: 'open' }, { version: -1 }, { choice: null, status: 'proposed' }]) {
    await assert.rejects(store.update({ ...input, ...bad }, 'Tom'), { status: 400 })
  }
  assert.equal((await store.read()).revision, 0)
})
test('missing configuration and corrupt stored records fail without replacing durable data', async t => {
  await assert.rejects(decisionStore().read(), { status: 503 })
  const { store, filename } = await fixture(t)
  await writeFile(filename, 'invalid data')
  await assert.rejects(store.update(input, 'Tom'), { status: 503 })
  assert.equal(await readFile(filename, 'utf8'), 'invalid data')
})
