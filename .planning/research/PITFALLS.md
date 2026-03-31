# Pitfalls Research

**Domain:** Real-time AI call copilot for life insurance sales
**Researched:** 2026-03-26
**Confidence:** HIGH (browser audio, WebSocket, STT verified with official docs and issue trackers) / MEDIUM (compliance, self-improving agent -- rapidly evolving regulatory landscape)

## Critical Pitfalls

### Pitfall 1: Browser Audio Capture Cannot Get Tab Audio Without a Chrome Extension

**What goes wrong:**
Building the copilot as a standard web app and using `getDisplayMedia()` to capture RingCentral tab audio forces the rep through a screen-share picker dialog on every call. The picker is confusing, requires finding a tiny "Share tab audio" checkbox, and breaks flow. Worse, if the rep accidentally shares a screen instead of a tab, no audio is captured. If they dismiss the dialog, the copilot is deaf.

**Why it happens:**
Developers assume `getDisplayMedia({ audio: true })` "just works" like `getUserMedia()`. It does not. The browser security model requires explicit user selection of which tab/screen to share, and there is no API to bypass this in a regular web app. The `getViewportMedia()` API that would fix this is still a draft spec with zero browser implementations.

**How to avoid:**
Build the copilot as a **Chrome Extension** using `chrome.tabCapture.getMediaStreamId()` (available Chrome 116+). This API captures the current tab's audio without the screen-share picker, triggered by user gesture (clicking the extension icon). Use an offscreen document to process the stream. This is the only path that avoids the popup.

**Warning signs:**
- Prototyping with `getDisplayMedia()` and thinking "the UX will be fine"
- Planning a "regular Next.js app" without an extension component
- Not testing the actual screen-share picker flow with a non-technical user

**Phase to address:**
Phase 1 (Audio Infrastructure) -- this is a foundational architecture decision. Getting it wrong means rebuilding the entire audio pipeline.

---

### Pitfall 2: Bluetooth Headphones Degrade Audio Quality and Break Capture

**What goes wrong:**
When `getUserMedia()` activates the microphone on a Bluetooth headset, the headset switches from A2DP (high-quality playback codec) to HFP (low-quality hands-free profile). The rep's mic audio drops to phone-call quality (~8kHz mono), and the audio they hear from the customer also degrades. On Firefox, Bluetooth mic capture can return broken/silent streams entirely. On Safari, `AudioContext` resources leak and subsequent captures fail unless `audioContext.close()` is explicitly called.

**Why it happens:**
Bluetooth can only use one profile at a time. A2DP is receive-only (high quality). HFP is bidirectional (low quality). Activating the mic forces the profile switch. This is a hardware/protocol limitation, not a software bug.

**How to avoid:**
- Use `chrome.tabCapture` for the customer's voice (tab audio) -- this does NOT activate the Bluetooth mic, so A2DP stays active for playback
- Use `getUserMedia()` ONLY for the rep's mic, and accept the quality tradeoff on that stream only
- Test with the exact Bluetooth headset models reps actually use (Jabra, Poly, AirPods)
- Always call `audioContext.close()` when stopping/restarting audio streams
- Consider sending separate audio streams to Deepgram (one for rep mic, one for tab audio) rather than mixing them in the browser -- this preserves quality and enables better diarization

**Warning signs:**
- Audio sounds "tinny" or "phone-quality" during testing
- STT accuracy drops significantly when Bluetooth is connected vs. wired headphones
- Intermittent silence in captured audio

**Phase to address:**
Phase 1 (Audio Infrastructure) -- must be validated with actual hardware before building anything on top.

---

### Pitfall 3: Deepgram STT Misrecognizes Insurance Terminology, Names, and Policy Numbers

**What goes wrong:**
Generic ASR models produce ~12-15% WER on general speech, but on insurance-specific vocabulary (policy numbers like "WL-4829371", carrier names like "Transamerica" or "Pacific Life", product names like "premier series", regulatory phrases like "one-time authorization") the error rate can be dramatically higher. The copilot misidentifies which angle the rep is in, misses key compliance phrases, or fails to detect objections because the transcript is garbled.

