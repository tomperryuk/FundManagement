import { useEffect, useState } from 'react'
import App from './App.jsx'

// Sign-in is enforced by server.mjs on the deployed site. Local development
// (`npm run dev`) and local previews (`--mode preview`) skip the check; every
// other build keeps it, so a missing flag fails closed.
const AUTH_REQUIRED = import.meta.env.PROD && import.meta.env.MODE !== 'preview'

export default AUTH_REQUIRED ? AccountAccess : App

function AccountAccess() {
  const [account, setAccount] = useState(null)
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    let active = true
    let controller
    const check = async () => {
      controller?.abort()
      controller = new AbortController()
      try {
        const response = await fetch('/auth/me', { cache: 'no-store', signal: controller.signal })
        if (response.status === 401 || response.status === 403 || response.status === 503) {
          window.location.replace('/')
          return
        }
        if (!response.ok) throw new Error()
        const identity = await response.json()
        if (!identity.authenticated || identity.expiresAt <= Date.now()) {
          window.location.replace('/')
          return
        }
        if (active) { setAccount(identity); setUnavailable(false) }
      } catch (error) {
        if (active && error.name !== 'AbortError') { setAccount(null); setUnavailable(true) }
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    const onPage = event => { if (event.persisted) window.location.reload() }
    check()
    const interval = setInterval(check, 60000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPage)
    return () => {
      active = false
      controller?.abort()
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPage)
    }
  }, [])

  if (!account) return <div className="access-status" role="status">
    <p>{unavailable ? 'Access could not be checked. Please reload to try again.' : 'Checking access…'}</p>
    {unavailable && <button onClick={() => window.location.reload()}>Reload</button>}
  </div>
  return <>
    <div className="account-bar">
      <span>Private access · {account.email}</span>
      <form method="post" action="/auth/logout"><button type="submit">Sign out</button></form>
    </div>
    <App />
  </>
}
