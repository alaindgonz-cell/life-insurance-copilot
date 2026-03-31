# Project Research Summary

**Project:** Life Insurance Call Copilot
**Domain:** Real-time AI-assisted sales copilot (voice, insurance-specific)
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

The Life Insurance Call Copilot is a real-time AI overlay that listens to live insurance sales calls, tracks the conversation through a 14-angle flowchart playbook, and surfaces contextual suggestions to reps within a 2-second latency budget. This is a well-understood product category -- Balto, Observe.AI, Aircover, and others have established the pattern of real-time agent assist -- but this project differentiates through deep insurance-domain specialization (14 distinct call flows), sales psychology coaching, objection loop discipline, and a self-improving learning loop. The technology stack for building this is mature and well-documented.

The recommended approach is a Next.js 15 application with a pipeline architecture: browser audio capture (mic + tab audio merged into 2-channel PCM) streams through a WebSocket gateway to Deepgram Nova-3 for speech-to-text, then fans out via Redis Pub/Sub to parallel processing stages (intent classification via Claude Haiku 4.5, knowledge card retrieval via pgvector, call state tracking), which converge at a Claude Opus 4.6 strategy engine that generates suggestions filtered through a deterministic compliance guardrail. The overlay UI runs as a separate browser window positioned alongside RingCentral. This architecture keeps end-to-end latency within the 2-second budget while maintaining clean component boundaries for iterative development.

The primary risks are: (1) browser audio capture UX friction from the `getDisplayMedia` tab-sharing permission dialog -- mitigated by designing a clear pre-call onboarding flow and potentially graduating to a Chrome extension later; (2) Claude Opus latency exceeding the 2-second budget -- mitigated by a two-tier LLM strategy (Haiku for classification, Opus for generation) with aggressive prompt caching; (3) compliance violations in AI-generated suggestions -- mitigated by a mandatory deterministic compliance filter between Claude output and the UI, with immutable rules that the self-improving agent can never modify; and (4) Deepgram misrecognizing insurance terminology -- mitigated by keyterm prompting with a domain-specific vocabulary list. All four risks are well-understood and have proven mitigation strategies.

## Key Findings

### Recommended Stack

The stack centers on Next.js 15 LTS (stable, production-proven) with TypeScript, Deepgram Nova-3 for real-time streaming STT, Claude Opus 4.6 (with Haiku 4.5 for fast classification), PostgreSQL 16 with pgvector for unified relational + vector storage, Redis 7 for Pub/Sub event bus and session caching, and raw `ws` WebSockets for low-overhead binary audio streaming.

**Core technologies:**
- **Next.js 15 LTS + React 19:** Full-stack framework with API routes and App Router. LTS guarantees stability; Next.js 16 is too fresh.
- **Deepgram Nova-3:** Sub-300ms streaming STT with multichannel support. Best-in-class for real-time call transcription. Use `multichannel=true` for deterministic speaker attribution.
- **Claude Opus 4.6 + Haiku 4.5:** Two-tier LLM strategy. Opus for strategy/suggestion generation (~500-1500ms), Haiku for intent classification (~50-100ms). Prompt caching on the system prompt drops cost by 90% and latency by 85%.
- **PostgreSQL 16 + pgvector 0.8.2:** Single database for relational data and vector similarity search. HNSW indexes for sub-10ms nearest-neighbor queries on knowledge cards.
- **Drizzle ORM:** First-class pgvector support (native vector types, distance functions, index definitions). Prisma still requires raw SQL for vectors.
- **Redis 7 + ioredis:** Pub/Sub event bus for decoupling pipeline stages. Session state caching for active calls. Sub-millisecond routing.
- **ws (WebSocket):** Raw WebSocket library for binary audio streaming. Socket.IO adds unnecessary overhead for this use case.

**Critical version requirements:** Node.js 20 LTS, pnpm 9.x, Docker Compose for local dev (PostgreSQL, Redis).

### Expected Features

