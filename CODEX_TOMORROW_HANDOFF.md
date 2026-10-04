# CODEX TOMORROW HANDOFF — ORBITA

Status: **READY FOR NEXT CODEX SESSION**

Hard operational deadline: **14:00 America/Argentina/Buenos_Aires**. Treat **13:30 as feature freeze**.

Read first:
1. `ORBITA_CANON_V0.6.1.md`
2. `README.md`
3. `ARCHITECTURE_HACKATHON.md`
4. `SECURITY_HACKATHON.md`
5. `solana.js`
6. `tests.mjs`
7. `check.mjs`

Do not load large files repeatedly. Use targeted searches and line ranges.

---

## Current production baseline

Repository: `ivancristinisod-lang/ORBITA-APP`

Canonical branch: `main`

Known merge baseline:
`a0ae0a7fa7e61780eaff95381d48fb6be8807923`

Always run `git fetch origin` and resolve the real current `origin/main` before doing any work.

Current product:
- HOY
- PERSONAS
- RED
- DATOS
- goal-first relational intelligence
- explainable opportunity ranking
- deterministic core
- local-first persistence
- Supabase-ready stage gate
- Solana adapter only, no real transaction yet

---

# SESSION A — FINAL ADVERSARIAL QA

Recommended working window: **07:00–09:00**.

Mission: finish reliability work against the merged V0.6.1 before Solana changes begin.

## Scope

Re-run focused adversarial QA against current `main`.

Prioritize:
1. core journey: GOAL → NETWORK → EVIDENCE → OPPORTUNITY → ACTION;
2. RED goal-first navigation;
3. PERSONAS / person detail;
4. CAPTURAR;
5. CRUD person / interaction / commitment / opportunity;
6. persistence / reload;
7. import/export;
8. mobile critical path;
9. keyboard/dialog behavior;
10. no dead Agenda routes or meeting UI;
11. no visible implementation-language regressions;
12. false-positive protection.

Required control cases:
- fundraising goal still produces prepared relevant results;
- unrelated goal such as “Quiero aprender guitarra” produces zero fabricated opportunities.

## Fix policy

Automatically fix only:
- P0;
- P1;
- safe P2 with small blast radius.

Do not redesign.
Do not add features.
Do not begin Solana integration in the QA branch.

Every actual bug fix should have a regression check/test when reasonable.

## Git

Create from current main:
`qa/final-v061`

If no code changes are needed, do not create meaningless commits.

If fixes are needed:
- commit coherent fixes;
- open PR;
- run CI;
- merge only when green and safe.

By **08:45**, stop discovering low-severity issues.
By **09:00**, produce final QA status and leave main stable.

Deliver:
- P0/P1/P2/P3 counts;
- fixes applied;
- final main SHA;
- tests/checks/build;
- remaining known risks.

---

# SESSION B — SOLANA DEVNET INTEGRATION

Target working window: **09:30–13:30**.

Create from the latest green main:
`feat/solana-devnet-attestation`

Mission:

> Turn the existing privacy-minimal Solana adapter into one real, user-signed, verifiable devnet flow without turning ORBITA into a crypto product or publishing private relationship data.

## Product concept

**ORBITA Proof of Introduction**

A user may optionally anchor a manually recorded **Introduction** interaction on Solana.

Private relationship context remains inside ORBITA.

Solana stores only a minimal deterministic proof.

The reason to use Solana is not “because this is a hackathon.” The product value is a portable, independently verifiable, user-signed proof of a relationship event without revealing the private relationship graph.

---

## P0 deliverable — MUST SHIP

A real flow must work:

1. User has a manually recorded interaction of type **Introducción**.
2. User chooses **ANCLAR EN SOLANA**.
3. ORBITA discovers/connects a browser wallet using Wallet Standard.
4. User explicitly approves connection/signature.
5. ORBITA constructs a canonical privacy-minimal claim.
6. ORBITA hashes the claim with SHA-256.
7. ORBITA creates a Memo Program transaction on **devnet**.
8. Wallet signs and submits the transaction.
9. App waits for a real signature / confirmation state.
10. App stores only local attestation metadata needed for verification.
11. UI shows **VER EN EXPLORER** with the real devnet signature.
12. A verification action recomputes/validates the expected memo against Solana RPC or otherwise verifies the submitted transaction reliably.

No fake signatures.
No placeholder Explorer links.
No “success” until a real network result exists.

---

## Canonical claim

Start from existing `canonicalRelationalClaim()`.

Preserve backward compatibility.

The claim should minimally represent:
- protocol;
- version;
- type = introduction;
- actor identifier appropriate for the signed event;
- target local reference;
- event/interaction identifier if required to make repeated events unique.

Prefer adding an optional stable `event_id` rather than redesigning the claim.

The on-chain Memo remains conceptually:

`orbita:v1:introduction:<sha256-digest>`

The wallet address is already observable through transaction signing; do not duplicate sensitive context into the memo.

---

## Data model

Allow an interaction to carry optional attestation metadata, for example:

```js
solanaAttestation: {
  cluster: "devnet",
  signature: "...",
  digest: "...",
  wallet: "...",
  attestedAt: "..."
}
```

Exact naming may change after audit.

Requirements:
- old interactions remain valid;
- normalize/import/export preserve attestation metadata;
- no destructive migration;
- malformed attestation metadata must fail safely;
- never store wallet private material.

---

## UI

Keep the integration subordinate to the relationship product.

Recommended placement:
- interaction/history entry for type “Introducción”;
- optional secondary action in person detail.

States:
- not attested;
- wallet connection required;
- awaiting approval;
- submitting;
- confirming;
- confirmed;
- failed/retryable.

Confirmed state must expose:
- abbreviated signature;
- devnet label;
- Explorer link;
- verify action/status.