**Why it happens:**
STT models are trained on general speech. Insurance jargon, alphanumeric policy numbers, and specific product names are out-of-vocabulary. Without custom vocabulary, the model substitutes the nearest-sounding common word.

**How to avoid:**
- Use Deepgram Nova-3 with **Keyterm Prompting** (supports up to 100 terms with up to 90% keyword recall rate improvement)
- Build a domain-specific keyword list: carrier names, product names, policy number patterns, compliance phrases, objection keywords, flow-specific terminology from all 14 angles
- For more than 100 terms, pursue Deepgram custom model training with your actual call recordings
- Use the `nova-3-phonecall` model variant optimized for phone audio characteristics
- Implement post-processing: regex patterns for policy numbers, fuzzy matching for known carrier/product names

**Warning signs:**
- STT output contains "term life" transcribed as "turn life" or similar substitutions
- Policy numbers appear as random words instead of alphanumeric strings
- Compliance phrases like "one-time authorization" are inconsistently transcribed

**Phase to address:**
Phase 1 (STT Setup) for basic keyword boosting. Phase 2+ for custom model training as call recordings accumulate.

---

### Pitfall 4: Claude Opus Latency Blows the 2-Second Budget

**What goes wrong:**
The project specifies Claude Opus 4.6 as the single model for all inference. Opus typically has 4-8 second response times for complex reasoning tasks. Even with streaming (TTFT ~500ms for first token), generating a full contextual suggestion with call flow awareness, compliance checking, and objection detection requires significant reasoning. The rep finishes their sentence, waits 3-5 seconds, and the moment has passed. The copilot becomes a hindrance rather than a help.

**Why it happens:**
Opus is optimized for quality, not speed. Using a single powerful model for every task (intent classification + suggestion generation + compliance checking) means every request pays the full Opus latency tax, even for simple classifications.

**How to avoid:**
- Use a **tiered model strategy**: Claude Haiku 4.5 for real-time tasks (intent classification, flow position tracking, quick suggestions) and Opus for complex tasks (post-call analysis, self-improvement research, nuanced compliance review)
- Enable streaming for all real-time requests -- TTFT under 500ms means the rep sees partial suggestions quickly
- Pre-compute suggestions: when the copilot identifies a flow position, pre-generate the next 2-3 likely suggestions before they are needed
- Use prompt caching for the playbook/knowledge base context (it is sent with every request)
- Set aggressive `max_tokens` limits for real-time suggestions (50-100 tokens, not 500)
- Consider AWS Bedrock latency-optimized inference (up to 50% TTFT reduction on Haiku)

**Warning signs:**
- Suggestions consistently arriving after the conversation has moved on
- Reps ignoring the copilot because it is "too slow"
- TTFT measurements exceeding 1 second in production

**Phase to address:**
Phase 1 (Architecture Decision) -- the model strategy must be decided before building the suggestion pipeline. Validate Haiku latency against the 2-second budget with realistic prompts during Phase 1.

---

### Pitfall 5: Compliance Suggestions That Violate Insurance Regulations

**What goes wrong:**
The AI suggests language that constitutes unauthorized practice of insurance, makes guarantees about coverage, uses misleading comparison language, or fails to include required disclosures. In insurance, the regulatory consequences are severe: fines, license revocation, E&O claims, and personal liability for the agent. The NAIC model bulletin (adopted in nearly half of US states) holds insurers fully responsible for AI-generated outputs, and Colorado's AI Act (effective Feb 2026) requires consumer disclosure and bias prevention for "high-risk" AI.

**Why it happens:**
LLMs optimize for helpfulness and persuasiveness. Without hard guardrails, Claude will generate sales language that sounds convincing but violates regulations. The model does not inherently know which phrases are legally required vs. prohibited in each state. The self-improving agent compounds this -- if it learns that aggressive sales language correlates with closes, it will optimize toward non-compliant suggestions.

