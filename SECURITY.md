# ORBITA — Security Baseline V0.5.1

**Product generation:** V0.5  
**Security patch:** 0.5.1  
**Supabase region:** São Paulo (`sa-east-1`)  
**Principle:** relational data is sensitive by default. Security and portability are product requirements, not cleanup work.

## Baseline already implemented

### Database isolation

- `public.orbita_workspaces` is keyed by `auth.users.id`.
- `ON DELETE CASCADE` removes the workspace when its Auth user is deleted.
- Row Level Security is **enabled and forced**.
- `anon` has no SELECT/INSERT/UPDATE/DELETE privileges.
- Only `authenticated` receives the minimum required privileges.
- RLS policies permit SELECT/INSERT/UPDATE/DELETE only when `auth.uid() = user_id`.
- Auth users marked `is_anonymous=true` are explicitly rejected by policy even though Supabase maps anonymous Auth sessions to the `authenticated` database role.
- The client may update only the `workspace` column. `user_id`, revision, payload schema version and server timestamps are not client-writable.

### Concurrency / data integrity

- `revision` is monotonic and server-controlled.
- `created_at` and `updated_at` are server-controlled.
- Cloud writes use optimistic concurrency (`user_id + revision`).
- If another device has advanced the revision, ORBITA refuses to overwrite it silently and exposes a **CONFLICTO** state.
- A fresh browser with no local cache always trusts an existing cloud workspace; an empty normalized local store cannot overwrite cloud data just because its timestamp is newer.

### Privileged operations

- Browser code uses only the Supabase **publishable key** plus the signed-in user's JWT.
- `sb_secret_*` / `service_role` credentials are forbidden from browser source and checked automatically.
- Account deletion is implemented through the authenticated Supabase Edge Function `delete-account`.
- The Edge Function validates the caller, confirmation phrase, HTTP method and allowed origin before invoking the privileged Admin API server-side.
- Secret/service credentials remain in Supabase-managed server environment only.

### Browser / delivery hardening

- CSP limits network calls to the exact ORBITA Supabase project.
- Framing is blocked.
- `nosniff` enabled.
- Referrer policy is `no-referrer`.
- Camera, microphone and geolocation are disabled.
- Cross-origin resource isolation headers are set where compatible.
- `/config.js` is served `no-store` to reduce stale environment configuration after key rotation.
- User-provided content is escaped before HTML rendering.
- External URLs accept only HTTP/HTTPS.
- Imports are normalized/audited before replacing the workspace.
- CSV output is protected against spreadsheet formula injection.

## Verification performed on the real Supabase project

- Security Advisor: **0 findings** after migrations.
- Performance Advisor: **0 findings** after RLS optimization.
- `RLS = true` and `FORCE RLS = true` verified from PostgreSQL catalogs.
- `anon` SELECT/INSERT privileges: **false**.
- Four owner-scoped RLS policies verified.
- Migration history is stored under `supabase/migrations/`.

## Known security boundary in V0.5

### Auth tokens currently use localStorage

This client-only architecture persists the Supabase access/refresh session in `localStorage`. Strict CSP and output escaping reduce XSS surface, but localStorage is not equivalent to an HttpOnly cookie.

**Gate:** before ORBITA automatically ingests especially sensitive third-party sources (mail, messaging, social accounts) or before a larger public rollout, migrate Auth to a server-assisted PKCE/cookie architecture with HttpOnly/Secure/SameSite cookies and CSRF-aware flows.

This is a planned security gate, not accepted as permanent architecture.

### JSONB workspace

One JSONB document per user is appropriate for the current manual-first MVP. It keeps migrations small and preserves product velocity. It is not intended to remain the final storage model for collaborative workspaces, large graphs, analytics or high-write concurrency.

**Migration trigger:** normalize the domain when real usage demonstrates query, collaboration, volume or event-history requirements.

## Manual controls required before public beta

These cannot be safely inferred or provisioned without external account decisions/credentials:

1. Enable MFA/2FA for the Supabase organization owner and GitHub/Vercel administrative accounts.
2. Keep email confirmation enabled.
3. Configure server-side password requirements to match the client baseline: 12+ chars, lower/upper/number/symbol.
4. Keep anonymous Auth, phone Auth and unused OAuth providers disabled.
5. Set exact Auth Site URL and Redirect URLs; avoid permissive production wildcards.
6. Set OTP/link expiry to 3600 seconds or less.
7. Configure custom SMTP before a public launch.
8. Add Cloudflare Turnstile or hCaptcha before opening unrestricted signup.
9. Review Auth rate limits before campaigns or launch spikes.
10. When moving to a paid tier, define backup/PITR RPO/RTO and a staging strategy before migrations that affect user data.

## Incident rule

If a secret key is ever exposed, do not merely hide the file: identify the exposure path, rotate/revoke the credential, redeploy every dependent server component, review logs/advisors and document the incident.

## Non-negotiable rule

**Never solve a product problem by moving a privileged credential into the browser.** Any operation requiring elevated rights must live behind an authenticated server/Edge Function with explicit authorization.
