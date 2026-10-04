# Changelog

## 0.6.0 — Relational experience upgrade

- Rebuilt HOY around the current goal, explainable ranking and a prioritized attention queue.
- Made the #1 opportunity visually dominant while preserving deterministic ranking and false-positive protection.
- Reworked the evidence drawer so factual evidence, inference and next action have explicit semantic separation.
- Simplified PERSONAS into a scannable relationship list and moved edit mechanics into secondary detail flows.
- Rebuilt person detail as a longitudinal relationship story: Ahora → Contexto → Compromisos → Oportunidades → Historia.
- Added RED modes “Mi red” and “Por objetivo”; irrelevant nodes are visually de-emphasized without inventing graph edges.
- Reframed AGENDA as relational preparation first, calendar second; mobile is list-first.
- Simplified DATOS into Mi información, Sistema, Cuenta and Avanzado.
- Reworked CAPTURAR around the prompt “¿Qué pasó?” while keeping existing structured CRUD.
- Reduced onboarding to promise → identity → current goal.
- Added the V0.6 editorial visual system, responsive composition and reduced-motion handling.
- Kept core relational logic, persistence, auth/cloud architecture and Solana scope unchanged.
- Added V0.6 validation assertions and dedicated experience documentation.

## 0.5.2 — Local Alpha stage gate

- Default runtime is now LOCAL ALPHA; incomplete backend configuration can no longer break production.
- Cloud activation now requires the explicit `ORBITA_ENABLE_CLOUD=true` stage gate.
- Production app URL can be inferred by Vercel when cloud is eventually enabled.
- Reframed the access shell as a Functional Alpha entrance instead of a backend error state.
- Preserved Auth/cloud adapters for later integration without blocking the frontend.
- Added `PRODUCT-STAGE.md` to define the transition from productized prototype to Functional Alpha / Pre-MVP.

## 0.5.1 — Security & cloud hardening

> Sigue siendo la generación de producto V0.5. Este release endurece infraestructura y confiabilidad sin ampliar el scope funcional principal.

- Provisioned dedicated ORBITA Supabase project in São Paulo.
- Applied RLS + FORCE RLS and revoked anonymous table access.
- Added explicit rejection of anonymous Auth users in workspace policies.
- Added least-privilege column grants.
- Added server-controlled timestamps, payload schema version and monotonic revision.
- Replaced silent last-write-wins cloud updates with optimistic concurrency conflict detection.
- Fixed a fresh-browser data-loss edge case where an empty normalized cache could appear newer than an existing cloud workspace.
- Added authenticated `delete-account` Edge Function; privileged Auth deletion stays server-side.
- Added client + documented server password baseline (12+, lower/upper/number/symbol).
- Restricted CSP `connect-src` to the exact ORBITA Supabase project.
- Added stronger privacy/cross-origin response headers and no-store runtime config.
- Versioned the real Supabase migration history in the repository.
- Expanded security documentation and production activation checklist.

## 0.5.0 — Auth, onboarding & audit

- Added optional Supabase Auth: signup, login, recovery, password update, logout and refresh.
- Added explicit local development mode when cloud config is absent.
- Added per-user local cache namespace.
- Added Supabase workspace persistence and RLS schema.
- Added cloud sync state and manual sync.
- Added 4-step onboarding.
- Added contextual help on every canonical route.
- Added workspace audit and automatic structural repair.
- Added profile goals and default cadence.
- Added CSP and stronger security headers.
- Added build-time Vercel env configuration.
- Added data migration path from V0.4 local store.
- Removed misleading estimated “recoverable hours”.
- Changed relational pulse to a factual in-cadence percentage.
- Renamed ambiguous network metrics to factual terminology.
- Expanded checks/tests to cover auth/cloud/audit architecture.

## 0.4.0 — Readability & editing

- Larger typography and container calibration.
- Expanded demo to 16 contacts.
- Full editing affordances.
- Agenda Day/Week/Month navigation.
- Fixed missing Day renderer and interaction paths.

## 0.3.0 — Visual direction

- Adopted black / acid yellow / cobalt / ivory / orange system.
- Established 01–05 canonical product surfaces.
