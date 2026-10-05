# ORBITA — Project Status

**Product generation:** V0.7  
**Release:** 0.7.0-alpha.1 — Private Alpha Infrastructure  
**Stage:** Private Alpha gate  
**Frontend:** Vercel  
**Backend:** dedicated ORBITA Supabase required  
**Primary user:** founders / entrepreneurs

## V0.7.0-alpha.1 — Private Alpha

### Implemented in code

- [x] invite-only tester registry
- [x] Auth-level invite enforcement via database trigger
- [x] respondent → tester → Auth user linkage without copying survey answers
- [x] simulated respondents excluded from registry source types
- [x] per-user workspace architecture preserved
- [x] RLS / FORCE RLS for product workspace
- [x] RLS / FORCE RLS for funnel events and tester feedback
- [x] funnel events for activation and first value
- [x] demo excluded from PMF product funnel
- [x] operator-only PMF fields in tester registry
- [x] minimal in-product feedback / bug reporting
- [x] account deletion preserves research-level tester row but removes product data
- [x] Private Alpha operator runbook
- [x] Solana not a gate

### P0 before inviting tester #2

- [ ] regain operational access to the dedicated ORBITA Supabase project
- [ ] apply canonical workspace migrations + Private Alpha migrations
- [ ] deploy `delete-account` Edge Function with JWT verification
- [ ] configure Auth Site URL / redirects / email confirmation
- [ ] create the 2 invited tester rows
- [ ] activate cloud stage in Vercel production variables
- [ ] execute real signup/login with both testers
- [ ] execute cross-user RLS attack in both directions
- [ ] execute logout/login persistence test for both testers
- [ ] execute account deletion test without impacting the other tester

## Initial cohort

Private Alpha begins with exactly 2 invited human testers.

Customer Discovery records remain external evidence. Existing respondents do not repeat the survey; `survey_response_id` links the tester registry to the prior response.

No simulated row may be treated as a tester.

## Funnel required from day one

Server-side:

- `tester_invited`
- `account_created`

Client-side:

- `first_login`
- `goal_created`
- `first_person_created`
- `third_person_created`
- `first_opportunity_shown`
- `opportunity_opened`
- `opportunity_marked_relevant`
- `action_started`
- `return_session`

Manual PMF fields:

- `aha_moment`
- `action_taken`
- `outcome`
- `qualitative_feedback`
- `blocking_bug`
- `status`

## GO 2 → 5

GO only if both initial testers complete:

`signup/login → objective → people → opportunity → logout/login → persisted data`

with zero P0 in:

- Auth;
- cross-user isolation;
- data loss;
- blocking crash.

## GO 5 → 10/15

GO when:

- zero critical Auth/data bugs;
- onboarding completion is observable;
- persistence is stable;
- funnel events are present;
- tester drop-off is identifiable;
- feedback works;
- no cross-user access exists.

Visual perfection is not a gate.

## Intentionally deferred

- public signup
- billing
- Gmail / Calendar / LinkedIn / WhatsApp ingestion
- external AI API
- graph/vector DB
- agents
- teams
- realtime
- Solana completion as an Alpha blocker

## Prioridad #1

**Validar si ORBITA ayuda a entender qué quiero lograr y qué relaciones reales pueden moverme hacia ese objetivo — y si provoca una acción que probablemente no habría ocurrido sin ORBITA.**