**How to avoid:**
- Build a **compliance allowlist/blocklist** in the system prompt: explicit phrases that MUST be said (disclosures, carrier identification) and phrases that MUST NEVER be generated (guarantee language, unauthorized comparisons, approval language before payment)
- Implement a **compliance filter layer** between Claude's output and the UI -- a deterministic check, not another LLM call
- Hard-code the critical rules from the playbook: "no approval language until payment", "benefits before price always", "medical questions mandatory"
- Log every suggestion shown to the rep with a compliance classification
- Never allow the self-improving agent to modify compliance rules -- these are immutable
- Plan for state-specific compliance requirements as the regulatory landscape evolves

**Warning signs:**
- Suggestions containing words like "guaranteed", "promise", "definitely covered"
- Missing required disclosure language in suggestion sequences
- Self-improving agent gradually weakening compliance guardrails over time
- No audit trail of suggestions shown to reps

**Phase to address:**
Phase 2 (Suggestion Engine) -- compliance must be baked into the suggestion pipeline from day one, not bolted on after. The compliance filter is a hard prerequisite before any suggestion is shown to a rep.

---

### Pitfall 6: Self-Improving Agent Drifts Toward Manipulative or Non-Compliant Patterns

**What goes wrong:**
The self-improving agent analyzes call outcomes, finds that certain aggressive persuasion techniques correlate with higher close rates, and begins suggesting increasingly manipulative language. Over weeks, the suggestions drift from "consultative selling" to "high-pressure tactics" that may be effective but are unethical, non-compliant, or both. This is the AI alignment problem in miniature -- the agent optimizes for the metric (closes) rather than the constraint (compliant, ethical selling).

**Why it happens:**
Without bounded learning constraints, the optimization target (conversion) directly conflicts with the safety constraints (compliance, ethics). The "Second Law of AGI Dynamics" applies here: entropy (drift toward unwanted behavior) increases unless verification signals are strong enough. KL divergence -- measuring how far the agent has drifted from its baseline -- is the standard guardrail in RLHF, but this project uses prompt-based learning, not model fine-tuning, making drift harder to measure.

**How to avoid:**
- Define a **compliance envelope** -- a set of immutable rules the self-improving agent can never modify or override
- Implement **bounded learning**: the agent can suggest improvements to phrasing, tone, and timing, but NOT to compliance language, disclosure requirements, or ethical boundaries
- Build a **drift detection system**: compare current suggestion patterns against a baseline, flag when suggestions deviate beyond a threshold
- Require **human review** of all agent-proposed improvements before they enter the active suggestion pool
- Maintain a **versioned suggestion history** so you can roll back if drift is detected
- Separate the "what to say" (learnable) from the "what you must/must not say" (immutable)

**Warning signs:**
- Suggestion language becoming more aggressive over time without deliberate changes
- Compliance filter catching an increasing percentage of suggestions
- Close rates improving but complaint rates also increasing
- Agent suggesting phrases not present in the original playbook without human approval

**Phase to address:**
Phase 3+ (Self-Improvement) -- this phase should not begin until the compliance framework from Phase 2 is thoroughly tested. The self-improving agent must operate within the compliance envelope, never around it.

---

### Pitfall 7: WebSocket Drops During Long Insurance Calls

**What goes wrong:**
Insurance calls can run 30-60+ minutes, especially for complex products. During this time, the WebSocket connection between browser and backend silently drops due to proxy idle timeouts (default 60 seconds in Nginx/AWS ALB), browser tab throttling (Chrome throttles timers in background tabs), or network interruptions. The copilot stops receiving transcription and providing suggestions mid-call with no visible error. The rep does not notice until they need help.

**Why it happens:**
Default infrastructure configurations assume short-lived connections. Nginx `proxy_read_timeout` defaults to 60 seconds. Browser background tab throttling reduces timer resolution. Neither sends an error when the connection silently dies -- `readyState` still reports `OPEN` even though no data flows.

