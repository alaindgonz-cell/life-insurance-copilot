# Requirements: Life Insurance Call Copilot

**Defined:** 2026-03-26
**Core Value:** The rep never freezes on a call -- the copilot always knows where they are in the flow and what to say next, increasing service-to-sale conversions while staying compliant.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Audio Pipeline

- [ ] **AUD-01**: Chrome Extension captures RingCentral tab audio without requiring a screen-share popup each call
- [ ] **AUD-02**: Browser captures rep's microphone audio via getUserMedia for suggestion-vs-actual tracking
- [ ] **AUD-03**: Audio streams are sent to backend via WebSocket in real-time with < 100ms transport latency

### Transcription

- [ ] **TRX-01**: Real-time speech-to-text via Deepgram with < 300ms transcription latency
- [ ] **TRX-02**: Speaker diarization distinguishes rep voice from customer voice
- [ ] **TRX-03**: Full transcript stored per call with timestamps and speaker labels

### Call Flow Engine

- [ ] **FLW-01**: System loads the complete 14-angle playbook (Standard vs Preferred, Term vs Permanent, Loan, Death Claim, New Shopper, Dental/Vision, Auto, Homeowners, 401K, Annuity, Cash-Out Extension, Beneficiary, Annual Review, Maternity/Leave) as structured knowledge
- [ ] **FLW-02**: System detects which angle applies from the customer's opening statements within the first 30 seconds of conversation
- [ ] **FLW-03**: System tracks flow position in real-time (greeting → verification → hold → hook → objection → close → payment → complete)
- [ ] **FLW-04**: Objection loop counters track attempt count per objection type and enforce max retries (price max 3, think max 2, spouse max 1, callback max 1)
- [ ] **FLW-05**: System can define, refine, and detect new angles over time based on patterns observed across calls

### Suggestions

- [ ] **SUG-01**: "Say now" suggestion displayed based on current flow position and conversation context, updated every few seconds
- [ ] **SUG-02**: Backup line displayed as fallback if primary suggestion doesn't land
- [ ] **SUG-03**: "Next question" prompt displayed to advance the conversation to the next flow stage

### Overlay UI

- [ ] **UI-01**: Floating overlay panel sits on top of RingCentral without requiring tab switching
- [ ] **UI-02**: Live transcript view shows scrolling real-time transcript with speaker labels
- [ ] **UI-03**: Flow position indicator shows where rep is in the current angle's flow visually
- [ ] **UI-04**: Suggestions panel shows say-now, backup, and next-question in a clear hierarchy
- [ ] **UI-05**: Overlay is repositionable and resizable so rep can arrange it alongside RingCentral

### Data Capture

- [ ] **DAT-01**: Every call transcript is stored with timestamps, speaker labels, and call metadata
- [ ] **DAT-02**: Every suggestion shown is logged alongside what the rep actually said (suggestion-vs-actual tracking)
- [ ] **DAT-03**: Call outcome is recorded after each call (closed with option 1/2/3, objection type that killed it, callback scheduled, graceful exit, etc.)
- [ ] **DAT-04**: Flow position history is logged per call (which angle, which stages hit, where call stalled)

### Learning & Self-Improvement

- [ ] **LRN-01**: Post-call analysis runs after each call -- AI analyzes what worked, what didn't, tone effectiveness, and psychology insights
- [ ] **LRN-02**: Pattern detection across all reps' calls identifies trends (e.g., "price objection kills 60% of auto insurance angle calls")
- [ ] **LRN-03**: AI researches sales psychology, persuasion techniques, tone, and vocabulary to generate improvement recommendations
- [ ] **LRN-04**: Learning loop incorporates data from ALL reps -- if one rep finds a killer objection response, it gets surfaced to everyone
- [ ] **LRN-05**: Agent proposes playbook improvements (new angles, refined scripts, better objection responses) based on accumulated call data and research

### Infrastructure

- [x] **INF-01**: LLM provider is abstracted behind a clean interface so the model can be swapped between Anthropic API, OpenRouter, or any OpenAI-compatible API via configuration
- [x] **INF-02**: Model selection is configurable per inference role (e.g., use Opus for suggestions but a different model for post-call analysis) without code changes
- [x] **INF-03**: API keys and provider endpoints are configurable via environment variables or admin settings

### Authentication & Profiles

- [ ] **AUTH-01**: Rep can log in with email and password
- [ ] **AUTH-02**: Rep profile tracks individual call history, strengths, and weaknesses
- [ ] **AUTH-03**: Suggestions are personalized based on rep's historical performance and style

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Compliance

- **COMP-01**: Real-time compliance flags when a disclosure or caution is needed
- **COMP-02**: Deterministic compliance filter between AI output and UI (blocks non-compliant suggestions)
- **COMP-03**: Compliance score per call for audit trail
- **COMP-04**: State-specific compliance rules based on rep's licensed states

### RingCentral Integration

- **RC-01**: RingCentral API integration for programmatic call audio capture (replaces Chrome Extension)
- **RC-02**: Automatic call detection -- copilot activates when call starts, deactivates when call ends

### Team Management

- **TEAM-01**: Manager dashboard with real-time view of active calls
- **TEAM-02**: Team-wide analytics (conversion rates, common objections, top performers)
- **TEAM-03**: Manager can review and approve AI-proposed playbook changes before they go live

### Advanced Learning

- **ADV-01**: Multi-carrier compliance context switching
- **ADV-02**: A/B testing of suggestion strategies across reps
- **ADV-03**: Personalized coaching plans per rep based on weakness patterns

## Out of Scope

| Feature | Reason |
|---------|--------|
| Twilio telephony integration | Using browser audio capture via Chrome Extension instead |
| Mobile app | Desktop browser only -- reps use RingCentral on desktop |
| Video call support | Voice calls only |
| Outbound call initiation | Inbound service calls only for v1 |
| CRM integration | Not needed at 2-5 rep scale |
| Multi-language support | English only |
| Custom model training | Using Claude Opus 4.6 with prompt engineering, not fine-tuned models |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUD-01 | Phase 2 | Pending |
| AUD-02 | Phase 2 | Pending |
| AUD-03 | Phase 2 | Pending |
| TRX-01 | Phase 3 | Pending |
| TRX-02 | Phase 3 | Pending |
| TRX-03 | Phase 3 | Pending |
| FLW-01 | Phase 4 | Pending |
| FLW-02 | Phase 4 | Pending |
| FLW-03 | Phase 4 | Pending |
| FLW-04 | Phase 7 | Pending |
| FLW-05 | Phase 10 | Pending |
| SUG-01 | Phase 6 | Pending |
| SUG-02 | Phase 6 | Pending |
| SUG-03 | Phase 6 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 7 | Pending |
| UI-04 | Phase 6 | Pending |
| UI-05 | Phase 5 | Pending |
| DAT-01 | Phase 9 | Pending |
| DAT-02 | Phase 9 | Pending |
| DAT-03 | Phase 9 | Pending |
| DAT-04 | Phase 9 | Pending |
| LRN-01 | Phase 10 | Pending |
| LRN-02 | Phase 10 | Pending |
| LRN-03 | Phase 10 | Pending |
| LRN-04 | Phase 10 | Pending |
| LRN-05 | Phase 10 | Pending |
| INF-01 | Phase 1 | Complete |
| INF-02 | Phase 1 | Complete |
| INF-03 | Phase 1 | Complete |
| AUTH-01 | Phase 8 | Pending |
| AUTH-02 | Phase 8 | Pending |
| AUTH-03 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation*
