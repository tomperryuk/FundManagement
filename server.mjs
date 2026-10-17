import http from 'node:http'
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OAuth2Client } from 'google-auth-library'

const ROOT = dirname(fileURLToPath(import.meta.url))
export const ALLOWED_EMAILS = new Set(['tom1.perry@gmail.com', 'nigel.slinn@gmail.com'])
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

function cookieValue(req, name) {
  return req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`))?.slice(name.length + 1)
}

function page(title, message, enabled = true) {
  // Only fixed application strings enter this public page; no provider error or query text is rendered.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Private access</title><style>body{margin:0;background:#f3f6fa;color:#16223a;font:16px/1.6 system-ui,sans-serif;display:grid;min-height:100vh;place-items:center}main{background:white;border:1px solid #dde3ec;border-top:4px solid #1961ac;padding:40px;max-width:410px;margin:24px}small{letter-spacing:.12em;text-transform:uppercase;color:#5c6880}h1{font-size:27px;line-height:1.25}p{color:#5c6880}a{display:inline-block;background:#1961ac;color:white;text-decoration:none;padding:12px 20px;border-radius:4px;font-weight:600}a:focus-visible{outline:3px solid #011b4b;outline-offset:4px}</style></head><body><main><small>Hedge Fund Platform Blueprint</small><h1>${title}</h1><p>${message}</p>${enabled ? '<a href="/auth/login">Sign in with Google</a>' : ''}</main></body></html>`
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
  function redirect(res, path) {
    res.writeHead(302, { Location: path })
    res.end()
  }

  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0')
    res.setHeader('Vary', 'Cookie')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
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
        if (!permittedIdentity(payload)) return respond(res, 403, page('Access denied', 'This Google account does not have access. Sign in with a permitted account.'))
        res.setHeader('Set-Cookie', [cookie(flowCookie, '', 0), cookie(sessionCookie, seal({ sub: payload.sub, email: payload.email.toLowerCase() }, 'session', SESSION_SECONDS), SESSION_SECONDS)])
        return redirect(res, '/')
      }
      if (url.pathname === '/auth/logout' && req.method === 'POST') {
        if (req.headers.origin !== origin) return respond(res, 403, 'Forbidden', 'text/plain')
        res.setHeader('Set-Cookie', [cookie(sessionCookie, '', 0), cookie(flowCookie, '', 0)])
        return respond(res, 200, page('Signed out', 'Your session has ended.'))
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
