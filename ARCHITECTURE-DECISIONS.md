# ORBITA — Architecture Decision Record

This file records foundational decisions so future engineering, security reviews and due-diligence work can distinguish deliberate trade-offs from accidental legacy.

## ADR-001 — Dedicated Supabase project

**Status:** Accepted  
**Decision:** ORBITA uses its own Supabase project in São Paulo for the V0.5 cloud beta.  
**Why:** isolates data/keys/migrations from SØD and other Kadmon projects; lowers blast radius and clarifies ownership/costs.  
**Not permanent:** provider migration remains possible because product domain logic is not coupled to Supabase-specific UI concepts.

## ADR-002 — RLS is the primary multi-user data boundary

**Status:** Accepted  
**Decision:** exposed user tables require RLS + explicit owner policies; ORBITA additionally uses FORCE RLS and revokes `anon` table privileges.  
**Why:** browser clients necessarily hold a public/publishable credential; data authorization must remain server-enforced per user.  
**Review trigger:** any shared workspace/team model requires new policies and tests before release.

## ADR-003 — One JSONB workspace per user for MVP

**Status:** Accepted / intentionally temporary  
**Decision:** manual-first domain is persisted as one JSONB payload per Auth user.  
**Why:** minimizes schema churn while the product model is still changing quickly.  
**Trade-off:** weak for analytics, collaboration, partial writes and large relational graphs.  
**Migration trigger:** demonstrated query/load/collaboration requirements, not speculative scale.

## ADR-004 — Modern publishable key only in browser

**Status:** Accepted  
**Decision:** browser builds accept `sb_publishable_...` only.  
**Why:** prevents accidental deployment of privileged/legacy credentials and makes key intent obvious.  
**Enforcement:** build fails on partial config or secret-shaped keys.

## ADR-005 — Server revision + optimistic concurrency

**Status:** Accepted  
**Decision:** every cloud workspace has a DB-controlled monotonic `revision`; client writes must match the revision they loaded.  
**Why:** silent last-write-wins is unacceptable for relational memory.  
**Current UX:** conflict stops the write and preserves local data for explicit recovery.  
**Future:** per-record/event merge can replace document-level revision when domain normalization occurs.

## ADR-006 — Privileged operations live server-side

**Status:** Accepted / non-negotiable  
**Decision:** operations needing admin/service credentials use authenticated Edge Functions or a future backend; never browser code.  
**First implementation:** `delete-account`.  
**Why:** limits credential exposure and establishes a reusable security boundary.

## ADR-007 — Client-only Auth session is a V0.5 trade-off

**Status:** Accepted with gate  
**Decision:** current static app persists Auth session client-side to preserve zero-backend frontend simplicity.  
**Risk:** XSS has higher impact when tokens are readable by JavaScript.  
**Mitigation now:** restrictive CSP, no third-party scripts, output escaping, limited protocols, no privileged browser key.  
**Mandatory review trigger:** automatic ingestion of email/messaging/social data, major public scale, third-party scripts, enterprise requirements or elevated sensitivity.  
**Likely next architecture:** PKCE/server-assisted auth + Secure/HttpOnly/SameSite cookies.

## ADR-008 — Product version and infrastructure patch are separate

**Status:** Accepted  
**Decision:** security/cloud hardening is `0.5.1`; ORBITA remains product generation V0.5.  
**Why:** roadmap semantics should describe product hypotheses, while semver patches can harden implementation without pretending product scope changed.

## ADR-009 — Manual-first before automatic ingestion

**Status:** Accepted  
**Decision:** Gmail, Calendar, LinkedIn, WhatsApp and similar sources remain deferred.  
**Why:** first learn which information is truly useful and define consent/source/retention rules.  
**Security benefit:** avoids accumulating high-sensitivity data before trust architecture is mature.
