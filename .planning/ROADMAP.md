# Roadmap: Life Insurance Call Copilot

## Overview

This roadmap builds a real-time AI copilot that listens to live insurance calls and delivers contextual suggestions. The build order prioritizes getting a working end-to-end pipeline as fast as possible: infrastructure scaffolding, then audio capture, then transcription, then the call flow engine, then a visible overlay, then live suggestions -- at which point the copilot is functional for real calls. After that, objection discipline, authentication, data capture, and the self-improving learning loop layer on top of the working foundation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Infrastructure & Project Foundation** - LLM provider abstraction, config system, project scaffolding with Next.js/PostgreSQL/Redis
- [ ] **Phase 2: Audio Capture Pipeline** - Chrome Extension tab audio capture + mic capture streaming to backend via WebSocket
- [ ] **Phase 3: Real-Time Transcription** - Deepgram integration with speaker diarization and transcript storage
- [ ] **Phase 4: Knowledge Base & Call Flow Engine** - 14-angle playbook loaded into pgvector, angle detection, real-time flow position tracking
- [ ] **Phase 5: Overlay UI Shell** - Floating overlay window with live transcript view, repositionable and resizable
- [ ] **Phase 6: Real-Time Suggestions** - Strategy engine generating contextual suggestions displayed in the overlay during live calls
- [ ] **Phase 7: Objection Handling & Flow Discipline** - Objection loop counters with max retries and visual flow position indicator
- [ ] **Phase 8: Authentication & Rep Profiles** - Rep login and individual profile with call history tracking
- [ ] **Phase 9: Data Capture & Call Outcomes** - Comprehensive call data logging: transcripts, suggestion tracking, outcomes, flow history
- [ ] **Phase 10: Post-Call Analysis & Learning Loop** - Self-improving agent with post-call analysis, pattern detection, research, and playbook refinement

## Phase Details

### Phase 1: Infrastructure & Project Foundation
**Goal**: The project has a working development environment with a clean LLM abstraction that any downstream component can call
**Depends on**: Nothing (first phase)
**Requirements**: INF-01, INF-02, INF-03
**Success Criteria** (what must be TRUE):
  1. A Next.js application runs locally with PostgreSQL and Redis accessible via Docker Compose
  2. An LLM call can be made through the provider abstraction and returns a response from Claude
  3. The LLM provider can be switched from Anthropic to OpenRouter via environment variable without code changes
  4. Different inference roles (e.g., "classification" vs "generation") can be configured to use different models
**Plans:** 3 plans
Plans:
- [ ] 01-01-PLAN.md -- Project foundation: Docker services, typed config, DB schema, WebSocket server stub, test infra
- [ ] 01-02-PLAN.md -- LLM provider abstraction: factory, streaming, caching, fallback, tool use
- [ ] 01-03-PLAN.md -- Integration wiring: seed script, health/test endpoints, comprehensive unit tests

### Phase 2: Audio Capture Pipeline
**Goal**: The rep's browser captures both sides of the call audio and streams it to the backend in real-time
**Depends on**: Phase 1
**Requirements**: AUD-01, AUD-02, AUD-03
**Success Criteria** (what must be TRUE):
  1. A Chrome Extension captures RingCentral tab audio without a screen-share popup on each call
  2. The rep's microphone audio is captured via getUserMedia (including Bluetooth headphone routing)
  3. Both audio streams arrive at the backend via WebSocket with under 100ms transport latency
  4. Audio capture works reliably during a 30+ minute session without drops
**Plans**: TBD
**UI hint**: yes

### Phase 3: Real-Time Transcription
**Goal**: Live speech from both the rep and customer is transcribed in real-time with speaker attribution
**Depends on**: Phase 2
**Requirements**: TRX-01, TRX-02, TRX-03
**Success Criteria** (what must be TRUE):
  1. Speech-to-text results appear within 300ms of spoken words via Deepgram streaming
  2. The rep's voice and customer's voice are attributed to distinct speakers in the transcript
  3. A complete transcript with timestamps and speaker labels is stored in the database after the call ends
**Plans**: TBD

### Phase 4: Knowledge Base & Call Flow Engine
**Goal**: The system understands the 14-angle playbook and can detect which angle a call is following and where the rep is in the flow
**Depends on**: Phase 3
**Requirements**: FLW-01, FLW-02, FLW-03
**Success Criteria** (what must be TRUE):
  1. The complete 14-angle playbook is loaded as structured knowledge cards in pgvector and retrievable by semantic search
  2. The system detects the correct angle from the customer's opening statements within the first 30 seconds
  3. The system tracks flow position in real-time (greeting, verification, hold, hook, objection, close, payment, complete) and updates as conversation progresses
**Plans**: TBD

### Phase 5: Overlay UI Shell
**Goal**: The rep has a floating overlay window that shows the live transcript alongside RingCentral
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-05
**Success Criteria** (what must be TRUE):
  1. A floating overlay panel renders on top of the RingCentral browser tab without requiring tab switching
  2. The live transcript scrolls in real-time with speaker labels clearly distinguished
  3. The overlay can be repositioned and resized by the rep to fit their screen layout
**Plans**: TBD
**UI hint**: yes

### Phase 6: Real-Time Suggestions
**Goal**: The rep sees contextual "say now" suggestions during a live call based on flow position and conversation context
**Depends on**: Phase 4, Phase 5
**Requirements**: SUG-01, SUG-02, SUG-03, UI-04
**Success Criteria** (what must be TRUE):
  1. A primary "say now" suggestion appears within 2 seconds of a relevant conversation moment
  2. A backup fallback line is displayed beneath the primary suggestion
  3. A "next question" prompt is displayed to advance the conversation to the next flow stage
  4. The suggestions panel shows say-now, backup, and next-question in a clear visual hierarchy
  5. Suggestions update as the conversation progresses through flow stages
**Plans**: TBD
**UI hint**: yes

### Phase 7: Objection Handling & Flow Discipline
**Goal**: The copilot tracks objection attempts with loop counters and shows the rep where they are in the flow visually
**Depends on**: Phase 6
**Requirements**: FLW-04, UI-03
**Success Criteria** (what must be TRUE):
  1. Objection loop counters track attempt count per objection type (price, think, spouse, callback)
  2. Max retries are enforced (price max 3, think max 2, spouse max 1, callback max 1) and the copilot suggests moving on when maxed out
  3. A visual flow position indicator shows where the rep is in the current angle's sequence
**Plans**: TBD
**UI hint**: yes

### Phase 8: Authentication & Rep Profiles
**Goal**: Individual reps can log in and have their call history tracked to their profile
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. A rep can log in with email and password
  2. Each rep has a profile page showing their individual call history
  3. Rep strengths and weaknesses are tracked based on call outcomes and patterns
**Plans**: TBD
**UI hint**: yes

### Phase 9: Data Capture & Call Outcomes
**Goal**: Every call produces a complete data record capturing what happened, what was suggested, what was said, and the outcome
**Depends on**: Phase 6
**Requirements**: DAT-01, DAT-02, DAT-03, DAT-04
**Success Criteria** (what must be TRUE):
  1. Every call transcript is stored with timestamps, speaker labels, and call metadata
  2. Every suggestion shown is logged alongside what the rep actually said (suggestion-vs-actual)
  3. Call outcome is recorded after each call (closed with option, objection type, callback, graceful exit)
  4. Flow position history is logged per call (which angle, stages hit, where the call stalled)
**Plans**: TBD
**UI hint**: yes

### Phase 10: Post-Call Analysis & Learning Loop
**Goal**: The copilot analyzes every call after it ends, detects patterns across calls, researches improvement techniques, and refines its own playbook
**Depends on**: Phase 9
**Requirements**: LRN-01, LRN-02, LRN-03, LRN-04, LRN-05, AUTH-03, FLW-05
**Success Criteria** (what must be TRUE):
  1. Post-call analysis runs automatically after each call with insights on what worked, what failed, tone, and psychology
  2. Patterns are detected across all reps' calls (e.g., "price objection kills 60% of auto angle calls")
  3. The AI researches sales psychology and persuasion techniques and generates actionable improvement recommendations
  4. When one rep discovers an effective response, it gets surfaced to all reps' suggestions
  5. The agent proposes playbook improvements (new angles, refined scripts, better objection responses) based on accumulated data
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10
Note: Phase 5 depends on Phase 3 (not 4), so Phases 4 and 5 could theoretically overlap, but sequential execution is configured.
Phase 8 depends only on Phase 1, so it could run earlier if needed.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure & Project Foundation | 0/3 | Planning complete | - |
| 2. Audio Capture Pipeline | 0/TBD | Not started | - |
| 3. Real-Time Transcription | 0/TBD | Not started | - |
| 4. Knowledge Base & Call Flow Engine | 0/TBD | Not started | - |
| 5. Overlay UI Shell | 0/TBD | Not started | - |
| 6. Real-Time Suggestions | 0/TBD | Not started | - |
| 7. Objection Handling & Flow Discipline | 0/TBD | Not started | - |
| 8. Authentication & Rep Profiles | 0/TBD | Not started | - |
| 9. Data Capture & Call Outcomes | 0/TBD | Not started | - |
| 10. Post-Call Analysis & Learning Loop | 0/TBD | Not started | - |
