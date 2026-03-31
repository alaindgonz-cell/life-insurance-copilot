# Feature Landscape

**Domain:** Real-time AI call copilot for life insurance sales
**Researched:** 2026-03-26

## Table Stakes

Features users expect from a real-time call copilot. Missing any of these and the product feels broken or unusable compared to what Balto, Observe.AI, and Aircover already ship.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Real-time speech-to-text transcription (both sides) | Every competitor does this. Balto, Observe.AI, Cogito all transcribe live. Without it, the copilot is blind. | High | Deepgram handles this. Must be dual-channel with diarization (rep vs customer). Bluetooth headphone routing is a specific risk. |
| Live "say this now" suggestions | Core value prop of Balto and Aircover. The copilot must surface contextual prompts in real-time based on conversation state. | High | Must appear within ~2s of trigger moment. Latency is the make-or-break metric. |
| Call flow position tracking | Balto uses "Agile Checklists" that track conversation milestones. Observe.AI tracks intent. The rep needs to see where they are in the flow at all times. | Medium | 14 angles is unique to this project. Visual progress indicator showing current stage in the angle-specific flow. |
| Objection detection and handling suggestions | Every serious competitor (Balto, Aircover, Convin) surfaces objection-handling prompts. Without this, the copilot fails at the hardest moments. | High | Must detect objection type (price, timing, spouse, etc.) and surface the right counter from the playbook. |
| Compliance guardrails and alerts | Balto's compliance monitoring, Gryphon AI's audit-ready records, JackBurton.ai's Medicare compliance -- regulated industries demand this. Insurance has mandatory disclosures. | Medium | Carrier identity rules, no approval language before payment, mandatory medical questions, disclosure language. Alert when rep is about to violate. |
| Floating overlay UI | The rep cannot switch tabs during a live call. Aircover and Balto both overlay on top of the rep's existing tools. | Medium | Chrome extension or Electron overlay on top of RingCentral. Must be non-intrusive but always visible. |
| Full call transcript with timestamps | Every competitor stores transcripts. Required for post-call review, compliance audit trail, and training data. | Low | Automatic, tied to Deepgram output. Store in PostgreSQL with timestamps. |
| Post-call summary generation | Balto, Observe.AI, Chorus, and Aircover all auto-generate call summaries. Reps expect this -- it eliminates after-call work. | Low | Claude generates summary from transcript. Include outcome, key topics, next steps. |
| Call outcome recording | Basic CRM hygiene. Every platform tracks whether the call resulted in a sale, callback, objection type, etc. | Low | Simple form or auto-detected from transcript. Essential for the self-improvement loop. |

## Differentiators

