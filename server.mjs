import http from 'node:http'
import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OAuth2Client } from 'google-auth-library'
import { decisionStore, DecisionError } from './decision-store.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
export const ALLOWED_EMAILS = new Set(['tom1.perry@gmail.com', 'nigel.slinn@gmail.com', 'markchesser@outlook.com'])
// Users who may also sign in with a password. The scrypt hash comes from the PASSWORD_HASH secret (see hash-password.mjs).
export const PASSWORD_EMAILS = new Set(['markchesser@outlook.com'])
// Temporary built-in hash so password sign-in works without a Fly secret; a PASSWORD_HASH secret overrides it.
// It is a scrypt hash, not the password. Remove it and set the secret once Fly access is available.
const DEFAULT_PASSWORD_HASH = 'scrypt$PT4aIA5pJyPj9kmijCSBTA$msOMJQHa0mcMoqy4SOTv53ULL5Xrcg5E6juSS8BcWJg'
const MAX_FAILURES = 5
const FAILURE_WINDOW_MS = 15 * 60 * 1000
const SESSION_SECONDS = 8 * 60 * 60
const FLOW_SECONDS = 10 * 60
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }

export function permittedIdentity(payload) {
  return Boolean(payload && typeof payload.sub === 'string' && payload.sub && payload.email_verified === true
    && typeof payload.email === 'string' && ALLOWED_EMAILS.has(payload.email.toLowerCase()))
}

function constantEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

const scryptAsync = (password, salt) => new Promise((ok, fail) => scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 }, (e, k) => e ? fail(e) : ok(k)))

// Stored format: scrypt$<salt base64url>$<hash base64url>
export async function verifyPassword(password, stored) {
  const [kind, salt, hash] = String(stored || '').split('$')
  const expected = Buffer.from(hash || '', 'base64url')
  const actual = await scryptAsync(String(password), Buffer.from(salt || 'x', 'base64url'))
  return kind === 'scrypt' && expected.length === actual.length && timingSafeEqual(expected, actual)
}

function passwordPage(error) {
  return page('Sign in with a password', error || 'Enter the email and password issued by the site owner.', false).replace('</p></main>', `</p><form method="post" action="/auth/password" style="display:grid;gap:12px"><label>Email<br><input name="email" type="email" autocomplete="username" required style="width:100%;box-sizing:border-box;padding:10px"></label><label>Password<br><input name="password" type="password" autocomplete="current-password" required style="width:100%;box-sizing:border-box;padding:10px"></label><button type="submit" style="background:#1961ac;color:white;border:0;padding:12px 20px;border-radius:4px;font-weight:600;cursor:pointer">Sign in</button></form></main>`)
}

function cookieValue(req, name) {
  return req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`))?.slice(name.length + 1)
}

function page(title, message, enabled = true, switchAccount = false) {
  // Only fixed application strings enter this public page; no provider error or query text is rendered.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Private access</title><style>body{margin:0;background:#f3f6fa;color:#16223a;font:16px/1.6 system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}main{background:white;border:1px solid #dde3ec;border-top:4px solid #1961ac;padding:40px;max-width:410px;margin:24px}small{letter-spacing:.12em;text-transform:uppercase;color:#5c6880}h1{font-size:27px;line-height:1.25}p{color:#5c6880}a{display:inline-block;background:#1961ac;color:white;text-decoration:none;padding:12px 20px;border-radius:4px;font-weight:600}a:focus-visible{outline:3px solid #011b4b;outline-offset:4px}</style></head><body><main><small>Hedge Fund Platform Blueprint</small><h1>${title}</h1><p>${message}</p>${enabled ? `<a href="/auth/login">${switchAccount ? 'Choose another Google account' : 'Sign in with Google'}</a><p>Choose the Google account approved by the site owner.</p><p><a href="/auth/password" style="background:none;color:#1961ac;padding:0;text-decoration:underline">Use a password instead</a></p>` : ''}</main></body></html>`
}

