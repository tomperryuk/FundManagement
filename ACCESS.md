# Private Google access

The production Node server protects the application page and **every built asset**. Only Google-verified identities for `tom1.perry@gmail.com` and `nigel.slinn@gmail.com` are admitted, plus `markchesser@outlook.com`, who may sign in with Google or with a password. The allowlist is enforced on the server in `server.mjs`.

Without complete OAuth and session configuration the server returns a locked page (HTTP 503), never the architecture content. `/healthz` returns only `ok` for Fly health checks. Do not deploy `dist` to a public static host or CDN; deploy the supplied Dockerfile.

## One-time Google setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project that you control.
2. Open **Google Auth Platform**. Configure branding with an application name, support email and developer contact. Choose **External** audience because these are personal Gmail accounts. While the app is in testing, add both allowed addresses as test users.
3. Create an OAuth client with application type **Web application**. Set this exact **Authorized redirect URI**:

   `https://fund-platform-blueprint.fly.dev/auth/callback`

   The server requests only `openid email`. It does not request Gmail, Drive or other Google API access. No browser JavaScript origin is required for this server authorization-code flow. For local use, add `http://localhost:8080/auth/callback` as an additional redirect URI.
4. Copy the client ID and client secret into Fly secrets from your own terminal. Do not put them in chat, source files or any `VITE_` variable. The following commands prompt for them without putting their values in shell history:

   ```zsh
   read -r "blueprint_client_id?Google client ID: "
   read -rs "blueprint_client_secret?Google client secret: "
   printf '\n'
   {
     printf 'GOOGLE_CLIENT_ID=%s\n' "$blueprint_client_id"
     printf 'GOOGLE_CLIENT_SECRET=%s\n' "$blueprint_client_secret"
   } | flyctl secrets import --app fund-platform-blueprint
   unset blueprint_client_id blueprint_client_secret
   ```

   `SESSION_SECRET` is a separate random server secret. If it has not already been configured, create it once without printing it:

   ```sh
   python3 -c 'import secrets; print("SESSION_SECRET=" + secrets.token_hex(32))' | flyctl secrets import --app fund-platform-blueprint
   ```

5. Visit [the private site](https://fund-platform-blueprint.fly.dev/), sign in as one permitted user, and confirm the other permitted user can also sign in. A third Google account must receive Access denied. Until the Google client is configured, the site remains locked.

The callback address must match exactly. If the domain changes, update `PUBLIC_ORIGIN` in Fly and add the new exact callback in Google first. Rotating `SESSION_SECRET` invalidates all existing sessions.

## Running locally

Requires Node 22 or newer.

```sh
npm ci
npm run dev        # Vite dev server with live reload; no sign-in
npm run preview    # local production-style build (--mode preview); no sign-in
```

Local development and local previews skip the in-app access check. Every other build keeps it, and the deployed site is always protected by `server.mjs`.

To test the real Google sign-in locally, copy `.env.example` to `.env`, configure the Google client and a random session secret, add `http://localhost:8080/auth/callback` as a redirect URI, and run `npm run dev:auth`. `npm start` serves the built app through authentication, as Fly does. `.env` is excluded from Git and Docker. Do not deploy `dist` to a public static host.

## Security and verification

Google authorization uses state, nonce and PKCE. The server exchanges the one-time code, then uses Google's official authentication library to verify the ID token's signature, issuer, audience and expiry. A verified Google email must match the two-address allowlist exactly (case-insensitive). ID and access tokens are not stored in the browser or retained after login.

Sessions use authenticated encryption with purpose separation, eight-hour expiry, and Secure / HttpOnly / SameSite cookies in production. All responses disable shared and browser disk caching. Logout requires a same-origin POST, clears both session and OAuth-flow cookies, and returns a 303 redirect to the sign-in page. The `same-origin` referrer policy allows native internal form submissions to carry the Origin required by CSRF checks while suppressing cross-origin referrers. Public sign-in pages do not name the invited users. The app rechecks the session on visibility changes and periodically while open. HTTPS is enforced by Fly. The server never logs OAuth codes, tokens, cookies, secrets or provider response bodies.

Run `npm test` for access-control, callback, allowlist, cookie, missing-configuration and protected-asset checks. Tests mock the Google exchange and verifier; a real Google login requires the configured OAuth client and an interactive browser check.

Reference: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect) and [server verification guidance](https://developers.google.com/identity/sign-in/web/backend-auth).

## Shared decisions

The authenticated `/api/decisions` service stores component, organisation and optional extension choices on the encrypted Fly volume `blueprint_decisions` at `/data/decisions/records.json`. Both permitted users see the same records. Each edit retains its owner, rationale, status, timestamp, editor and previous versions. Agreement requires a rationale; a selection starts as under review. Record version checks reject stale edits with HTTP 409 so a reviewer can reload before saving. Reads and writes require the same Google session as the application; writes also require the site's exact Origin and JSON content type. All API responses are private and no-store.

The application uses one writer process and one mounted volume. Keep the Fly app at one machine while using this store; adding independent volumes would split records. Atomic writes, file and directory syncing protect completed updates across process restarts. Scheduled Fly volume snapshots retain recovery points for 14 days; use the register's JSON download for an additional export. A volume or host outage can still make shared decisions unavailable until recovery. Move to a managed database before adding multiple application machines.

For a new Fly installation create the encrypted 1 GB volume in `lhr` before deployment:

```sh
flyctl volumes create blueprint_decisions --app fund-platform-blueprint --region lhr --size 1 --snapshot-retention 14 --yes
```

The entrypoint creates a private subdirectory on the root-owned mount and drops to the `node` user before serving requests. The API fails closed for editing when storage configuration is missing or the stored document cannot be read.

Local Vite development uses clearly labelled browser-only preview records and never writes to production decisions. Existing browser-only selections from the previous release can be reviewed individually in the decision editor before saving them to the shared register. Production shared records require an explicit save; old browser selections are not automatically promoted into shared decisions.

## Password sign-in (markchesser@outlook.com)

`/auth/password` accepts an email and password for `markchesser@outlook.com` only. A temporary built-in hash (`DEFAULT_PASSWORD_HASH` in `server.mjs`) is used until the `PASSWORD_HASH` secret overrides it; remove the built-in value once the secret is set. The secret holds a scrypt hash, never the password. To set or rotate it, choose a password of at least 12 characters and run from your own terminal:

```sh
printf 'PASSWORD_HASH=%s\n' "$(node hash-password.mjs)" | flyctl secrets import --app fund-platform-blueprint
```

Type the password, then press Ctrl-D. Failed attempts are limited to 5 per client per 15 minutes and 20 in total; the check works on a single machine, as the decision store does. Share the password through a private channel and rotate it if it leaks. Sessions last eight hours.