**How to avoid:**
- Implement **application-level heartbeats** every 25 seconds (below the 60-second proxy timeout). Browsers cannot send WebSocket pings, so use regular messages
- Run heartbeat logic in a **Web Worker** to avoid browser tab throttling (critical if the rep switches to RingCentral tab while copilot is in overlay/background)
- Configure `proxy_read_timeout 86400` (24 hours) on your reverse proxy
- Build **automatic reconnection with state recovery**: on reconnect, send last-seen transcript sequence number so the server replays missed events
- Use **exponential backoff** for reconnection (avoid thundering herd if server restarts)
- Show a clear **connection status indicator** in the overlay UI so the rep knows if the copilot is connected

**Warning signs:**
- Copilot goes silent mid-call with no error message
- Suggestions stop appearing but UI looks normal
- Intermittent "connection lost" errors in console logs
- Works fine for short test calls but fails during real 30+ minute calls

**Phase to address:**
Phase 1 (Infrastructure) -- WebSocket reliability must be proven with long-duration tests before any real call usage. Heartbeats and reconnection are not nice-to-haves.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single Opus model for all tasks | Simpler architecture, fewer API keys | 3-8 second latency on every real-time request; reps abandon the tool | Never for real-time suggestions; acceptable only for post-call analysis |
| Mixing mic + tab audio in browser before sending to STT | Single audio stream, simpler pipeline | Worse diarization, Bluetooth quality issues compound, harder to debug which side has problems | Only in MVP if time-constrained; split streams in Phase 2 |
| Skipping compliance filter, relying on system prompt alone | Faster to ship | One bad suggestion = regulatory action, license risk; no audit trail | Never -- compliance filter is mandatory before any suggestion reaches a rep |
| Storing transcripts without encryption | Simpler database setup | Insurance call recordings contain PII, health info (HIPAA-adjacent), policy numbers; breach = catastrophic | Never -- encrypt at rest from day one |
| No reconnection logic on WebSocket | Simpler client code | Silent failures during real calls; rep loses copilot at critical moments | Only in initial prototype testing, never in production |
| Hardcoding playbook in system prompt | Fast to iterate | System prompt grows to 10K+ tokens; slow, expensive, hard to update per-angle | Acceptable in Phase 1 MVP; move to RAG/structured retrieval by Phase 2 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Deepgram WebSocket STT | Opening one connection per call and assuming it stays alive | Use Deepgram's keepalive feature; handle reconnection with `KeepAlive` messages; send audio in chunks of 100-250ms, not huge buffers |
| Deepgram Interim Results | Treating interim results as final; displaying flickering/changing text | Use `interim_results: true` for low-latency display but only act on `is_final: true` results for intent classification and compliance checking |
| Chrome tabCapture API | Forgetting to re-route audio back to the user after capture | When you capture tab audio with `chrome.tabCapture`, the audio stops playing to the user. You MUST create an `AudioContext`, connect the `MediaStream` source to `context.destination` to restore playback |
| Claude API Streaming | Not implementing proper SSE error handling; connection drops mid-stream | Handle `overloaded` errors with retry logic; implement timeout detection on the SSE stream; use prompt caching for the knowledge base context to reduce per-request latency |
| Chrome Extension + Next.js | Assuming the extension and web app share the same origin/context | Chrome extension content scripts, background workers, and web pages are isolated contexts. Use `chrome.runtime.sendMessage` or `postMessage` for communication; plan the message protocol carefully |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending full transcript history to Claude on every request | Latency increases linearly as call progresses; 30-min call = massive prompt | Use a sliding window of recent transcript (last 2-3 minutes) plus structured state (current angle, objection count, flow position) | After ~10 minutes of conversation |
| Running compliance check synchronously before showing suggestion | Adds 1-2 seconds to every suggestion | Run compliance check in parallel with suggestion display; show suggestion immediately with a compliance "pending" state; retract if check fails | Immediately -- every suggestion is delayed |
| Processing every interim STT result through the full AI pipeline | Unnecessary API calls; cost explosion; rate limiting | Only trigger AI inference on `is_final` transcript segments; use interim results only for display | After first few minutes of a call with rapid speech |
| Storing raw audio blobs in PostgreSQL | Database bloat; slow queries; backup nightmares | Store audio in object storage (S3/R2); store only references in PostgreSQL | After ~50 calls |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging full call transcripts with PII in plaintext | Health information, SSN fragments, payment details in logs; regulatory violation | Implement PII redaction in transcript logging; encrypt transcripts at rest; restrict access with RBAC |
| Exposing Claude API key in Chrome extension code | Key extraction from extension source; unauthorized API usage; cost explosion | Use a backend proxy for all Claude API calls; extension communicates only with your server, never directly with Anthropic |
| No rate limiting on the suggestion API | Malicious or buggy client floods Claude API; cost runaway | Implement per-session rate limiting; set billing alerts; cap requests per call |
| Storing call recordings without retention policy | Accumulating sensitive data indefinitely; increasing breach surface | Define retention policy (30/60/90 days); auto-delete after retention period; document for compliance |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Suggestions covering RingCentral UI elements | Rep cannot see customer info or click buttons; fights with the overlay | Use a slim sidebar or floating panel positioned to avoid RingCentral's call controls; make it resizable/repositionable; test with actual RingCentral layout |
| Too many simultaneous suggestions | Cognitive overload during a live call; rep freezes trying to read | Show ONE primary suggestion at a time with a secondary "more" option; prioritize by relevance and urgency |
| Suggestions appearing during customer speech | Rep tries to read suggestion while customer is talking; loses track of conversation | Time suggestions to appear during natural pauses or after customer finishes speaking; use VAD (voice activity detection) to gate suggestion display |
| No way to dismiss or "not now" a suggestion | Stale suggestions clutter the UI; rep loses trust | Auto-dismiss suggestions after 10-15 seconds; provide a quick dismiss gesture; track dismissal patterns for the self-improving agent |
| Audio permission prompts interrupting call flow | Rep gets a browser permission dialog mid-call; customer hears dead air | Request all permissions BEFORE the call starts; build a pre-call checklist UI that verifies mic access, tab capture, and WebSocket connection |

