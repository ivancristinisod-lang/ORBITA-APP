# ORBITA — Private Alpha Prelaunch Audit

**Audit date:** 2026-10-06  
**Baseline:** `main@118469ec23d483b50f06786bfcbfee40a50232db`  
**Target:** initial cohort of 2 invited human testers, then gated expansion to 5 and 10–15.  
**Scope:** Auth, isolation, persistence, PMF observability, support, tester protocol. No product expansion.

## Executive verdict

**NO-GO for tester #2 until dedicated ORBITA Supabase is operational and real two-user QA passes.**

The codebase is prepared for the Private Alpha gate and current CI is green. The remaining blocker is operational infrastructure verification, not a missing product feature. Do not substitute another project's Supabase resources.

## Evidence status

| Area | Status | Evidence / remaining proof |
|---|---|---|
| Canonical product loop | PASS (code) | Goal-first HOY + relational opportunity engine remain in main. |
| Four canonical surfaces | PASS (code) | HOY / PERSONAS / RED / DATOS. |
| Auth adapter | PASS (code) | Signup, login, logout, refresh, recovery and password update implemented. |
| Session persistence | PASS (code) / NOT TESTED real | Browser session storage/refresh logic exists; requires real Supabase Auth session. |
| Per-user local cache | PASS (code) | Local workspace and sync metadata are scoped by Auth user id. |
| Cloud workspace | PASS (code) / BLOCKED operationally | REST adapter and optimistic revision checks exist; dedicated backend not accessible to current connector. |
| Fresh-browser protection | PASS (code) | Existing cloud workspace wins when browser has no trusted local snapshot. |
| Concurrent edit protection | PASS (code) | Revision-filtered PATCH refuses silent overwrite. |
| Workspace RLS | PASS (schema) / NOT TESTED adversarially | RLS + FORCE RLS and owner policies exist in repo; A/B attack requires live backend. |
| Invite-only | PASS (migration) / NOT TESTED real | Auth trigger rejects non-invited emails in migration. |
| Tester registry | PASS (migration) | Separate registry links optional `survey_response_id` without copying survey answers. |
| Simulated evidence boundary | PASS (schema) | Registry source kinds allow customer_discovery/self_test/direct only. |
| Funnel telemetry | PASS (code/schema) / NOT TESTED real | Required milestones implemented; real inserts require cloud. |
| Demo separation | PASS (code) | PMF workspace mode is scoped per authenticated user and demo suppresses product milestones. |
| Feedback | PASS (code/schema) / NOT TESTED real | Minimal feedback form + non-sensitive technical context. |
| Account deletion | PASS (code/schema) / NOT TESTED real | Server-side delete path exists; Edge Function deployment and cascade behavior need live verification. |
| Export | PASS (code) / browser QA pending | JSON and CSV export actions remain present. |
| Current GitHub CI | PASS | Main validation workflow completed successfully for baseline commit. |
| Vercel cloud env | BLOCKED | `orbita-app` currently exposes no project env vars to the connected Vercel account. |
| Dedicated ORBITA Supabase | BLOCKED | Current Supabase connector does not expose an ORBITA project. Do not use any non-ORBITA project. |
| Real two-user QA | NOT TESTED | Must be performed after backend activation. |

## Code review findings

### P0

No new code-only P0 was verified in this audit. This does **not** prove multi-user safety: RLS, Auth, persistence and deletion still require live adversarial testing against the dedicated ORBITA backend.

### P1

1. Real Auth redirects, confirmation email and recovery flow remain unverified against production configuration.
2. Real Edge Function deployment for `delete-account` remains unverified.
3. Vercel cloud variables are not configured, so production cannot yet operate as the intended cloud Private Alpha.
4. Browser/device persistence has not been executed with two real Auth users.

### P2 / intentionally deferred

AI expansion, Solana completion, billing, Gmail, Calendar, LinkedIn, WhatsApp, graph/vector DB, teams, agents and visual redesign are not Private Alpha gates.

## Customer Discovery linkage

The canonical Customer Discovery spreadsheet contains a real human response for the planned tester and a separate sheet explicitly labeled for simulations. The tester has an existing stable response ID. At activation time, copy only that identifier into `survey_response_id`; do not copy survey answers into ORBITA product tables and do not create a duplicate survey response.

No tester PII or Customer Discovery answers should be committed to this public repository.

