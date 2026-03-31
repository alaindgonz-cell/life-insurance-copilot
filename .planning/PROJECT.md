# Life Insurance Call Copilot

## What This Is

A real-time AI copilot that listens to live insurance calls via browser audio capture, tracks where the rep is in a detailed sales flow, and delivers contextual suggestions — what to say next, how to handle objections, and when compliance guardrails apply. It runs as a floating overlay on top of the rep's RingCentral web app. Built for a small team (2-5 reps) selling life insurance policies on inbound service calls.

## Core Value

The rep never freezes on a call — the copilot always knows where they are in the flow and what to say next, increasing service-to-sale conversions while staying compliant.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Live audio capture from browser (mic + tab audio) with bluetooth headphone support
- [ ] Real-time speech-to-text transcription (both sides, diarized)
- [ ] Call flow position tracking across 14 angles (Standard vs Preferred, Term vs Permanent, Loan, Death Claim, New Shopper, Dental/Vision, Auto, Homeowners, 401K, Annuity, Cash-Out Extension, Beneficiary, Annual Review, Maternity/Leave)
- [ ] Contextual "say now" suggestions based on flow position and conversation context
- [ ] Objection detection and handling suggestions with loop counters (max attempts respected)
- [ ] Compliance guardrails (carrier identity, disclosure language, no misleading claims)
- [ ] Floating overlay UI that sits on top of RingCentral
- [ ] Full call transcript logging with timestamps
- [ ] Suggestion-vs-actual tracking (what was suggested vs what rep said)
- [ ] Call outcome recording (closed, objection type, callback, etc.)
- [ ] Post-call analysis by AI — what worked, what didn't, tone and psychology insights
- [ ] Self-improving agent — learns from call patterns, researches sales psychology and persuasion techniques to refine suggestions
- [ ] Knowledge base loaded with the complete call flow/playbook from the Mermaid flowchart

### Out of Scope

- Twilio telephony integration — using browser audio capture instead
- RingCentral API integration — future enhancement after getting API access from boss
- Mobile app — desktop browser only
- Manager dashboard — future enhancement
- Multi-carrier compliance switching — single workflow for now
- Video calls — voice only

## Context

- Reps take inbound service calls (payments, beneficiary changes, billing) via RingCentral web app on desktop with bluetooth headphones
- These service calls are the primary opportunity to review coverage and write new business (service-to-sale transition)
- The call flow has 14 distinct "angles" based on why the customer called, each with its own hook, discovery, and close sequence
- Objection handling follows strict loop counters (e.g., price objection max 3 loops, "need to think" max 2 loops)
- Sales psychology is core — takeaway before application, benefits before price, scarcity/urgency framing, authority positioning
- The "one-time authorization" and "premier series" framing are key persuasion mechanics in the flow
- Critical rules: no approval language until payment, benefits before price always, takeaway before application, medical questions mandatory, three-option close preferred
- The agent must capture enough context on day one (tomorrow) to begin self-improvement — every call is training data
- The AI researches sales psychology, persuasion techniques, tone, and vocabulary to continuously improve suggestion quality

## Constraints

- **Latency**: Suggestions must appear within ~2 seconds of relevant conversation moment — useless if slow
- **Audio**: Browser audio capture (Web Audio API / getDisplayMedia for tab, getUserMedia for mic) — bluetooth headphone routing must work
- **Model**: Claude Opus 4.6 as the single AI model for all inference (intent classification, suggestions, compliance, post-call analysis)
- **Day-one ready**: Must be functional for real calls tomorrow — base model with the full playbook loaded
- **Tech stack**: Next.js (React) frontend, Node.js backend, PostgreSQL + pgvector for knowledge retrieval, Redis for event bus, Deepgram for STT
- **Team size**: 2-5 reps initially, single-user auth sufficient for v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browser audio capture over Twilio | Rep already uses RingCentral in browser; no telephony middleware needed | — Pending |
| Opus 4.6 as single model | Simplicity + maximum quality; optimize for speed/cost later | — Pending |
| Floating overlay UI | Must coexist with RingCentral without switching tabs | — Pending |
| Full playbook as knowledge base | 14-angle flowchart with objection loops is the source of truth | — Pending |
| Self-improving agent from day one | Every call captures data for the learning loop; post-call analysis + research | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 — Phase 1 (Infrastructure & Project Foundation) complete. Dev environment, LLM abstraction, DB schema, and test suite operational.*