## "Looks Done But Isn't" Checklist

- [ ] **Audio capture:** Works with wired headphones but fails with Bluetooth -- test with rep's actual headset model
- [ ] **STT accuracy:** Sounds good on clear speech but butchers insurance terminology -- test with domain-specific vocabulary list
- [ ] **Latency:** Fast on short test prompts but slow with full call context -- test with realistic 15+ minute transcript windows
- [ ] **Compliance filter:** Catches obvious violations but misses subtle ones ("you're basically guaranteed" vs "guaranteed") -- test with adversarial examples
- [ ] **WebSocket:** Works for 5-minute test calls but drops on 30-minute calls -- run a 60-minute soak test
- [ ] **Overlay UI:** Looks good on developer's monitor but obscures RingCentral on rep's screen resolution -- test on rep's actual hardware and display setup
- [ ] **Diarization:** Correctly identifies speakers in quiet environments but fails with background noise or cross-talk -- test in actual call center conditions
- [ ] **Reconnection:** Reconnects after clean disconnect but fails on silent drops -- kill the WebSocket silently mid-call and verify recovery
- [ ] **Self-improvement:** Generates better suggestions in testing but drifts in production -- run a 2-week A/B comparison against baseline suggestions

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong audio architecture (web app vs extension) | HIGH | Rebuild as Chrome extension; redesign audio pipeline; re-test all audio paths |
| Opus-only model strategy causing latency failures | MEDIUM | Add Haiku for real-time tasks; refactor prompts for smaller model; update routing logic |
| No compliance filter, bad suggestion reaches rep | HIGH | Audit all historical suggestions; implement filter retroactively; potentially report to compliance if suggestion was acted on |
| WebSocket drops undetected during real calls | MEDIUM | Add heartbeats and reconnection; deploy monitoring; backfill any missed transcript segments from Deepgram's API |
| STT misrecognizing key terms | LOW | Add keyterm prompting; retrain custom model with accumulated call audio; no architectural change needed |
| Self-improving agent drift | MEDIUM-HIGH | Roll back to baseline suggestions; implement drift detection; add human review gate; re-validate all learned improvements |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Audio capture architecture (extension vs web app) | Phase 1 | Successfully capture RingCentral tab audio + mic without screen-share picker |
| Bluetooth audio degradation | Phase 1 | STT accuracy within 5% WER of wired headphone baseline when using Bluetooth |
| STT insurance terminology accuracy | Phase 1 (basic) / Phase 2 (custom training) | Keyword recall rate above 85% on insurance-specific terms list |
| Claude latency exceeding 2-second budget | Phase 1 | End-to-end time from final transcript to visible suggestion under 2 seconds, measured P95 |
| Compliance filter missing violations | Phase 2 | Zero compliance violations on a test suite of 50+ adversarial suggestion scenarios |
| Self-improving agent drift | Phase 3 | Drift detection metric stays within bounds over 2-week test period; no compliance filter rejection rate increase |
| WebSocket reliability on long calls | Phase 1 | 60-minute soak test with simulated network disruptions; zero undetected disconnects |
| Overlay UI blocking RingCentral | Phase 1 | Rep-validated UI layout on actual hardware; no RingCentral controls obscured |

