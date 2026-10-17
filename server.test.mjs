import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp, permittedIdentity } from './server.mjs'

const env = {
  PUBLIC_ORIGIN: 'https://fund-platform-blueprint.fly.dev',
  GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
  SESSION_SECRET: 'test-session-secret-with-at-least-forty-three-characters',
}

async function fixture(t, identity = { email: 'tom1.perry@gmail.com', sub: 'google-subject', email_verified: true }, overrides = {}) {
  const distDir = await mkdtemp(join(tmpdir(), 'blueprint-auth-'))
  await mkdir(join(distDir, 'assets'))
  await writeFile(join(distDir, 'index.html'), '<h1>CONFIDENTIAL_ARCHITECTURE</h1>')
  await writeFile(join(distDir, 'assets', 'private.js'), 'const architecture = "CONFIDENTIAL_ARCHITECTURE"')
  let nonce
  let exchanges = 0
  const server = createApp({
    env: { ...env, DECISIONS_FILE: join(distDir, '.shared', 'decisions.json') }, distDir,
    exchangeCode: async () => { exchanges++; return { id_token: 'mock-id-token' } },
    verifyIdentity: async () => ({ ...identity, nonce }),
    ...overrides,
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(async () => {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    await rm(distDir, { recursive: true, force: true })
  })
  const base = `http://127.0.0.1:${server.address().port}`
  const request = (path, options) => fetch(`${base}${path}`, { redirect: 'manual', ...options })
  const begin = async () => {
    const response = await request('/auth/login')
    const url = new URL(response.headers.get('location'))
    nonce = url.searchParams.get('nonce')
    return { response, url, flowCookie: response.headers.getSetCookie()[0].split(';')[0] }
  }
  const signIn = async () => {
    const flow = await begin()
    const response = await request(`/auth/callback?state=${flow.url.searchParams.get('state')}&code=test-code`, { headers: { Cookie: flow.flowCookie } })
    const session = response.headers.getSetCookie().find(value => value.startsWith('__Host-blueprint-session='))?.split(';')[0]
    return { response, session, flow }
  }
  return { request, begin, signIn, get exchanges() { return exchanges } }
}

test('only the two verified Google accounts are permitted', () => {
  for (const email of ['tom1.perry@gmail.com', 'nigel.slinn@gmail.com']) {
    assert.equal(permittedIdentity({ email, sub: 'google-sub', email_verified: true }), true)
    assert.equal(permittedIdentity({ email, sub: 'google-sub', email_verified: false }), false)
  }
  for (const email of ['someone@gmail.com', 'tom1.perry@gmail.com.attacker.example', 'tom1.perry+other@gmail.com', 'nigel.slinn@other.example']) {
    assert.equal(permittedIdentity({ email, sub: 'google-sub', email_verified: true }), false)
  }
  assert.equal(permittedIdentity({ email: 'tom1.perry@gmail.com', email_verified: true }), false)
})

test('anonymous visitors cannot retrieve pages, source, assets, or session data', async t => {
  const app = await fixture(t)
  for (const path of ['/', '/index.html', '/assets/private.js', '/src/data.js', '/.env', '/auth/me']) {
    const response = await app.request(path)
    assert.equal(response.status, 401, path)
    assert.doesNotMatch(await response.text(), /CONFIDENTIAL_ARCHITECTURE/)
    assert.match(response.headers.get('cache-control'), /no-store/)
  }
  const health = await app.request('/healthz')
  assert.equal(health.status, 200)
  assert.equal(await health.text(), 'ok')
})

test('missing configuration and weak session keys fail closed', async t => {
  for (const config of [{}, { ...env, GOOGLE_CLIENT_ID: '' }, { ...env, GOOGLE_CLIENT_SECRET: '' }, { ...env, SESSION_SECRET: 'short' }, { ...env, PUBLIC_ORIGIN: 'http://public.example' }]) {
    const app = await fixture(t, undefined, { env: config })
    for (const path of ['/', '/assets/private.js', '/auth/login']) {
      const response = await app.request(path)
      assert.equal(response.status, 503)
      assert.doesNotMatch(await response.text(), /CONFIDENTIAL_ARCHITECTURE/)
    }
  }
})

test('Google authorization uses fixed callback, minimal scopes, state, nonce and PKCE', async t => {
  const app = await fixture(t)
  const flow = await app.begin()
  assert.equal(flow.response.status, 302)
  assert.equal(flow.url.origin, 'https://accounts.google.com')
  assert.equal(flow.url.searchParams.get('redirect_uri'), `${env.PUBLIC_ORIGIN}/auth/callback`)
  assert.equal(flow.url.searchParams.get('scope'), 'openid email')
  assert.equal(flow.url.searchParams.get('code_challenge_method'), 'S256')
  assert.ok(flow.url.searchParams.get('state').length >= 32)
  assert.ok(flow.url.searchParams.get('nonce').length >= 32)
  const cookie = flow.response.headers.getSetCookie()[0]
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(flag))
})

for (const email of ['tom1.perry@gmail.com', 'nigel.slinn@gmail.com']) {
  test(`${email} receives an authenticated session and protected assets`, async t => {
    const app = await fixture(t, { email, sub: 'google-sub', email_verified: true })
    const { response, session } = await app.signIn()
    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), '/')
    assert.ok(session)
    assert.equal(session.includes(email), false)
    const me = await app.request('/auth/me', { headers: { Cookie: session } })
    assert.equal(me.status, 200)
    assert.equal((await me.json()).email, email)
    const asset = await app.request('/assets/private.js', { headers: { Cookie: session } })
    assert.equal(asset.status, 200)
    assert.match(await asset.text(), /CONFIDENTIAL_ARCHITECTURE/)
    assert.match(asset.headers.get('cache-control'), /no-store/)
    assert.equal((await app.request('/missing.js', { headers: { Cookie: session } })).status, 404)
    assert.equal((await app.request('/%2eenv', { headers: { Cookie: session } })).status, 404)
  })
}