**Must have (table stakes):**
- Real-time dual-channel speech-to-text (rep + customer)
- Live "say this now" contextual suggestions within 2 seconds
- 14-angle call flow position tracking (visual progress indicator)
- Objection detection and handling suggestions
- Compliance guardrails and alerts (mandatory disclosures, no approval language before payment)
- Floating overlay UI (non-intrusive, always visible alongside RingCentral)
- Full call transcript with timestamps
- Post-call summary generation
- Call outcome recording

**Should have (differentiators):**
- Objection loop counters with max attempts (prevents rep from hammering same objection)
- Benefits-before-price enforcement
- Three-option close prompting and one-time authorization framing
- Sales psychology coaching (takeaway, scarcity, authority positioning)
- Suggestion-vs-actual tracking (training signal for self-improvement)
- Post-call psychology and tone analysis

**Defer (v2+):**
- Self-improving agent (requires accumulated call data from phases 1-2)
- Manager dashboard (team is 2-5 reps; build when team grows)
- CRM integration (no specific CRM identified yet)
- AI roleplay/simulation training (separate product)
- Multi-language support (English only)
- Call recording/audio storage (store transcripts only)

### Architecture Approach

The architecture follows a pipeline-per-event pattern with Redis Pub/Sub decoupling five processing stages that run in parallel. Browser audio capture merges mic and tab audio into 2-channel PCM via Web Audio API, streams to a backend Audio Gateway that proxies to Deepgram, and transcript events fan out to parallel consumers (state tracker, intent classifier, card retriever) that feed the strategy engine. A compliance guardrail sits between the strategy engine output and the browser overlay. Post-call analysis runs asynchronously and feeds a learning loop that updates knowledge cards in pgvector.

**Major components:**
1. **Audio Capture (Browser)** -- 2-channel PCM via Web Audio API (getUserMedia + getDisplayMedia), streamed over binary WebSocket
2. **Audio Gateway (Backend)** -- WebSocket proxy to Deepgram, keeps API keys server-side
3. **Event Bus (Redis Pub/Sub)** -- Decouples STT output from pipeline stages, enables parallel processing
4. **Pipeline Stages** -- Call State Tracker, Intent Classifier (Haiku), Script Card Retriever (pgvector), Strategy Engine (Opus), Compliance Guardrail
5. **Overlay UI (React)** -- Floating browser window with suggestion cards, flow position indicator, objection counters
6. **Post-Call Learning Loop** -- Async analysis, pattern mining, knowledge card updates (Phase 5)

**Key architectural decisions:**
- Multichannel audio (not diarization) for deterministic speaker attribution
- Two separate WebSocket connections: binary upstream (audio), JSON downstream (events)
- Sliding window + session summary to keep LLM context under 2000 tokens
- Debounced inference triggering (500ms after last final transcript) to prevent API overload
- Separate browser window for overlay (not Chrome extension) for faster iteration on day one

### Critical Pitfalls

1. **Browser audio capture requires tab-sharing permission dialog** -- `getDisplayMedia` forces a screen-share picker every session. Design a clear pre-call onboarding flow. Start with separate browser window; graduate to Chrome extension (`chrome.tabCapture`) later if UX friction is too high.
2. **Claude Opus latency blows the 2-second budget** -- Opus alone takes 4-8 seconds for complex reasoning. Use Haiku for classification, Opus only for suggestion generation. Enable streaming, prompt caching, and aggressive `max_tokens` limits (50-100 tokens for real-time suggestions).
3. **Compliance violations in AI suggestions** -- LLMs optimize for persuasiveness, not regulatory compliance. Build a deterministic compliance filter (allowlist/blocklist) between Claude output and the UI. Hard-code immutable rules. Never let the self-improving agent modify compliance constraints.
4. **Deepgram misrecognizes insurance terminology** -- Use keyterm prompting (up to 100 terms, 90% recall improvement). Build a domain vocabulary list covering carrier names, product names, policy number patterns, and compliance phrases.
5. **WebSocket drops during long calls (30-60+ minutes)** -- Implement application-level heartbeats every 25 seconds (in a Web Worker to avoid tab throttling), automatic reconnection with state recovery, and a connection status indicator in the overlay.