Do not add a fifth primary route.
Do not add “Web3 dashboard.”
Do not make wallet connection the first thing a new user sees.

---

## Wallet / SDK implementation

Prefer the current official Solana stack:
- `@solana/kit`;
- Wallet Standard / `@solana/kit-plugin-wallet`;
- `@solana-program/memo`;
- devnet RPC.

The existing app is vanilla JS/static. Do **not** migrate the application to React/Next.js just to integrate Solana.

If package bundling is needed:
- isolate it;
- use the smallest build change possible;
- keep existing static architecture;
- keep `npm run dev`, `npm run build`, and `npm run validate` reliable.

Avoid runtime CDN dependencies unless there is no robust alternative and the decision is documented.

Do not use legacy `@solana/web3.js` by default when the current official Kit path is viable.

---

## Privacy requirements — NON-NEGOTIABLE

Never put on-chain:
- names;
- emails;
- phone numbers;
- notes;
- current goal;
- company;
- relationship text;
- evidence;
- inferred opportunity text;
- private tags.

Before broadcast, have a test/assertion proving the Memo payload contains only the protocol metadata + digest.

---

## Security requirements

- no private key in code, env or repo;
- no server-owned signing key;
- wallet approval must be explicit;
- no automatic transactions;
- RPC failure must not corrupt the interaction;
- rejected wallet signature must produce a normal recoverable state;
- network mismatch must be detected;
- Explorer must be devnet;
- sanitize any external URL rendered.

---

## Tests

Extend automated coverage for:
- canonical claim determinism;
- event uniqueness when event_id is present;
- digest format;
- Memo payload privacy;
- no PII leakage;
- Explorer devnet URL;
- attestation metadata normalization;
- failed/rejected wallet flow;
- confirmed transaction state;
- legacy interactions still normalize;
- existing 18 tests remain green;
- unrelated-goal false-positive test remains green.

Do not replace existing tests with weaker tests.

---

## Time gates

### 09:30–10:00
Audit current main + select exact package/build strategy.

### 10:00–11:15
Implement wallet + devnet Memo transaction path.

### 11:15–11:45
Persist attestation + Explorer UI + verification.

### 11:45–12:15
Tests, privacy review, failure states.

### 12:15
**FEATURE FREEZE.**

If the real devnet transaction is not working by 12:15:
- drop all stretch work;
- solve only the real transaction path;
- do not build a custom Anchor program;
- do not redesign.

### 12:15–12:45
Full `npm run validate`, regression, mobile sanity.

### 12:45–13:00
PR review + CI + preview.

### 13:00–13:20
Real devnet smoke test from production/preview with a real browser wallet.

Record:
- wallet public address;
- real transaction signature;
- Explorer URL;
- timestamp;
- exact user flow used.

Do not commit secrets.

### 13:20–13:30
Merge if and only if:
- real transaction succeeded;
- CI green;
- no P0/P1;
- production deployment is ready.

### 13:30
**CODE FREEZE.**

After 13:30:
submission/demo/readme only.
No feature work unless production is broken.

---

# STRETCH — ONLY AFTER P0 IS GREEN

Do not start before a real devnet Memo transaction exists and the production path is verified.

Possible stretch:
1. RPC re-verification badge;
2. improved transaction receipt UI;
3. second-wallet/countersign concept documentation;
4. custom ORBITA on-chain program spike.

A custom Anchor/Rust program is explicitly **NOT REQUIRED** for the morning objective and must not endanger the working Memo flow.

---

# TOKEN / CONTEXT DISCIPLINE

This deadline is more important than exhaustive exploration.

Use at most 3–4 focused subagents at once.

Suggested:
1. wallet/transaction implementation;
2. data model/tests;
3. security/privacy review;
4. final regression reviewer.

Rules:
- coordinator owns integration;
- subagents research first; avoid concurrent edits to `app.js` / `core.js`;
- use grep/search and line ranges;
- do not reread full `app.js` repeatedly;
- do not paste full build logs into context;
- summarize successful output;
- spend detail only on failures;
- do not ask the user technical questions you can resolve from repo/docs;
- stop low-value refactors;
- no architecture rewrite.

---

# DO NOT DO TOMORROW

- no Agenda resurrection;
- no Gmail/Calendar/LinkedIn/WhatsApp;
- no graph DB/vector DB;
- no generic chatbot;
- no payments/token/NFT;
- no mainnet;
- no custom token;
- no DAO;
- no social feed;
- no Solana branding takeover;
- no React/Next migration;
- no Anchor custom program before the Memo P0 is working;
- no PII on-chain.

---

# DEFINITION OF DONE FOR SOLANA

Solana integration is complete for the hackathon only when all are true:

- browser wallet connects;
- transaction is user-approved;
- transaction is broadcast on devnet;
- real signature exists;
- Explorer link opens that signature;
- only privacy-minimal digest metadata is on-chain;
- app stores the receipt without corrupting relationship data;
- app can verify the attestation;
- failure/rejection paths work;
- automated suite is green;
- deployed application exposes the working flow;
- README explains what is on-chain and what stays private;
- repository never claims more than was actually verified.

---

# FINAL REPORT FORMAT

STATUS:
PROGRESS:
BASELINE_SHA:
FINAL_SHA:
BRANCH:
PR:
MODEL:
SUBAGENTS_USED:
P0/P1/P2:
CHECKS:
TESTS:
BUILD:
VERCEL:
WALLET_STANDARD:
DEVNET_TRANSACTION:
SIGNATURE:
EXPLORER_URL:
PRIVACY_CHECK:
VERIFICATION_STATUS:
KNOWN_RISKS:
READY_TO_MERGE:
READY_TO_SUBMIT:
NEXT_ACTION:
