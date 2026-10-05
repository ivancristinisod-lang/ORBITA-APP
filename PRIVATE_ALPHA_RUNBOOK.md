# ORBITA — Private Alpha Runbook

**Target:** V0.7.0-alpha.1  
**Initial cohort:** 2 invited humans  
**Next gates:** 2 → 5 → 10/15  
**Scope:** auth, isolation, persistence, funnel observability, feedback. No product expansion.

## 1. Non-negotiable boundaries

- Private Alpha is invite-only.
- ORBITA product infrastructure must be dedicated to ORBITA.
- Customer Discovery remains a separate evidence source.
- Survey answers are never copied into the product database.
- `survey_response_id` is the only required link to a prior respondent.
- Simulated respondents are never eligible for tester registry import.
- Demo usage must not count as PMF product funnel activity.
- Telemetry must not contain names of contacts, relationship notes, emails, phones, goal text or other relational content.
- Solana is not a Private Alpha blocker.

## 2. Required backend state

Apply, in order, the canonical ORBITA workspace migrations and then:

1. `20261005133000_orbita_private_alpha.sql`
2. `20261005134500_orbita_private_alpha_trigger_hardening.sql`

Expected tables:

- `public.orbita_workspaces`
- `public.orbita_tester_registry`
- `public.orbita_funnel_events`
- `public.orbita_tester_feedback`

Expected private view:

- `private.orbita_private_alpha_funnel`

Expected Auth triggers:

- `orbita_require_private_alpha_invite`
- `orbita_link_private_alpha_user`
- `orbita_mark_tester_inactive_before_auth_delete`

Deploy `supabase/functions/delete-account/index.ts` with JWT verification enabled.

## 3. Auth configuration

Before inviting a tester:

- email/password Auth enabled;
- email confirmation enabled;
- anonymous Auth disabled;
- unused OAuth providers disabled;
- exact production Site URL configured;
- exact production redirect URL configured;
- password policy aligned with ORBITA client baseline;
- leaked-password protection enabled when available;
- no service-role or secret key present in browser/Vercel public build variables.

Signup remains technically available to the app, but the database Auth trigger rejects every email not present in `orbita_tester_registry` with status `invited` (or a recoverable activated row).

## 4. Invite an existing Customer Discovery respondent

Do not re-run the survey. Create only the linkage row.

```sql
insert into public.orbita_tester_registry (
  email,
  display_name,
  survey_response_id,
  source_kind,
  status
) values (
  '<TESTER_EMAIL>',
  '<DISPLAY_NAME>',
  '<EXISTING_RESPONSE_ID>',
  'customer_discovery',
  'invited'
);
```

For a founder self-test use `source_kind='self_test'`. For a new tester with no survey use `source_kind='direct'` and leave `survey_response_id` null.

Never insert synthetic/simulated rows.

## 5. Product runtime configuration

Production/Private Alpha build requires:

```text
ORBITA_ENABLE_CLOUD=true
ORBITA_SUPABASE_URL=https://<DEDICATED_ORBITA_PROJECT>.supabase.co
ORBITA_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ORBITA_APP_URL=https://<PRODUCTION_ORBITA_DOMAIN>
```

The build rejects secret/service-role-shaped browser keys.

## 6. Funnel events

Server-side events:

- `tester_invited`
- `account_created`

Client milestones:

- `first_login`
- `goal_created`
- `first_person_created`
- `third_person_created`
- `first_opportunity_shown`
- `opportunity_opened`
- `opportunity_marked_relevant`
- `action_started`
- `return_session`

Milestone events are de-duplicated where appropriate. Repeated behavioral events remain countable.

### Operator funnel view

```sql
select *
from private.orbita_private_alpha_funnel
order by invited_at;
```

### Raw event audit

```sql
select
  t.display_name,
  t.status,
  e.event_name,
  e.route,
  e.product_version,
  e.created_at
from public.orbita_tester_registry t
left join public.orbita_funnel_events e
  on e.tester_id = t.id
  or (t.auth_user_id is not null and e.user_id = t.auth_user_id)
order by t.display_name, e.created_at;
```