## Implications for Roadmap

Based on research, the architecture has a clear dependency chain that dictates phase ordering. Each phase produces a testable artifact consumed by the next.

### Phase 1: Audio Pipeline and Live Transcription
**Rationale:** Everything downstream depends on having transcripts. This is the critical foundation with the most technical risk (browser audio capture, Bluetooth edge cases, Deepgram integration).
**Delivers:** Working audio capture from mic + tab audio, merged into 2-channel stream, streamed to Deepgram, with live transcript displayed in a basic UI.
**Addresses:** Real-time STT (table stakes), browser audio capture, WebSocket infrastructure
**Avoids:** Audio capture architecture mistakes (Pitfall 1), Bluetooth degradation (Pitfall 2), WebSocket drops (Pitfall 7)

### Phase 2: Knowledge Base, Call State, and Intent Pipeline
**Rationale:** The strategy engine needs both knowledge cards and call state context to generate useful suggestions. These are independent of each other but both depend on transcripts from Phase 1.
**Delivers:** Searchable playbook in pgvector, 14-angle call flow position tracking, intent classification, Redis event bus wiring.
**Addresses:** 14-angle flow engine (differentiator), call flow position tracking (table stakes), knowledge card retrieval
**Avoids:** STT terminology misrecognition (Pitfall 3) via keyterm prompting setup

### Phase 3: Strategy Engine, Compliance, and Overlay UI
**Rationale:** This is the core value delivery -- suggestions appearing on screen during a live call. Requires all prior phases. The compliance guardrail is a hard prerequisite before any suggestion reaches a rep.
**Delivers:** Live contextual suggestions during real calls, compliance-filtered, displayed in a floating overlay alongside RingCentral.
**Addresses:** "Say this now" suggestions (table stakes), objection detection/handling (table stakes), compliance guardrails (table stakes), floating overlay UI (table stakes)
**Avoids:** Opus latency failures (Pitfall 4), compliance violations (Pitfall 5)

### Phase 4: Enhanced Coaching and Post-Call Features
**Rationale:** With a working copilot, add the differentiating features that make it insurance-specific and start capturing the data needed for self-improvement.
**Delivers:** Objection loop counters, benefits-before-price enforcement, close prompting, post-call summaries, call outcome recording, suggestion-vs-actual tracking.
**Addresses:** Objection loop counters (differentiator), benefits-before-price (differentiator), three-option close (differentiator), post-call summary (table stakes), call outcome recording (table stakes), suggestion tracking (differentiator)
**Avoids:** Technical debt from deferred features by building them on a stable foundation

### Phase 5: Self-Improving Learning Loop
**Rationale:** The crown jewel, but requires accumulated call data from Phases 1-4. Building this without data is premature. The compliance envelope must be thoroughly tested before any autonomous learning begins.
**Delivers:** Post-call psychology analysis, pattern mining across calls, automated knowledge card refinement, self-improving suggestion quality.
**Addresses:** Self-improving agent (differentiator), post-call psychology analysis (differentiator), sales psychology coaching (differentiator)
**Avoids:** Agent drift toward manipulative/non-compliant patterns (Pitfall 6) via bounded learning constraints and immutable compliance envelope

### Phase Ordering Rationale

- **Dependency-driven:** Each phase produces artifacts the next phase consumes (transcripts -> knowledge + state -> suggestions -> coaching data -> learning loop)
- **Risk-front-loaded:** The highest-risk technical work (audio capture, latency budget) is in Phase 1 where failure is cheapest to recover from
- **Value-incremental:** Phase 1 alone provides live transcription (useful). Phase 3 delivers the core product (suggestions during calls). Phases 4-5 are additive improvements.
- **Data-first:** Transcript logging and suggestion tracking begin in early phases so the learning loop in Phase 5 has material to work with from day one

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Browser audio capture edge cases need hands-on prototyping with actual hardware (Bluetooth headsets, RingCentral tab). The `getDisplayMedia` permission UX must be validated with non-technical users.
- **Phase 2:** Chunking strategy for the 14-angle Mermaid flowchart playbook into knowledge cards needs experimentation. Embedding model selection (OpenAI vs Voyage AI) needs benchmarking.
- **Phase 5:** Self-improving agent guardrails, drift detection metrics, and bounded learning constraints are not fully specified. This is novel territory with limited production references.