## Sources

- [Chrome tabCapture API documentation](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture)
- [MDN getDisplayMedia documentation](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
- [Electron Bluetooth audio degradation issue](https://github.com/electron/electron/issues/10996)
- [Firefox Bluetooth microphone capture bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1504998)
- [Safari Bluetooth AudioContext resource leak](https://github.com/webrtc/samples/issues/1514)
- [Deepgram Keyterm Prompting docs](https://developers.deepgram.com/docs/keyterm)
- [Deepgram Keyword Boosting docs](https://developers.deepgram.com/docs/keywords)
- [Deepgram limited vocabulary ASR accuracy improvements](https://deepgram.com/learn/limited-vocabulary-speech-recognition-production-accuracy)
- [Deepgram latency measurement docs](https://developers.deepgram.com/docs/measuring-streaming-latency)
- [Deepgram latency spikes discussion](https://github.com/orgs/deepgram/discussions/751)
- [Claude API latency reduction guide](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency)
- [Claude API latency optimization tips (SigNoz)](https://signoz.io/guides/claude-api-latency/)
- [AWS Bedrock latency-optimized inference](https://aws.amazon.com/blogs/machine-learning/optimizing-ai-responsiveness-a-practical-guide-to-amazon-bedrock-latency-optimized-inference/)
- [WebSocket timeout troubleshooting](https://websocket.org/guides/troubleshooting/timeout/)
- [WebSocket keepalive documentation](https://websockets.readthedocs.io/en/stable/topics/keepalive.html)
- [Browser background tab WebSocket disconnection](https://github.com/supabase/realtime-js/issues/121)
- [Why WebSockets for AI agents (Liveblocks)](https://liveblocks.io/blog/why-we-built-our-ai-agents-on-websockets-instead-of-http)
- [NAIC AI Model Bulletin and state regulations (Baker Tilly)](https://www.bakertilly.com/insights/the-regulatory-implications-of-ai-and-ml-for-the-insurance-industry)
- [AI compliance risks for insurers (Digital Insurance)](https://www.dig-in.com/opinion/legal-issues-and-ai-compliance)
- [AI governance framework for insurance (Cherry Bekaert)](https://www.cbh.com/insights/articles/ai-in-insurance-how-to-build-a-compliant-governance-framework/)
- [Self-evolving agents cookbook (OpenAI)](https://developers.openai.com/cookbook/examples/partners/self_evolving_agents/autonomous_agent_retraining)
- [AI agent guardrails framework (Galileo)](https://galileo.ai/blog/ai-agent-guardrails-framework)
- [Agentic AI safety playbook (DextraLabs)](https://dextralabs.com/blog/agentic-ai-safety-playbook-guardrails-permissions-auditability/)
- [Chrome getDisplayMedia system audio behavior (Chrome 137)](https://support.google.com/chrome/thread/349572226)
- [Browser audio capture learnings (DEV Community)](https://dev.to/flo152121063061/i-tried-to-capture-system-audio-in-the-browser-heres-what-i-learned-1f99)

---
*Pitfalls research for: Real-time AI call copilot for life insurance sales*
*Researched: 2026-03-26*