test('other and unverified Google identities receive no access cookie', async t => {
  for (const identity of [{ email: 'someone@gmail.com', sub: 'x', email_verified: true }, { email: 'tom1.perry@gmail.com', sub: 'x', email_verified: false }]) {
    const app = await fixture(t, identity)
    const { response, session } = await app.signIn()
    assert.equal(response.status, 403)
    assert.equal(session, '__Host-blueprint-session=')
    assert.doesNotMatch(await response.text(), /CONFIDENTIAL_ARCHITECTURE/)
  }
})

test('callback rejects absent, mismatched and tampered OAuth state without exchanging a code', async t => {
  const app = await fixture(t)
  const flow = await app.begin()
  for (const headers of [{}, { Cookie: flow.flowCookie }, { Cookie: '__Host-blueprint-flow=forged' }]) {
    const result = await app.request('/auth/callback?state=wrong&code=fake', { headers })
    assert.equal(result.status, 400)
  }
  assert.equal(app.exchanges, 0)
})

test('nonce mismatch and token verification failure cannot establish access', async t => {
  for (const verifyIdentity of [async () => ({ email: 'tom1.perry@gmail.com', sub: 'x', email_verified: true, nonce: 'wrong' }), async () => { throw new Error('Invalid signature') }]) {
    const app = await fixture(t, undefined, { verifyIdentity })
    const { response, session } = await app.signIn()
    assert.equal(response.status, 401)
    assert.equal(session, '__Host-blueprint-session=')
  }
})

test('forged cookies and OAuth flow cookies cannot serve as application sessions', async t => {
  const app = await fixture(t)
  const { session, flow } = await app.signIn()
  const separator = session.indexOf('=')
  const value = session.slice(separator + 1)
  const forged = `${session.slice(0, separator + 1)}${value[0] === 'A' ? 'B' : 'A'}${value.slice(1)}`
  for (const cookie of [forged, `__Host-blueprint-session=${flow.flowCookie.split('=')[1]}`, '__Host-blueprint-session=anything']) {
    assert.equal((await app.request('/assets/private.js', { headers: { Cookie: cookie } })).status, 401)
  }
})

test('logout requires same-origin POST and clears both secure cookies', async t => {
  const app = await fixture(t)
  const { session } = await app.signIn()
  const denied = await app.request('/auth/logout', { method: 'POST', headers: { Cookie: session, Origin: 'https://attacker.example' } })
  assert.equal(denied.status, 403)
  const response = await app.request('/auth/logout', { method: 'POST', headers: { Cookie: session, Origin: env.PUBLIC_ORIGIN } })
  assert.equal(response.status, 200)
  assert.equal(response.headers.getSetCookie().length, 2)
  for (const cookie of response.headers.getSetCookie()) assert.match(cookie, /Max-Age=0/)
})

test('shared decisions require sign-in, enforce origin and share attributed versioned edits between both accounts', async t => {
  const identity = { email: 'tom1.perry@gmail.com', sub: 'tom-sub', email_verified: true }
  const app = await fixture(t, identity)
  for (const method of ['GET', 'PUT']) assert.equal((await app.request('/api/decisions', { method })).status, 401)
  const tom = (await app.signIn()).session
  identity.email = 'nigel.slinn@gmail.com'; identity.sub = 'nigel-sub'
  const nigel = (await app.signIn()).session
  const input = { id: 'pmws-1', version: 0, choice: 'Plain browser', status: 'proposed', rationale: 'Browser first', owner: 'Platform lead', updatedBy: 'attacker@example.com' }
  const update = (cookie, record, origin = env.PUBLIC_ORIGIN) => app.request('/api/decisions', { method: 'PUT', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(record) })
  assert.equal((await update(tom, input, 'https://attacker.example')).status, 403)
  assert.equal((await update(tom, { ...input, choice: 'Invalid' })).status, 400)
  assert.equal((await update(tom, input)).status, 200)
  const shared = await (await app.request('/api/decisions', { headers: { Cookie: nigel } })).json()
  assert.equal(shared.actor, 'nigel.slinn@gmail.com')
  assert.equal(shared.records['pmws-1'].updatedBy, 'tom1.perry@gmail.com')
  assert.equal((await update(nigel, input)).status, 409)
  const agreed = await update(nigel, { ...input, version: 1, status: 'agreed', rationale: 'Reviewed and agreed.' })
  assert.equal(agreed.status, 200)
  assert.equal((await agreed.json()).records['pmws-1'].history[1].updatedBy, 'nigel.slinn@gmail.com')
  const privateFile = await app.request('/.shared/decisions.json', { headers: { Cookie: tom } })
  assert.equal(privateFile.status, 404)
})