Phases with standard patterns (skip deep research):
- **Phase 3:** Strategy engine + compliance filter is a well-documented pattern (prompt engineering + rule-based filtering). WebSocket push to React is standard.
- **Phase 4:** Enhanced coaching features are template-driven extensions of Phase 3 patterns. Post-call summary is a straightforward Opus batch call.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified with official docs, npm download counts, and version recency. Deepgram, Anthropic, pgvector all have mature SDKs. |
| Features | HIGH | Competitor analysis covers 10+ products. Feature categorization (table stakes vs differentiators) is well-grounded in market reality. |
| Architecture | HIGH | Pipeline pattern verified with multiple real-time AI references. Latency budget validated component-by-component. Multichannel audio approach confirmed by Deepgram docs. |
| Pitfalls | HIGH (technical) / MEDIUM (regulatory) | Browser audio, WebSocket, and STT pitfalls verified with official docs and issue trackers. Insurance compliance landscape is evolving (NAIC model bulletin, Colorado AI Act). |

**Overall confidence:** HIGH

### Gaps to Address

- **Embedding model selection:** Anthropic does not offer embeddings. Must choose between OpenAI `text-embedding-3-small` and Voyage AI. Benchmark during Phase 2 knowledge base setup.
- **Playbook chunking strategy:** The 14-angle Mermaid flowchart must be decomposed into embeddable knowledge cards. No research was done on optimal chunk size or structure. Address during Phase 2 planning.
- **Chrome extension migration path:** Day-one architecture uses `getDisplayMedia` with separate browser window. If the permission UX proves too disruptive, migrating to a Chrome extension with `chrome.tabCapture` is a significant rearchitecture. Validate the `getDisplayMedia` UX early in Phase 1 to decide.
- **State-specific insurance compliance rules:** Research identified federal/NAIC-level compliance concerns but did not enumerate state-specific requirements. The compliance filter needs state-aware rules as the product expands.
- **Cost modeling at scale:** Per-call cost estimated at ~$1 (Haiku + Opus). Needs validation with real call lengths and inference frequencies. Budget for 2-5 concurrent reps is manageable but should be monitored.
- **Tiered model strategy vs project constraint:** The project specifies Opus as the single AI model, but research strongly recommends Haiku for classification. Architecture should abstract LLM calls behind a provider interface so either approach works. Validate Opus-only latency in Phase 1.

## Sources

### Primary (HIGH confidence)
- Deepgram: Multichannel vs Diarization, Keyterm Prompting, Streaming Latency, Nova-3 SDK
- Anthropic: Prompt Caching, Latency Reduction, Claude SDK
- MDN: getDisplayMedia, Screen Capture API, Web Audio API
- pgvector: GitHub, Release Notes (0.8.2), HNSW documentation
- Drizzle ORM: pgvector Guide, npm package
- Next.js: 15.5 LTS Release Notes

### Secondary (MEDIUM confidence)
- Balto, Observe.AI, Aircover, Cogito, Gong: Product pages and feature documentation (competitor analysis)
- Chrome tabCapture API documentation
- WebSocket keepalive and reconnection patterns
- NAIC AI Model Bulletin, Colorado AI Act
- Redis Pub/Sub patterns for real-time AI pipelines

### Tertiary (LOW confidence)
- Self-improving agent architectures (OpenAI cookbook, community references) -- novel territory, limited production case studies
- Insurance regulatory specifics beyond federal/NAIC level -- rapidly evolving

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
