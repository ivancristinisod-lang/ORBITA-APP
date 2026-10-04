# ORBITA CANON — V0.6.1

Status: **ACTIVE / CURRENT SOURCE OF TRUTH**

## Definition

ORBITA is a **relational intelligence agent** for founders and operators. It is not a CRM, social network, lead manager, calendar, or generic chatbot.

## Thesis

> Founders do not necessarily need more contacts. They need intelligence about the network they already built.

ORBITA converts a current goal + recorded relationship context into prioritized, explainable, actionable opportunities.

## Core loop

**GOAL → NETWORK → EVIDENCE → OPPORTUNITY → ACTION**

## Canonical product surfaces

ORBITA has exactly four primary surfaces:

1. **HOY** — current goal, explainable opportunities and what needs attention.
2. **PERSONAS** — relationship context, commitments, opportunities and longitudinal history.
3. **RED** — goal-first relational map. Full-network mode remains secondary.
4. **DATOS** — portability, workspace health, account and advanced controls.

Do not add another primary surface without a demonstrated product need.

## Product rules

- Relationships are not leads.
- The product reasons only over recorded context.
- Never invent a relationship, fact or source.
- Fact and inference must remain visibly distinguishable.
- Zero recommendations is preferable to a fabricated recommendation.
- Goal relevance is contextual; it is not a score of human value.
- The user remains in control of what is stored and acted on.
- Private relationship context remains off-chain.

## Active inputs

Manual-first:
- person;
- interaction;
- commitment;
- opportunity;
- CSV contact import;
- JSON workspace import.

Historical workspaces may still contain `meetings[]`. They remain readable/importable/exportable only for non-destructive backward compatibility and are not an active product surface.

## Active experience

### HOY
The goal is the dominant primitive. The expected journey is:
1. define or see current goal;
2. analyze network;
3. inspect ranked opportunities;
4. inspect evidence and explicit inference;
5. decide next action;
6. review the single priority queue.

### PERSONAS
A person is shown as a relationship with history, not as a CRM record.

### RED
When a current goal exists, RED opens in goal mode by default.
- relevant relationships are emphasized only when supported by evidence;
- irrelevant relationships are visually de-emphasized;
- full network remains available as a secondary view.

### DATOS
Administrative and technical controls live here and do not compete with the core product loop.

## Architecture

Current app:
- vanilla JS / HTML / CSS;
- static Vercel build;
- local-first;
- Supabase-ready behind a stage gate;
- deterministic relational engine in `core.js`;
- privacy-minimal Solana adapter in `solana.js`.

The current production branch is `main`.

## Solana — current state

Current `solana.js` provides:
- canonical relational claim generation;
- SHA-256 hashing;
- privacy-minimal Memo payload construction;
- devnet Explorer URL helpers;
- explicit private/on-chain separation.

It does **not yet** provide:
- wallet discovery/connection;
- transaction signing;
- transaction broadcast;
- transaction confirmation;
- RPC verification of the attestation;
- a user-visible real Explorer transaction.

Never claim those exist until they are implemented and verified.

## Solana — intended product fit

The private relationship graph stays off-chain.

Solana is used only as an optional **portable proof layer** for user-signed relationship events such as an introduction.

The intended value is:
- user-controlled cryptographic proof;
- independent verification;
- portability beyond ORBITA;
- no publication of private relationship data.

On-chain payload must contain no names, emails, phone numbers, notes, founder goals, evidence or relationship context.

## Security

- No private keys in source.
- No service-role or secret credentials in browser.
- Wallet signing must be explicit and user-approved.
- Devnet is the integration target for the hackathon.
- Any transaction must fail safely if wallet/RPC is unavailable.
- No transaction may silently mutate relationship data.
- No PII may be placed in Memo or other on-chain accounts.

## Current release

**V0.6.1 Product Simplification**

Primary navigation:
**HOY / PERSONAS / RED / DATOS**

The next technical milestone is:
**real privacy-minimal Solana devnet attestation with wallet signature + Explorer proof, without disturbing the relational core.**