export function createApp({ env = process.env, distDir = resolve(ROOT, 'dist'), verifyIdentity, exchangeCode } = {}) {
  const clientId = env.GOOGLE_CLIENT_ID || ''
  const clientSecret = env.GOOGLE_CLIENT_SECRET || ''
  const secret = env.SESSION_SECRET || ''
  let origin
  try {
    const url = new URL(env.PUBLIC_ORIGIN)
    if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error()
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error()
    origin = url.origin
  } catch { origin = null }
  const configured = Boolean(origin && clientId && clientSecret && secret.length >= 43)
  const secure = origin?.startsWith('https:') ?? true
  const sessionCookie = secure ? '__Host-blueprint-session' : 'blueprint-session'
  const flowCookie = secure ? '__Host-blueprint-flow' : 'blueprint-flow'
  const key = createHash('sha256').update(secret).digest()
  const google = new OAuth2Client(clientId)
  const callback = `${origin}/auth/callback`
  const decisions = decisionStore(env.DECISIONS_FILE)
  const passwordHash = env.PASSWORD_HASH || DEFAULT_PASSWORD_HASH
  const failures = new Map() // client address -> timestamps of recent failed password attempts
  const recentFailures = key => {
    const now = Date.now()
    const list = (failures.get(key) || []).filter(t => now - t < FAILURE_WINDOW_MS)
    failures.set(key, list)
    return list
  }

  function seal(data, purpose, ttl) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, iv)
    cipher.setAAD(Buffer.from(purpose))
    const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttl * 1000 }))
    const encrypted = Buffer.concat([cipher.update(body), cipher.final()])
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
  }
  function unseal(value, purpose) {
    try {
      if (!value || value.length > 4096) return null
      const buffer = Buffer.from(value, 'base64url')
      const decipher = createDecipheriv('aes-256-gcm', key, buffer.subarray(0, 12))
      decipher.setAuthTag(buffer.subarray(12, 28))
      decipher.setAAD(Buffer.from(purpose))
      const data = JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString())
      return Number.isFinite(data.exp) && data.exp > Date.now() ? data : null
    } catch { return null }
  }
  function cookie(name, value, maxAge) {
    return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
  }
  function respond(res, status, body, type = 'text/html; charset=utf-8') {
    res.writeHead(status, { 'Content-Type': type })
    res.end(body)
  }
  function redirect(res, path, status = 302) {
    res.writeHead(status, { Location: path })
    res.end()
  }

  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0')
    res.setHeader('Vary', 'Cookie')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    // Native same-origin POST forms need their real Origin for CSRF validation.
    // Suppress referrers to other origins while allowing internal form posts.
    res.setHeader('Referrer-Policy', 'same-origin')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'")
    if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000')
    try {
      const url = new URL(req.url, 'http://internal')
      if (url.pathname === '/healthz' && ['GET', 'HEAD'].includes(req.method)) return respond(res, 200, 'ok', 'text/plain')
      if (!configured) return respond(res, 503, page('Private access', 'Access is locked while Google sign-in is being configured.', false))
      const session = unseal(cookieValue(req, sessionCookie), 'session')
      const authorized = session && permittedIdentity({ ...session, email_verified: true })

      if (url.pathname === '/auth/login' && req.method === 'GET') {
        if (authorized) return redirect(res, '/')
        const state = randomBytes(32).toString('base64url')
        const nonce = randomBytes(32).toString('base64url')
        const verifier = randomBytes(48).toString('base64url')
        res.setHeader('Set-Cookie', cookie(flowCookie, seal({ state, nonce, verifier }, 'oauth', FLOW_SECONDS), FLOW_SECONDS))
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        authUrl.search = new URLSearchParams({ client_id: clientId, redirect_uri: callback, response_type: 'code', scope: 'openid email', state, nonce, prompt: 'select_account', code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' }).toString()
        return redirect(res, authUrl.href)
      }
      if (url.pathname === '/auth/password' && passwordHash) {
        if (req.method === 'GET') return authorized ? redirect(res, '/') : respond(res, 200, passwordPage())
        if (req.method === 'POST') {
          if (req.headers.origin !== origin) return respond(res, 403, 'Forbidden', 'text/plain')
          const client = req.headers['fly-client-ip'] || req.socket.remoteAddress || ''
          if (recentFailures(client).length >= MAX_FAILURES || recentFailures('*').length >= MAX_FAILURES * 4) {
            return respond(res, 429, passwordPage('Too many attempts. Please wait a few minutes and try again.'))
          }
          let size = 0
          const chunks = []
          for await (const chunk of req) {
            size += chunk.length
            if (size > 2048) return respond(res, 413, 'Request too large', 'text/plain')
            chunks.push(chunk)
          }
          const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'))
          const email = String(form.get('email') || '').trim().toLowerCase()
          // Always run the hash so timing does not reveal whether the email is eligible.
          const passwordOk = await verifyPassword(form.get('password') || '', passwordHash).catch(() => false)
          if (!(PASSWORD_EMAILS.has(email) && passwordOk)) {
            recentFailures(client).push(Date.now())
            recentFailures('*').push(Date.now())
            return respond(res, 401, passwordPage('That email or password was not recognised.'))
          }
          failures.delete(client)
          res.setHeader('Set-Cookie', [cookie(flowCookie, '', 0), cookie(sessionCookie, seal({ sub: `password:${email}`, email }, 'session', SESSION_SECONDS), SESSION_SECONDS)])
          return redirect(res, '/', 303)
        }
      }
      if (url.pathname === '/auth/callback' && req.method === 'GET') {
        const flow = unseal(cookieValue(req, flowCookie), 'oauth')
        res.setHeader('Set-Cookie', [cookie(flowCookie, '', 0), cookie(sessionCookie, '', 0)])
        if (!flow || !constantEqual(flow.state, url.searchParams.get('state')) || !url.searchParams.get('code') || url.searchParams.has('error')) {
          return respond(res, 400, page('Sign-in could not be completed', 'Please start again using your permitted Google account.'))
        }
        let payload
        try {
          const tokens = exchangeCode ? await exchangeCode(url.searchParams.get('code'), flow.verifier) : await (async () => {
            const result = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(15000),
              body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: clientId, client_secret: clientSecret, redirect_uri: callback, grant_type: 'authorization_code', code_verifier: flow.verifier }),
            })
            if (!result.ok) throw new Error('Token exchange failed')
            return result.json()
          })()
          if (!tokens.id_token) throw new Error('Missing ID token')
          payload = verifyIdentity ? await verifyIdentity(tokens.id_token) : (await google.verifyIdToken({ idToken: tokens.id_token, audience: clientId })).getPayload()
          if (!constantEqual(payload?.nonce, flow.nonce)) throw new Error('Invalid nonce')
        } catch {
          return respond(res, 401, page('Sign-in could not be verified', 'Please try again. If the problem continues, contact the site owner.'))
        }
        if (!permittedIdentity(payload)) return respond(res, 403, page('Account not permitted', 'This Google account is not on the access list. Choose your approved account or ask the site owner to confirm access.', true, true))
        res.setHeader('Set-Cookie', [cookie(flowCookie, '', 0), cookie(sessionCookie, seal({ sub: payload.sub, email: payload.email.toLowerCase() }, 'session', SESSION_SECONDS), SESSION_SECONDS)])
        return redirect(res, '/')
      }
      if (url.pathname === '/auth/logout' && req.method === 'POST') {
        if (req.headers.origin !== origin) return respond(res, 403, 'Forbidden', 'text/plain')
        res.setHeader('Set-Cookie', [cookie(sessionCookie, '', 0), cookie(flowCookie, '', 0)])
        return redirect(res, '/', 303)
      }
      if (url.pathname.startsWith('/api/')) {
        if (!authorized) return respond(res, 401, JSON.stringify({ error: 'Sign in again to access shared decisions.' }), 'application/json')
        if (url.pathname !== '/api/decisions') return respond(res, 404, JSON.stringify({ error: 'Not found' }), 'application/json')
        try {
          if (req.method === 'GET') return respond(res, 200, JSON.stringify({ ...await decisions.read(), actor: session.email }), 'application/json')
          if (req.method !== 'PUT') return respond(res, 405, JSON.stringify({ error: 'Method not allowed' }), 'application/json')
          if (req.headers.origin !== origin || req.headers['content-type']?.split(';')[0] !== 'application/json') return respond(res, 403, JSON.stringify({ error: 'Request not permitted' }), 'application/json')
          const chunks = []
          let size = 0
          for await (const chunk of req) {
            size += chunk.length
            if (size > 16384) return respond(res, 413, JSON.stringify({ error: 'Decision is too large' }), 'application/json')
            chunks.push(chunk)
          }
          let input
          try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new DecisionError(400, 'Invalid decision record') }
          return respond(res, 200, JSON.stringify({ ...await decisions.update(input, session.email), actor: session.email }), 'application/json')
        } catch (error) {
          return respond(res, error instanceof DecisionError ? error.status : 503, JSON.stringify({ error: error instanceof DecisionError ? error.message : 'Shared decisions could not be saved. Please try again.' }), 'application/json')
        }
      }
      if (!['GET', 'HEAD'].includes(req.method)) return respond(res, 405, 'Method not allowed', 'text/plain')
      if (!authorized) {
        if (url.pathname === '/auth/me') return respond(res, 401, JSON.stringify({ authenticated: false }), 'application/json')
        return respond(res, 401, page('Sign in to continue', 'This blueprint is private. Use a permitted Google account to access it.'))
      }
      if (url.pathname === '/auth/me') return respond(res, 200, JSON.stringify({ authenticated: true, email: session.email, expiresAt: session.exp }), 'application/json')
      // Check authentication BEFORE every file lookup, including JS chunks and CSS.
      let path
      try { path = decodeURIComponent(url.pathname) } catch { return respond(res, 400, 'Bad request', 'text/plain') }
      if (path.includes('\0') || path.includes('\\') || path.split('/').some(part => part.startsWith('.'))) return respond(res, 404, 'Not found', 'text/plain')
      const root = resolve(distDir)
      let filename = resolve(root, `.${path === '/' ? '/index.html' : path}`)
      if (!filename.startsWith(`${root}${sep}`)) return respond(res, 404, 'Not found', 'text/plain')
      try {
        if (!(await stat(filename)).isFile()) throw new Error()
      } catch {
        if (extname(path) || path.startsWith('/assets/') || path.startsWith('/auth/')) return respond(res, 404, 'Not found', 'text/plain')
        filename = resolve(root, 'index.html')
      }
      const body = await readFile(filename)
      res.setHeader('Content-Length', body.length)
      res.writeHead(200, { 'Content-Type': MIME[extname(filename)] || 'application/octet-stream' })
      res.end(req.method === 'HEAD' ? undefined : body)
    } catch {
      // Never log OAuth codes, tokens, cookies, secrets, or provider error responses.
      respond(res, 500, page('Temporarily unavailable', 'Please try again shortly.', false))
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createApp().listen(Number(process.env.PORT || 8080), '0.0.0.0', () => console.log('Protected blueprint server listening'))
}