Features that set this copilot apart from Balto, Observe.AI, and other enterprise platforms. These are not expected but create significant competitive advantage, especially for a small insurance team.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 14-angle flow engine with dynamic routing | No competitor handles 14 distinct call types with angle-specific flows. Balto uses generic checklists. This copilot knows the exact script path for a Death Claim vs a 401K rollover vs a New Shopper. | High | The Mermaid flowchart is the source of truth. Must detect which angle applies (from customer's reason for calling) and track position within that specific flow. This is THE core differentiator. |
| Objection loop counters with max attempts | No competitor tracks "you've tried the price objection 2 of 3 times, switch to takeaway." Balto suggests objection responses but doesn't enforce loop discipline. | Medium | Track per-objection-type attempt count. When max reached, suggest alternative approach or graceful exit. Prevents reps from hammering the same objection handle. |
| Sales psychology coaching (takeaway, scarcity, authority) | Enterprise tools focus on compliance and process. This copilot actively coaches persuasion technique -- when to use takeaway before application, how to frame scarcity/urgency, authority positioning. | Medium | Embed psychology principles into suggestion generation. "Do the takeaway NOW -- pull back before they commit." Not just what to say, but WHY (the psychology). |
| Self-improving agent that learns from real calls | Nooks and Gong analyze calls post-hoc. This copilot actively researches sales psychology and refines its own suggestion quality based on what worked vs what didn't on real calls. | Very High | Requires: suggestion-vs-actual tracking, outcome correlation, periodic AI research cycles that update the knowledge base. The AI doesn't just replay the playbook -- it evolves it. |
| Suggestion-vs-actual tracking | No competitor explicitly tracks "we suggested X, rep said Y, outcome was Z." This creates the training signal for self-improvement. | Medium | Compare suggested text to actual rep speech (semantic similarity, not exact match). Correlate with call outcomes over time. |
| Post-call psychology and tone analysis | Cogito does emotion/sentiment scoring. This goes deeper -- analyzing persuasion technique effectiveness, tone patterns that correlate with closes, vocabulary choices that work. | High | AI reviews the full transcript with a psychology lens. "Your authority positioning was strong in minute 3 but you lost frame at minute 7 when the customer pushed back on price." |
| Benefits-before-price enforcement | Insurance-specific rule that no competitor enforces. The copilot actively prevents the rep from discussing price before establishing value. | Low | Detect price-related keywords before benefits milestone is checked. Alert: "Stop -- cover benefits first." Simple but high-impact. |
| Three-option close prompting | The playbook's preferred close technique. The copilot suggests the three options at the right moment and coaches the rep through the close sequence. | Low | Template-driven. Triggered when flow position reaches the close stage. |
| One-time authorization framing | Specific persuasion mechanic from the playbook. The copilot prompts the "one-time authorization" and "premier series" framing at the right moment. | Low | These are specific script elements embedded in the flow engine. Low complexity because they're template prompts at known positions. |

## Anti-Features

Features to explicitly NOT build. These are tempting but wrong for this project's context.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Manager dashboard / supervisor monitoring | Enterprise feature (Balto, Observe.AI charge premium for this). Team is 2-5 reps. The manager IS the user initially. Adds complexity without value for v1. | Log everything to PostgreSQL. Build a dashboard later when team grows. Data will be there. |
| Omnichannel support (chat, email, SMS) | Balto and Observe.AI support multiple channels. This copilot is voice-only on inbound calls. Adding channels fragments focus and delays launch. | Stay laser-focused on voice calls via RingCentral. The highest-value interaction is the live call. |
| CRM integration | Every enterprise tool integrates with Salesforce/HubSpot. This team likely uses simple tools. CRM integration adds deployment complexity and auth headaches. | Export call data as CSV or simple API. Add CRM integration when there's a specific CRM to integrate with. |
| Telephony middleware (Twilio, Five9) | Enterprise platforms sit in the telephony stack. This project uses browser audio capture -- simpler, cheaper, no vendor dependency. | Browser audio capture (Web Audio API + getDisplayMedia). No telephony middleware needed. |
| Multi-language support | Balto supports 20+ languages. This team operates in English only. | English only. Period. |
| AI roleplay / simulation training | Hyperbound, Quantified, and Gong's AI Trainer offer practice mode. Valuable but a separate product. Building this delays the core copilot. | The self-improving agent with post-call analysis IS the training system. Real calls are the training ground, not simulations. |
| Automated outbound / follow-up sequences | CoPilot AI and others handle post-call outreach automation. Out of scope -- this is an inbound service-to-sale tool. | Focus on the live call. Post-call follow-up is a separate workflow. |
| Call recording / audio storage | Many competitors store audio recordings. Adds storage costs, privacy concerns, and regulatory overhead. | Store transcripts only (text is cheap and searchable). The transcript captures everything needed for analysis. |
| Automated QA scoring | Balto's Real-Time QA and Observe.AI's AutoQA score 100% of calls. Valuable at scale, unnecessary for 2-5 reps. | Post-call AI analysis provides qualitative feedback. Formal QA scoring is overhead at this scale. |
| PCI/PII redaction | Cogito and enterprise tools auto-redact sensitive data. Important at scale, but adds complexity for a small team. | Be aware of it. Don't store credit card numbers in transcripts. Add proper redaction when scaling beyond the initial team. |

## Feature Dependencies

```
Browser Audio Capture --> Real-Time Transcription (STT)
Real-Time Transcription --> Call Flow Position Tracking
Real-Time Transcription --> Objection Detection
Real-Time Transcription --> Compliance Guardrails
Call Flow Position Tracking --> "Say This Now" Suggestions
Call Flow Position Tracking --> Three-Option Close Prompting
Call Flow Position Tracking --> Benefits-Before-Price Enforcement
Call Flow Position Tracking --> One-Time Authorization Framing
Objection Detection --> Objection Loop Counters
Objection Detection --> Objection Handling Suggestions
"Say This Now" Suggestions --> Suggestion-vs-Actual Tracking
Real-Time Transcription --> Full Transcript Storage
Full Transcript Storage --> Post-Call Summary
Full Transcript Storage --> Post-Call Psychology Analysis
Suggestion-vs-Actual Tracking + Call Outcome Recording --> Self-Improving Agent
Post-Call Psychology Analysis --> Self-Improving Agent
```

Key insight: **Everything flows from transcription.** If STT fails or is too slow, every downstream feature breaks. Deepgram is the critical dependency.

The **self-improving agent** sits at the top of the dependency chain -- it requires suggestion tracking, outcome recording, AND post-call analysis to function. This is why it should be a later-phase feature, built on top of a working copilot that captures the right data from day one.

## MVP Recommendation

**Prioritize (Phase 1 -- must work on day one):**

1. **Browser audio capture + real-time transcription** -- the foundation everything depends on
2. **14-angle call flow position tracking** -- the core differentiator; load the full Mermaid playbook
3. **"Say this now" contextual suggestions** -- the primary value prop
4. **Objection detection + handling suggestions** -- where reps need help most
5. **Compliance guardrails** -- non-negotiable in insurance
6. **Floating overlay UI** -- unusable without this
7. **Full transcript logging** -- captures training data for self-improvement from day one

**Phase 2 (build after core is stable):**

1. **Objection loop counters** -- enhances objection handling with discipline
2. **Benefits-before-price enforcement** -- quick win, depends on flow tracking
3. **Three-option close prompting** -- template-driven, low effort
4. **One-time authorization framing** -- another quick template win
5. **Post-call summary generation** -- reduces after-call work
6. **Call outcome recording** -- needed for the learning loop

**Phase 3 (self-improvement loop):**

1. **Suggestion-vs-actual tracking** -- the training signal
2. **Post-call psychology and tone analysis** -- deep AI analysis
3. **Self-improving agent** -- the crown jewel, but needs data from phases 1-2

**Defer indefinitely:**

- Manager dashboard (build when team grows past 5)
- CRM integration (build when specific CRM is identified)
- AI roleplay (separate product entirely)

## Sources

- [Balto AI - Contact Center AI Software](https://www.balto.ai/)
- [Balto Product Tour - Real-Time Guidance](https://www.balto.ai/product-tour/)
- [Observe.AI - Real-Time Agent Assist](https://www.observe.ai/real-time/agent-assist)
- [Observe.AI Platform Overview](https://www.observe.ai/platform/overview)
- [Cogito - Real-Time Agent Coaching](https://cogitocorp.com/products/cogito-for-agents/)
- [Cogito (now Verint) - CX/EX Scoring](https://cogitocorp.com/)
- [Gong AI Review 2026](https://reply.io/blog/gong-ai-review/)
- [Gong Mission Andromeda Launch (VentureBeat)](https://venturebeat.com/technology/gong-launches-mission-andromeda-with-ai-sales-coaching-chatbot-and-open-mcp)
- [ZoomInfo Chorus - Conversation Intelligence](https://www.zoominfo.com/products/chorus)
- [Aircover.ai - In-Call AI](https://www.aircover.ai/in-call-ai)
- [Gryphon AI - Compliance Solutions](https://gryphon.ai/)
- [JackBurton.ai - Medicare Sales Coaching](https://jackburton.ai/)
- [Convin - Insurance Sales Automation](https://convin.ai/blog/insurance-sales-automation)
- [Balto - Conversational AI in Insurance](https://www.balto.ai/blog/conversational-ai-in-insurance/)
- [Whatfix - AI Sales Coaching Tools 2026](https://whatfix.com/blog/ai-sales-coaching/)
- [Hyperbound - Data-Driven Sales Training 2026](https://www.hyperbound.ai/blog/data-driven-sales-training-2026)