## Cohort-2 QA matrix

Run the complete flow independently as User A and User B:

1. invited email accepted; non-invited control email rejected;
2. signup and email confirmation;
3. login;
4. create current goal;
5. create first person;
6. create third person;
7. create interaction;
8. create commitment;
9. create opportunity;
10. obtain first relational opportunity;
11. open evidence/explanation;
12. mark opportunity relevant;
13. start an action;
14. refresh;
15. logout/login;
16. verify persisted workspace;
17. open from fresh browser/profile;
18. export JSON and CSV;
19. submit feedback;
20. controlled account deletion.

### A/B isolation attack

While authenticated as A, directly attempt to SELECT, UPDATE and DELETE B's workspace and read B's funnel/feedback. Repeat B→A.

Expected result: **zero cross-user rows visible or mutable**. Any cross-user read/write is P0 and immediate NO-GO.

## Recovery matrix

Verify:

- refresh after write;
- browser close/reopen;
- logout/login;
- fresh browser;
- second device/profile;
- temporary offline state;
- failed network request during sync;
- same-revision conflict;
- export before destructive operation;
- cloud workspace is never silently replaced by an empty fresh-browser workspace.

## PMF operating board

Canonical states:

`surveyed → qualified → invited → activated → first_value → action_taken → retained / inactive`

Required automatic events:

`tester_invited`, `account_created`, `first_login`, `goal_created`, `first_person_created`, `third_person_created`, `first_opportunity_shown`, `opportunity_opened`, `opportunity_marked_relevant`, `action_started`, `return_session`.

Manual PMF fields:

`aha_moment`, `action_taken`, `outcome`, `qualitative_feedback`, `blocking_bug`, `status`.

The operator should answer for each tester: where they stopped, whether they reached first value, whether an opportunity was opened/relevant, whether an action started, whether they returned, what blocked them, and whether the real-world action probably would have happened without ORBITA.

## Tester session protocol

Do not turn the Alpha into a guided demo. Give only the minimum framing: ORBITA tries to help the tester understand what they want to achieve and which real relationships may help them move toward it.

Observe before intervening. Record hesitation, attempted clicks, expectations, spontaneous understanding, first useful opportunity and action intent. Intervene only for a genuine technical blocker or after the usability evidence has been captured.

Closing questions:

1. ¿Qué entendiste que hace ORBITA?
2. ¿Qué fue lo más útil?
3. ¿Dónde no supiste qué hacer?
4. ¿Alguna oportunidad mostró algo que no estabas considerando?
5. ¿Harías alguna acción después de esta sesión? ¿Cuál?
6. ¿Esa acción probablemente habría ocurrido igual sin ORBITA?
7. ¿Para qué volverías a abrir ORBITA esta semana?
8. Si no pudieras volver a usarla, ¿qué extrañarías?

## Mechanical activation sequence

Once the dedicated ORBITA Supabase is accessible:

1. verify ownership and project identity;
2. audit live schema before writes;
3. compare live schema to repo migrations;
4. apply only missing canonical migrations;
5. verify RLS + FORCE RLS;
6. verify invite-only Auth trigger;
7. deploy `delete-account` with JWT verification;
8. run security and performance advisors;
9. resolve relevant P0 findings;
10. create exactly two human tester registry rows;
11. link the existing Customer Discovery respondent by stable response ID only;
12. obtain project URL + modern publishable key;
13. configure Vercel ORBITA cloud env vars;
14. enable cloud stage;
15. redeploy and verify build;
16. execute User A flow;
17. execute User B flow;
18. execute A↔B isolation attack;
19. execute persistence/recovery matrix;
20. verify feedback and funnel;
21. execute controlled deletion without affecting the other user;
22. issue GO/NO-GO 2→5.

## GO 2 → 5

GO only when both humans complete:

`signup/login → objective → people → opportunity → logout/login → persisted data`

and there are zero P0 bugs in Auth, isolation, data loss or blocking crashes.

## GO 5 → 10/15

GO when there are zero critical Auth/data bugs, onboarding and drop-off are observable, persistence is stable, funnel events exist, feedback works and no cross-user access is observed. Visual perfection is not a gate.

## Product-learning criterion

Primary question:

> Does ORBITA help the tester understand what they want to achieve and which real relationships can move them toward that objective?

Strongest behavioral test:

> Did ORBITA cause an action that probably would not have happened otherwise?