The Supabase table editor/query output is sufficient for initial CSV/JSON export. No analytics vendor is required for this cohort.

## 7. Manual PMF notes

PMF may update only the operator registry, never a tester's relational workspace.

```sql
update public.orbita_tester_registry
set
  status = 'first_value',
  aha_moment = '<OBSERVED_AHA>',
  qualitative_feedback = '<SHORT_NOTE>'
where id = '<TESTER_ID>';
```

Later:

```sql
update public.orbita_tester_registry
set
  status = 'action_taken',
  action_taken = '<ACTION>',
  outcome = '<OUTCOME_IF_KNOWN>'
where id = '<TESTER_ID>';
```

For a blocking issue:

```sql
update public.orbita_tester_registry
set blocking_bug = '<BLOCKER>'
where id = '<TESTER_ID>';
```

## 8. Tester feedback

A small `FEEDBACK` entry is injected below Help for authenticated cloud testers.

It records only:

- Auth user ID;
- current screen;
- timestamp;
- issue type;
- tester message;
- product version;
- viewport;
- online/offline state;
- visible sync-state label.

It must not record workspace content, contact names, goal text, relationship notes or survey answers.

Operator query:

```sql
select
  r.display_name,
  f.screen,
  f.issue_type,
  f.message,
  f.product_version,
  f.technical_context,
  f.created_at
from public.orbita_tester_feedback f
join public.orbita_tester_registry r on r.auth_user_id = f.user_id
order by f.created_at desc;
```

## 9. Cohort-2 QA — mandatory

Use two distinct invited emails and two separate browser profiles/incognito sessions.

### User A

1. create account;
2. confirm email if required;
3. login;
4. create a unique objective;
5. create at least 3 people;
6. create interaction, commitment and opportunity;
7. obtain at least one relational opportunity;
8. open the explanation;
9. mark it relevant;
10. start an action;
11. logout;
12. login again;
13. verify all workspace data persisted;
14. export JSON/CSV.

### User B

Repeat with obviously different dummy/manual content.

### Isolation attack

While logged in as A:

- direct REST reads for `orbita_workspaces` must return only A's row;
- PATCH/DELETE attempts targeting B's `user_id` must affect zero rows / be rejected;
- funnel reads must return only A's events;
- feedback reads must return only A's feedback.

Repeat inversely as B.

**Any cross-user read or write is an immediate P0 / NO-GO.**

## 10. Persistence / recovery QA

For each tester:

- refresh page after write;
- close and reopen browser;
- logout/login;
- open from a second device/browser profile;
- verify cloud workspace wins on a fresh browser;
- create a controlled same-revision conflict and verify ORBITA refuses silent overwrite;
- simulate offline/network failure and verify local snapshot remains recoverable/exportable.

## 11. Account deletion QA

Delete User A from ORBITA UI.

Expected:

- A Auth user removed;
- A workspace removed by cascade;
- A product funnel events removed;
- A feedback removed;
- tester registry row remains for research history, becomes `inactive`, and is unlinked from Auth;
- User B Auth/workspace/events/feedback remain unchanged.

## 12. GO / NO-GO 2 → 5

GO only if both initial testers complete:

`signup/login → objective → people → opportunity → logout/login → persisted data`

And there are zero P0s in:

- Auth;
- user isolation;
- data loss;
- blocking crash.

## 13. GO / NO-GO 5 → 10/15

GO if:

- zero critical Auth/data bugs;
- onboarding completion is observable;
- persistence is stable;
- basic funnel events are present;
- tester drop-off can be identified;
- feedback submission works;
- no evidence of cross-user access.

Visual perfection is not a gate.

## 14. Private Alpha learning question

The primary question is not feature satisfaction.

> Does ORBITA help a tester understand what they want to achieve and which real relationships can move them toward that objective?

The stronger behavioral test is:

> Did ORBITA cause an action that probably would not have happened otherwise?
