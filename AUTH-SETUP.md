# ORBITA V0.5 — Auth & Cloud Activation

The Supabase backend already exists and the database security baseline has already been applied.

## Provisioned infrastructure

- Project: **ORBITA**
- Region: **São Paulo (`sa-east-1`)**
- API URL: `https://tbxrglthrieafejxjecm.supabase.co`
- Database: `public.orbita_workspaces`
- Edge Function: `delete-account`
- RLS: enabled + forced
- Security Advisor: 0 findings after hardening
- Performance Advisor: 0 findings after hardening

Do **not** run the old SQL manually against this project. The applied production migrations are recorded under `supabase/migrations/`. `supabase/schema.sql` is the canonical fresh-install snapshot.

## Manual step 1 — Vercel environment variables

In **Vercel → orbita → Settings → Environment Variables**, add these to **Production**:

```text
ORBITA_SUPABASE_URL=https://tbxrglthrieafejxjecm.supabase.co
ORBITA_SUPABASE_PUBLISHABLE_KEY=<default publishable key from Supabase → Connect / API Keys>
ORBITA_APP_URL=https://orbita-ten-khaki.vercel.app
```

Use the modern `sb_publishable_...` key. Do not use a secret key or `service_role`.

After saving, redeploy `main`. The generated `/config.js` should no longer contain `__ORBITA_*__` placeholders.

## Manual step 2 — Supabase Auth URL Configuration

In **Supabase → ORBITA → Authentication → URL Configuration**:

```text
Site URL
https://orbita-ten-khaki.vercel.app

Redirect URL
https://orbita-ten-khaki.vercel.app
```

For now, keep production exact. Add preview URLs only when we deliberately create a staging auth strategy; do not use a broad production wildcard for convenience.

## Manual step 3 — Email/password security

In **Authentication → Providers → Email** verify:

- Email/password enabled.
- Email confirmation enabled.
- Minimum password length: **12**.
- Require lower + upper + number + symbol if the dashboard exposes the option.
- Anonymous sign-in: **OFF**.
- Phone sign-in: OFF until product needs it.
- OAuth providers: OFF until explicitly implemented and reviewed.

The frontend already rejects weak new passwords, but server-side enforcement is the real security boundary.

## Manual step 4 — Auth lifetime / abuse baseline

Before external beta:

- OTP / email-link expiry: **≤ 3600 seconds**.
- Review Auth rate limits.
- Configure **custom SMTP** from a domain we control.
- Configure **Cloudflare Turnstile** or hCaptcha for signup/login/recovery.
- Enable MFA/2FA on the Supabase organization owner account and administrative GitHub/Vercel accounts.

Leaked-password protection is a paid-plan capability; record it as an upgrade control rather than pretending it exists on Free.

## What becomes functional after steps 1–3

- Signup.
- Email confirmation.
- Login.
- Refresh session.
- Password recovery.
- Password update.
- Logout.
- Per-user cloud workspace.
- Local cache scoped by user.
- Optimistic-concurrency sync.
- Account + workspace deletion through the authenticated Edge Function.

## Cloud verification checklist

After redeploy:

1. Open ORBITA in a private browser window.
2. Confirm the login screen no longer says `AUTH CLOUD NO CONFIGURADO`.
3. Create a test account.
4. Confirm email.
5. Complete onboarding and add one person.
6. Reload and verify persistence.
7. Sign out and sign back in; verify data returns.
8. Open a second browser/device and verify cloud load.
9. Modify the same account from two devices to confirm a stale write shows `CONFLICTO` instead of overwriting silently.
10. Create a second test account and confirm it cannot see the first account's data.

Do not test `Eliminar cuenta cloud` with the only account whose data you want to keep; use a disposable test account first.
