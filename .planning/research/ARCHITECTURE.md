# Architecture Research

**Domain:** Real-time AI call copilot for life insurance sales
**Researched:** 2026-03-26
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
+===========================================================================+
|                        BROWSER (Chrome)                                    |
|                                                                           |
|  +------------------+   +------------------+   +------------------------+ |
|  | getUserMedia()   |   | getDisplayMedia() |   | React Overlay UI      | |
|  | (Rep mic audio)  |   | (Tab audio =     |   | (Floating panel over  | |
|  |                  |   |  customer voice)  |   |  RingCentral)         | |
|  +--------+---------+   +--------+---------+   +----------+-------------+ |
|           |                      |                         ^              |
|           v                      v                         |              |
|  +--------+----------------------+---------+               |              |
|  |        Web Audio API Mixer              |               |              |
|  |  (AudioContext + ChannelMerger)         |               |              |
|  |  Ch0 = Rep mic, Ch1 = Tab/Customer     |               |              |
|  +--------+--------------------------------+               |              |
|           |                                                |              |
|           | PCM 16-bit, 16kHz, 2-channel                   |              |
|           v                                                |              |
|  +--------+------------+          +------------------------+------------+ |
|  | WebSocket Client    +--------->| WebSocket Client (suggestions)      | |
|  | (audio upstream)    |          | (downstream events)                 | |
|  +--------+------------+          +------------------------+------------+ |
+===========+====================================================+==========+
            |                                                    ^
            | wss://                                             | wss://
            v                                                    |
+===========+==========================================================+====+
|                        BACKEND (Node.js / Next.js API Routes)        |    |
|                                                                      |    |
|  +--------------------+                                              |    |
|  | Audio Gateway      |  Receives PCM chunks, forwards to Deepgram  |    |
|  | (WebSocket server) |  Keeps API keys server-side                  |    |
|  +---------+----------+                                              |    |
|            |                                                         |    |
|            v                                                         |    |
|  +---------+-------------------+                                     |    |
|  | Deepgram WebSocket Client   |  multichannel=true (2ch)            |    |
|  | (streaming STT)             |  interim_results=true               |    |
|  | Nova-3 model                |  smart_format=true                  |    |
|  +---------+-------------------+                                     |    |
|            |                                                         |    |
|            | Transcript events (interim + final, per-channel)        |    |
|            v                                                         |    |
|  +---------+-------------------+                                     |    |
|  | Event Bus (Redis Pub/Sub)   |  Channels: transcript, intent,      |    |
|  |                             |  suggestion, compliance, call-state  |    |
|  +---------+-------------------+                                     |    |
|            |                                                         |    |
|    +-------+-------+-------+-------+                                 |    |
|    v       v       v       v       v                                 |    |
|  +---+  +---+  +---+  +---+  +----+---+                             |    |
|  | A |  | B |  | C |  | D |  |   E    |                             |    |
|  +---+  +---+  +---+  +---+  +----+---+                             |    |
|                                    |                                 |    |
|    A = Call State Tracker          +---> Suggestion WebSocket -------+    |
|    B = Intent Classifier (Haiku)                                         |
|    C = Script Card Retriever (pgvector)                                  |
|    D = Compliance Guardrail                                              |
|    E = Strategy Engine (Claude Opus 4.6)                                 |
|                                                                          |
|  +-------------------------------------------------------------------+   |
|  |                     Data Layer                                     |   |
|  |  +----------------+  +----------------+  +---------------------+  |   |
|  |  | PostgreSQL     |  | Redis          |  | File Storage        |  |   |
|  |  | + pgvector     |  | (session state |  | (call recordings,   |  |   |
|  |  | (knowledge     |  |  call context  |  |  transcripts)       |  |   |
|  |  |  cards, call   |  |  event bus)    |  |                     |  |   |
|  |  |  history)      |  |                |  |                     |  |   |
|  |  +----------------+  +----------------+  +---------------------+  |   |
|  +-------------------------------------------------------------------+   |
|                                                                          |
|  +-------------------------------------------------------------------+   |
|  |              Post-Call / Learning Loop (async)                     |   |
|  |  +----------------+  +----------------+  +---------------------+  |   |
|  |  | Call Analyzer  |  | Pattern Miner  |  | Knowledge Updater   |  |   |
|  |  | (Opus 4.6)     |  | (what worked)  |  | (refine cards)      |  |   |
|  |  +----------------+  +----------------+  +---------------------+  |   |
|  +-------------------------------------------------------------------+   |
+==========================================================================+
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Audio Capture (Browser)** | Capture rep mic via `getUserMedia()`, customer voice via `getDisplayMedia()` tab audio sharing, merge into 2-channel stream | Web Audio API with `ChannelMergerNode`, PCM 16-bit encoding via `AudioWorkletNode` |
| **Audio Gateway** | Accept browser WebSocket, proxy audio to Deepgram, keep API keys server-side | Next.js WebSocket endpoint (or standalone ws server), binary frame forwarding |
| **Deepgram STT** | Convert streaming audio to text with speaker attribution per channel | Deepgram Nova-3 with `multichannel=true`, `interim_results=true`, `smart_format=true` |
| **Event Bus** | Decouple pipeline stages, enable parallel processing, fan-out events | Redis Pub/Sub with channels per event type |
| **Call State Tracker** | Track position in the 14-angle flow, maintain structured call context JSON | Redis hash per active call, updated on each transcript event |
| **Intent Classifier** | Classify customer intent, detect objections, identify angle transitions | Claude Haiku 4.5 (fast, cheap) with streaming, constrained output schema |
| **Script Card Retriever** | Find relevant playbook segments based on current flow position + conversation context | pgvector cosine similarity search on pre-embedded knowledge cards |
| **Strategy Engine** | Generate contextual suggestions ("say this now"), synthesize intent + cards + call state | Claude Opus 4.6 with streaming, prompt-cached system prompt |
| **Compliance Guardrail** | Check suggestions against compliance rules before delivery | Rule-based filter (fast) + Haiku validation (for edge cases) |
| **Suggestion Delivery** | Push suggestions to browser overlay in real-time | WebSocket server pushing JSON events to React client |
| **React Overlay UI** | Display suggestions, call state, objection counters as floating panel | React + Zustand for state, floating/draggable panel or separate browser window |
| **Post-Call Analyzer** | Analyze full transcript: what worked, missed opportunities, tone | Opus 4.6 batch analysis (async, not latency-sensitive) |
| **Pattern Miner** | Aggregate insights across calls, find winning patterns | Scheduled job querying call history in PostgreSQL |
| **Knowledge Updater** | Refine script cards and suggestion templates based on outcomes | Opus 4.6 generating updated card content, stored in pgvector |

## Recommended Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── audio/              # WebSocket audio gateway endpoint
│   │   ├── suggestions/        # WebSocket suggestion push endpoint
│   │   ├── calls/              # REST: call CRUD, history
│   │   ├── analysis/           # REST: post-call analysis triggers
│   │   └── knowledge/          # REST: knowledge card management
│   ├── overlay/                # Overlay UI page (loaded in floating window)
│   └── dashboard/              # Call history, analytics (future)
├── lib/
│   ├── audio/                  # Browser audio capture logic
│   │   ├── capture.ts          # getUserMedia + getDisplayMedia orchestration
│   │   ├── mixer.ts            # Web Audio API channel merging
│   │   ├── encoder.ts          # PCM encoding via AudioWorklet
│   │   └── transport.ts        # WebSocket binary streaming
│   ├── deepgram/               # Deepgram client wrapper
│   │   ├── client.ts           # WebSocket connection management
│   │   ├── config.ts           # Model config, params
│   │   └── types.ts            # Transcript event types
│   ├── pipeline/               # Real-time processing pipeline
│   │   ├── event-bus.ts        # Redis Pub/Sub wrapper
│   │   ├── call-state.ts       # Call state machine + Redis storage
│   │   ├── intent.ts           # Intent classifier (Haiku calls)
│   │   ├── retriever.ts        # pgvector search for script cards
│   │   ├── strategy.ts         # Strategy engine (Opus 4.6 calls)
│   │   ├── compliance.ts       # Compliance rule checker
│   │   └── orchestrator.ts     # Pipeline coordinator
│   ├── learning/               # Self-improvement loop
│   │   ├── analyzer.ts         # Post-call analysis
│   │   ├── miner.ts            # Cross-call pattern mining
│   │   └── updater.ts          # Knowledge card updates
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # Drizzle/Prisma schema
│   │   ├── queries.ts          # Common queries
│   │   └── embeddings.ts       # Embedding generation + pgvector ops
│   └── types/                  # Shared TypeScript types
│       ├── call.ts             # Call state, transcript types
│       ├── pipeline.ts         # Event types for the pipeline
│       └── knowledge.ts        # Knowledge card types
├── components/                 # React UI components
│   ├── overlay/                # Floating overlay components
│   │   ├── SuggestionCard.tsx  # Current suggestion display
│   │   ├── CallState.tsx       # Flow position indicator
│   │   ├── ObjectionTracker.tsx# Objection loop counter
│   │   └── TranscriptView.tsx  # Live transcript (optional)
│   └── shared/                 # Shared UI components
├── workers/                    # AudioWorklet processors
│   └── pcm-encoder.js          # Float32 to Int16 PCM conversion
└── knowledge/                  # Static knowledge base
    ├── playbook/               # 14-angle flowchart as structured data
    ├── objections/             # Objection handling scripts
    └── compliance/             # Compliance rules
```

### Structure Rationale

- **`lib/audio/`:** Isolated browser-only code. Audio capture is complex with many edge cases (bluetooth, permissions, tab sharing). Keeping it separate enables focused testing and debugging.
- **`lib/pipeline/`:** Each pipeline stage is its own module with a clear input/output contract. The orchestrator wires them together. This enables swapping components (e.g., replacing Haiku with a local model later) without touching other stages.
- **`lib/learning/`:** Async processes completely decoupled from the real-time pipeline. They read from the same data stores but never block the hot path.
- **`knowledge/`:** Static playbook data checked into the repo. Seeded into pgvector on deploy. Allows version control of the knowledge base.

## Architectural Patterns

### Pattern 1: Two-Channel Multichannel Audio (Not Diarization)

**What:** Capture rep and customer audio as separate channels in a single stream, then use Deepgram's `multichannel=true` for per-channel transcription instead of relying on diarization.

**When to use:** When you have access to both audio sources independently (mic vs. tab audio), which is the case here.

**Trade-offs:** Requires the Web Audio API merging step (more browser-side complexity), but eliminates speaker attribution errors entirely. Multichannel gives deterministic speaker attribution -- Channel 0 is always the rep, Channel 1 is always the customer. Diarization is probabilistic and can mislabel speakers, especially with short utterances or crosstalk. For a copilot that triggers on "customer said X," multichannel is the correct choice.

**Example:**
```typescript
// Browser: merge mic + tab audio into 2-channel stream
const audioCtx = new AudioContext({ sampleRate: 16000 });
const merger = audioCtx.createChannelMerger(2);

const micSource = audioCtx.createMediaStreamSource(micStream);
const tabSource = audioCtx.createMediaStreamSource(tabStream);

micSource.connect(merger, 0, 0);  // Rep mic -> Channel 0
tabSource.connect(merger, 0, 1);  // Tab audio (customer) -> Channel 1

// Connect merger to AudioWorklet for PCM encoding + WebSocket transport
const workletNode = new AudioWorkletNode(audioCtx, 'pcm-encoder');
merger.connect(workletNode);
workletNode.port.onmessage = (e) => {
  websocket.send(e.data); // Binary PCM frames
};
```

### Pattern 2: Pipeline-per-Event with Redis Pub/Sub

**What:** Each transcript event flows through the pipeline as a message on Redis Pub/Sub channels. Pipeline stages subscribe to relevant channels and publish results to downstream channels.

**When to use:** When pipeline stages have different latency profiles and should not block each other. Intent classification (~50ms) should not wait for strategy generation (~1s).

**Trade-offs:** Adds ~1-2ms per Redis hop (negligible). Enables parallelism -- intent classification and card retrieval run simultaneously on the same transcript event. Makes it trivial to add new pipeline stages later without rewiring.

**Event flow:**
```
transcript:final  -->  intent:classified  --+
                  -->  cards:retrieved    --+--> strategy:suggestion
                  -->  call-state:updated --+
```

### Pattern 3: Two-Tier LLM Strategy (Fast + Deep)

**What:** Use Haiku 4.5 for high-frequency, low-latency tasks (intent classification, simple compliance checks) and Opus 4.6 for low-frequency, high-quality tasks (strategy suggestions, post-call analysis).

**When to use:** When your pipeline has both latency-critical classification and quality-critical generation stages.

**Trade-offs:** Two model integrations to maintain. But Haiku at ~50-100ms for classification vs. Opus at ~500-1500ms for generation means the pipeline stays under the 2-second latency budget.

**Cost estimate per call:**
- Haiku classification: ~200 tokens in, ~50 tokens out per transcript chunk. At $1/$5 per MTok, a call with 200 chunks costs ~$0.09.
- Opus suggestion: ~2000 tokens in, ~200 tokens out, triggered ~20 times per call. At $15/$75 per MTok, costs ~$0.90 per call.
- Total per call: approximately $1. Acceptable for a revenue-generating sales call.

**Note on PROJECT.md constraint:** The project specifies "Claude Opus 4.6 as the single AI model." This is a pragmatic day-one simplification. Build the architecture to support the two-tier pattern from the start (abstract LLM calls behind a provider interface), but day-one can use Opus for everything if latency is acceptable. Add Haiku for classification once latency needs tightening.

### Pattern 4: Prompt Caching for the System Prompt

**What:** Use Anthropic's prompt caching to cache the large system prompt (playbook, compliance rules, call flow definitions) that accompanies every Opus call. The system prompt is static per deployment; only the conversation context changes.

**When to use:** When you have a large, repeated system prompt and many API calls per session.

**Trade-offs:** Requires structuring prompts so the cacheable prefix is stable across calls. Saves ~70-80% on input token costs and reduces latency for the cached portion. During an active call with inference every ~30-60s, the cache stays warm within its 5-minute TTL.

```typescript
const response = await anthropic.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 512,
  system: [
    {
      type: 'text',
      text: SYSTEM_PROMPT + FULL_PLAYBOOK, // ~5-10K tokens, cached
      cache_control: { type: 'ephemeral' }
    }
  ],
  messages: [
    {
      role: 'user',
      content: buildContextWindow(recentTurns, flowPosition, objections)
    }
  ],
  stream: true
});
```

### Pattern 5: Sliding Window + Session Memory

**What:** Maintain three memory scopes for the strategy engine's context window:
- **Hot buffer (30-90s):** Raw transcript of the last 30-90 seconds. Used for immediate context. Stored in Redis.
- **Session summary:** Compressed summary of the full call so far. Updated every ~60 seconds by a background summarization pass. Stored in Redis.
- **Knowledge cards:** Retrieved from pgvector based on current intent + flow position. Static until the learning loop updates them.

**When to use:** Always, for any call longer than a few minutes.

**Trade-offs:** The background summarization adds a task but keeps the strategy engine's input tokens manageable (~2000 tokens instead of 10,000+ for a long call). Prevents context window overflow and cost explosion on long calls.

### Pattern 6: Debounced Inference Triggering

**What:** Do not call the strategy engine on every transcript fragment. Wait for `is_final: true` events from Deepgram and apply a 500ms debounce after the last final transcript before triggering Opus.

**When to use:** Always -- Deepgram sends interim results rapidly (every 100-200ms). Calling Opus on every fragment creates an unbounded backlog.

**Trade-offs:** Adds up to 500ms of delay before inference starts, but prevents wasted API calls on fragments that will be superseded. Batch accumulated turns into one inference call for better context.

```typescript
let debounceTimer: NodeJS.Timeout;
const DEBOUNCE_MS = 500;

function onTranscriptFinal(turn: TranscriptTurn) {
  clearTimeout(debounceTimer);
  contextBuffer.push(turn);

  debounceTimer = setTimeout(async () => {
    const suggestion = await strategyEngine.infer(contextBuffer);
    contextBuffer = [];
    redis.publish('suggestion:ready', JSON.stringify(suggestion));
  }, DEBOUNCE_MS);
}
```

## Data Flow

### Real-Time Pipeline (Hot Path) -- Target: under 2 seconds end-to-end

```
Rep speaks / Customer speaks
    |
    v (continuous)
[Browser Audio Capture] -- getUserMedia (mic) + getDisplayMedia (tab)
    |
    | Web Audio API merges to 2-channel PCM, 100ms chunks
    v
[WebSocket to Backend] -- binary frames, ~100ms intervals
    |
    v
[Audio Gateway] -- forwards to Deepgram, no processing
    |
    v
[Deepgram Nova-3] -- multichannel streaming STT
    |
    | interim results ~150ms, final results ~300ms
    v
[Redis Pub/Sub: transcript:final] -- per-channel final transcript
    |
    +---> [Call State Tracker] -- updates flow position in Redis
    |         |
    |         v publishes call-state:updated
    |
    +---> [Intent Classifier (Haiku)] -- ~50-100ms
    |         |
    |         v publishes intent:classified
    |
    +---> [Script Card Retriever] -- pgvector search ~10-20ms
              |
              v publishes cards:retrieved
              |
    +---------+---------+
    |                   |
    v                   v
[Strategy Engine (Opus 4.6)] -- receives intent + cards + call state + hot buffer
    |
    | streaming response, first tokens ~500ms, full ~1-2s
    v
[Compliance Guardrail] -- rule-based check ~5ms, Haiku fallback ~50ms
    |
    v
[Redis Pub/Sub: suggestion:ready]
    |
    v
[WebSocket to Browser] -- JSON event
    |
    v
[React Overlay UI] -- renders suggestion card
```

**Latency budget breakdown:**

| Stage | Target | Notes |
|-------|--------|-------|
| Audio capture + encoding | 100ms | Chunk size tuning: 100ms optimal on stable connections |
| Network (browser to server) | 10-30ms | Local or nearby server |
| Deepgram STT (to final) | 200-300ms | Nova-3 streaming, sub-300ms |
| Redis event routing | 1-2ms | Negligible |
| Intent classification (Haiku) | 50-100ms | Or skip if Opus handles inline |
| pgvector retrieval | 10-20ms | HNSW index, small dataset under 1K cards |
| Strategy generation (Opus) | 500-1500ms | Streaming -- first tokens arrive faster |
| Compliance check | 5-50ms | Rule-based first, Haiku for edge cases |
| Network (server to browser) | 10-30ms | WebSocket push |
| **Total** | **~900-2000ms** | **Within the 2s budget** |

### Post-Call Learning Loop (Cold Path) -- Runs async after call ends

```
[Call Ends]
    |
    v
[Full Transcript + Metadata saved to PostgreSQL]
    |
    v (async job, no latency constraint)
[Post-Call Analyzer (Opus 4.6)]
    |
    | Analyzes: suggestions followed vs ignored, objection handling
    | effectiveness, missed transitions, tone/psychology insights,
    | compliance adherence
    v
[Analysis Report saved to PostgreSQL]
    |
    v (scheduled batch, e.g., nightly or after N calls)
[Pattern Miner]
    |
    | Aggregates across calls: which script cards lead to closes,
    | which objection responses work, which angles convert best
    v
[Pattern Insights saved to PostgreSQL]
    |
    v
[Knowledge Updater (Opus 4.6)]
    |
    | Rewrites/refines script cards based on patterns.
    | Generates new objection handling variants.
    | Re-computes embeddings, stores in pgvector.
    v
[Updated Knowledge Base in pgvector]
    |
    v (next call uses updated cards automatically)
[Script Card Retriever picks up new/updated cards]
```

### State Management

```
Per Active Call (Redis Hash):
{
  call_id: "uuid",
  started_at: "ISO timestamp",
  current_angle: "standard_term",      // Which of 14 angles
  flow_position: "discovery.needs",    // Where in the angle's flow
  objection_loops: {
    "price": { count: 1, max: 3 },
    "think_about_it": { count: 0, max: 2 }
  },
  hot_buffer: [...last 30-90s of transcript chunks...],
  session_summary: "Customer called about payment. Rep identified...",
  last_suggestion_id: "uuid",
  suggestion_history: [...ids with timestamps and outcomes...]
}
```

### Key Data Flows

1. **Audio-to-text flow:** Browser captures 2-channel PCM at 16kHz, streams via WebSocket to backend, backend proxies to Deepgram, Deepgram returns per-channel transcripts with word-level timestamps.
2. **Transcript-to-suggestion flow:** Final transcript events fan out via Redis to three parallel consumers (state tracker, intent classifier, card retriever), which all feed into the strategy engine. Strategy engine streams a suggestion through the compliance guardrail to the browser overlay.
3. **Learning flow:** After call ends, full transcript + suggestion log is analyzed by Opus. Insights aggregate across calls. High-performing patterns update the knowledge cards in pgvector, which the card retriever uses on the next call.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-5 reps (day one) | Single Node.js process handles everything. Redis and PostgreSQL can be local or single-instance managed. One Deepgram WebSocket per active call. Opus latency is the bottleneck, not infrastructure. |
| 5-20 reps | Move Redis and PostgreSQL to managed services if not already. Monitor Deepgram concurrent connection limits and Anthropic API rate limits. Consider connection pooling for Anthropic API. No architectural changes needed. |
| 20-100 reps | Separate the Audio Gateway into its own process/service. Add Redis Streams between STT and pipeline for backpressure and durability. Use Haiku for all classification to reduce Opus load. Horizontal scaling for pipeline workers. |

### Scaling Priorities

1. **First bottleneck: Anthropic API rate limits.** With 2-5 reps making concurrent calls, you may hit rate limits on Opus, especially with prompt caching contention. Mitigation: prompt caching (reduces calls), debounced inference (reduces frequency), Haiku for classification (reduces Opus load).
2. **Second bottleneck: Deepgram concurrent connections.** Each active call uses one persistent WebSocket. Deepgram's pay-as-you-go plan supports this fine at small scale, but monitor as team grows.

## Anti-Patterns

### Anti-Pattern 1: Sending Audio Directly from Browser to Deepgram

**What people do:** Connect the browser WebSocket directly to Deepgram's endpoint to skip the backend hop.
**Why it is wrong:** Exposes the Deepgram API key in client-side code. Prevents server-side logging, routing, or middleware. Loses ability to add rate limiting or authentication.
**Do this instead:** Proxy through the backend Audio Gateway. The extra hop adds ~10-30ms, which is negligible in the overall latency budget.

### Anti-Pattern 2: Using Diarization Instead of Multichannel

**What people do:** Mix both audio sources into a single mono channel and use `diarize=true` to separate speakers.
**Why it is wrong:** Diarization is probabilistic. It can mislabel who said what, especially on short utterances ("uh huh", "yeah") or when voices overlap. For a sales copilot that triggers on "customer said X," misattribution causes wrong suggestions. Deepgram's own documentation notes that with two speakers on two channels, diarization correctly identifies each as speaker 0 on their own channel -- confirming multichannel is the right approach.
**Do this instead:** Use `multichannel=true` with 2 channels. Channel 0 = rep (mic), Channel 1 = customer (tab audio). Deterministic, never wrong.

### Anti-Pattern 3: Calling the Strategy Engine on Every Transcript Fragment

**What people do:** Send every interim or final transcript chunk to Opus 4.6 for suggestion generation.
**Why it is wrong:** Opus has ~500-1500ms latency per call. If transcript chunks arrive every 200-300ms, requests queue unboundedly. Cost also explodes -- 200+ Opus calls per call instead of ~20.
**Do this instead:** Only trigger Opus on meaningful events: new intent detected, objection identified, flow position change, or after a 500ms silence debounce. Use Haiku for the high-frequency classification that decides whether Opus should fire.

### Anti-Pattern 4: Unbounded Conversation Context in LLM Prompts

**What people do:** Append every transcript line to the Opus prompt, growing the context window throughout the call.
**Why it is wrong:** A 30-minute call generates ~4500 words (~6000 tokens). Sending all of it every inference call means each call gets slower and more expensive. Eventually hits context limits.
**Do this instead:** Sliding window (last 30-90s raw transcript) + session summary (compressed full-call context). Keep strategy engine input under ~2000 tokens.

### Anti-Pattern 5: Building the Overlay as a Chrome Extension First

**What people do:** Start with a Chrome extension for always-on-top overlay behavior and cross-tab audio access.
**Why it is wrong:** Chrome extensions have complex multi-context architectures (background service worker, content scripts, popup, injected scripts). Chrome Web Store review delays iteration. `getDisplayMedia` audio capture behaves differently in extension vs. regular page contexts. All of this slows down day-one delivery.
**Do this instead:** Start with a separate browser window (via `window.open()`) running the Next.js overlay page. Rep positions it alongside RingCentral. Graduate to the Document Picture-in-Picture API or a Chrome extension later once the pipeline is stable and proven.

### Anti-Pattern 6: Pre-computing Embeddings at Query Time

**What people do:** Generate embeddings for knowledge cards on every retrieval query.
**Why it is wrong:** Embedding generation adds 100-500ms per card. With hundreds of cards, this is untenable in a real-time pipeline.
**Do this instead:** Pre-compute all card embeddings at ingestion/deploy time. At query time, only embed the query text (~10-20ms) and run cosine similarity against pre-computed vectors.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Deepgram** | WebSocket (server-to-server), Nova-3 model | Use `multichannel=true`, `interim_results=true`, `smart_format=true`, `encoding=linear16`, `sample_rate=16000`, `channels=2`. Implement reconnection with exponential backoff (1, 2, 4, 8, 30s). Maintain a rolling buffer of unacknowledged audio chunks to replay after reconnect. |
| **Anthropic (Haiku 4.5)** | REST API with streaming | For intent classification. Use `max_tokens=100`, concise prompts, prompt caching. Target ~50-100ms response time. |
| **Anthropic (Opus 4.6)** | REST API with streaming | For strategy suggestions and post-call analysis. Use prompt caching for the system prompt (playbook + rules). Stream responses for fastest time-to-first-token. |
| **PostgreSQL + pgvector** | Connection pool (pg or Drizzle ORM) | HNSW index for fast ANN search on 1536-dim embeddings. Stores knowledge cards, call history, transcripts, analysis reports. |
| **Redis** | ioredis client | Pub/Sub for event bus, hashes for call state, optional Streams for durable event log. Single instance sufficient for 2-5 reps. |
| **Embedding API** | REST (OpenAI or Voyage AI) | Anthropic does not offer its own embedding model. Use OpenAI `text-embedding-3-small` (1536-dim) or Voyage AI. Only needed at card ingestion time and once per query (~10-20ms). |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Browser audio to Backend | WebSocket (binary frames) | One-directional upstream. 100ms PCM chunks. Backend must handle reconnection gracefully. |
| Backend to Browser UI | WebSocket (JSON events) | One-directional downstream. Event types: `suggestion`, `call-state-update`, `compliance-alert`, `transcript`, `error`. |
| Audio Gateway to Deepgram | WebSocket (binary frames) | Server-to-server. Gateway is a thin proxy. Must handle Deepgram disconnections and reconnect with audio replay buffer. |
| Pipeline stages to each other | Redis Pub/Sub | Loose coupling. Each stage subscribes to input channels, publishes to output channels. Orchestrator adds/removes stages without rewiring. |
| Pipeline to Data stores | Direct DB calls | pgvector queries, Redis reads/writes. No additional messaging layer needed. |
| Real-time pipeline to Learning loop | Shared PostgreSQL | Real-time pipeline writes transcripts and suggestion logs. Learning loop reads them asynchronously after call ends. No direct coupling. |

## Browser Audio Capture: Critical Constraints

This section documents platform-specific constraints discovered during research that directly affect architecture decisions.

### getDisplayMedia Audio Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| **User must grant tab-share permission every session** | Cannot persist `getDisplayMedia` permission. Rep must click "Share tab" at the start of each call session. | Design a clear onboarding flow. Once sharing is active, it persists for the browser session. |
| **Audio is optional even when requested** | Browser MAY omit audio track from `getDisplayMedia` even with `audio: true`. | Check `stream.getAudioTracks().length > 0` after sharing. Show error state if no audio track. |
| **Firefox does not support getDisplayMedia audio** | Firefox will not capture tab audio. | Chrome-only requirement. Document this constraint. RingCentral web app runs in Chrome. |
| **Bluetooth headphone device changes can mute system audio** | USB headset connect/disconnect during screen sharing can mute the shared audio track silently. Tab audio is NOT affected. | Use tab-level audio sharing (not system audio). Monitor `track.muted` events. Auto-reconnect if muting detected. |
| **Mic + system audio conflict** | `getUserMedia` mic and `getDisplayMedia` system audio may not work simultaneously on some platforms. | Use Web Audio API to merge both streams. Capture tab audio (not system audio) to avoid this conflict. |
| **getDisplayMedia requires video: true** | The API rejects calls without a video track request, even if you only want audio. | Request `{ video: true, audio: true }`, then discard the video track immediately. |

### Recommended Audio Capture Strategy

Use **tab audio sharing** (not system audio) via `getDisplayMedia`. This avoids bluetooth muting issues and mic conflicts. The rep shares the RingCentral browser tab specifically, which captures the customer's voice from that tab's audio output. Combined with `getUserMedia` for the rep's mic, merged via Web Audio API's `ChannelMergerNode`.

```typescript
// 1. Get mic stream
const micStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000
  }
});

// 2. Get tab audio (user selects the RingCentral tab)
const displayStream = await navigator.mediaDevices.getDisplayMedia({
  video: true,   // Required by API, will be discarded
  audio: true    // Tab audio capture
});

// 3. Verify audio track exists
const tabAudioTracks = displayStream.getAudioTracks();
if (tabAudioTracks.length === 0) {
  throw new Error('No audio track from tab sharing. Ensure you selected "Share tab audio".');
}

// 4. Discard video track (not needed)
displayStream.getVideoTracks().forEach(track => track.stop());

// 5. Merge into 2-channel PCM via Web Audio API
const audioCtx = new AudioContext({ sampleRate: 16000 });
const merger = audioCtx.createChannelMerger(2);
const micSource = audioCtx.createMediaStreamSource(micStream);
const tabSource = audioCtx.createMediaStreamSource(
  new MediaStream(tabAudioTracks)
);
micSource.connect(merger, 0, 0);  // Ch0 = rep
tabSource.connect(merger, 0, 1);  // Ch1 = customer
```

## Build Order (Dependency Chain for Roadmap)

The following build order reflects true technical dependencies. Each phase requires the previous one to function.

```
Phase 1: Audio Capture + STT Pipeline
  [Browser audio capture] --> [Audio Gateway] --> [Deepgram STT]
  WHY FIRST: Everything downstream depends on having transcripts.
  DELIVERABLE: Can hear both sides of a call as live text on screen.
  RISK: getDisplayMedia permission UX, bluetooth headphone edge cases.

Phase 2: Knowledge Base + Retrieval
  [Playbook data ingestion] --> [pgvector storage] --> [Script Card Retriever]
  WHY SECOND: The strategy engine needs cards to generate useful suggestions.
  DELIVERABLE: Can search the playbook by semantic query.
  RISK: Chunking strategy for the 14-angle playbook.

Phase 3: Call State + Intent Pipeline
  [Call State Tracker] --> [Intent Classifier] --> [Redis event bus wiring]
  WHY THIRD: Strategy engine needs to know where we are in the flow.
  DELIVERABLE: System tracks which angle/position the call is in.
  RISK: Mapping free-form conversation to structured flow positions.

Phase 4: Strategy Engine + Overlay UI
  [Strategy Engine (Opus)] --> [Compliance Guardrail] --> [WebSocket push] --> [React Overlay]
  WHY FOURTH: This is the core value -- suggestions appearing on screen during a live call.
  DELIVERABLE: Live suggestions during a real call.
  RISK: Latency budget. This is where the 2-second target gets tested end-to-end.

Phase 5: Post-Call Analysis + Learning Loop
  [Call Analyzer] --> [Pattern Miner] --> [Knowledge Updater]
  WHY LAST: Improvement requires call data to exist first.
  DELIVERABLE: System gets better over time based on real call outcomes.
  RISK: Feedback loop quality -- bad analysis leads to degraded suggestions.
```

**Critical path for "day-one ready":** Phases 1 through 4 must all be functional (even if minimal) for the system to provide value on a real call. Phase 5 can be deferred, but data capture (transcripts, suggestion logs, call outcomes) should begin from day one so the learning loop has material when it is built.

**Suggested phase ordering rationale:** Each phase produces a testable artifact that the next phase consumes. Phase 1 produces transcripts (testable alone). Phase 2 produces searchable knowledge (testable alone). Phase 3 produces call state tracking (testable with Phase 1 output). Phase 4 produces suggestions (testable with all prior phases). Phase 5 is additive improvement.

## Key Architectural Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Audio capture approach | `getDisplayMedia` (tab audio) + `getUserMedia` (mic) merged via Web Audio API | Gives deterministic 2-channel audio. Tab sharing captures customer voice from RingCentral. |
| Speaker separation | Deepgram multichannel, not diarization | Deterministic channel-to-speaker mapping eliminates misattribution. |
| Event architecture | Redis Pub/Sub | Lightweight, sub-millisecond, sufficient for 2-5 concurrent calls. Upgrade to Streams later if durability needed. |
| LLM tier split | Haiku for classification, Opus for generation | Keeps pipeline under 2s. Start Opus-only for day one, add Haiku when latency tightens. |
| Overlay implementation | Separate browser window (Next.js page) | Faster to build than Chrome extension, no Web Store friction, easier to iterate. |
| Embedding model | OpenAI `text-embedding-3-small` or Voyage AI (1536-dim) | Anthropic has no embedding model. pgvector works well at 1536 dimensions with HNSW. |
| Audio encoding | PCM 16-bit linear, 16kHz, 2 channels | Deepgram's recommended format for streaming. No codec overhead. |
| WebSocket topology | Two connections: one binary (audio up), one JSON (events down) | Avoids head-of-line blocking between high-frequency audio frames and low-frequency JSON events. |

## Sources

- [Deepgram: Multichannel vs Diarization](https://developers.deepgram.com/docs/multichannel-vs-diarization) -- HIGH confidence
- [Deepgram: Measuring Streaming Latency](https://developers.deepgram.com/docs/measuring-streaming-latency) -- HIGH confidence
- [Deepgram: Streaming Speech Recognition API](https://deepgram.com/learn/streaming-speech-recognition-api) -- HIGH confidence
- [Deepgram: Low Latency Voice AI](https://deepgram.com/learn/low-latency-voice-ai) -- HIGH confidence
- [MDN: getDisplayMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) -- HIGH confidence
- [MDN: Using the Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture) -- HIGH confidence
- [Paul Kinlan: Merging Desktop Audio + Mic with Web Audio API](https://paul.kinlan.me/screen-recorderrecording-microphone-and-the-desktop-audio-at-the-same-time/) -- MEDIUM confidence
- [Anthropic: Reducing Latency](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency) -- HIGH confidence
- [SigNoz: Claude API Latency Optimization](https://signoz.io/guides/claude-api-latency/) -- MEDIUM confidence
- [Event-Driven Architectures for Real-Time AI](https://launchcodex.com/blog/web-digital-infrastructure/event-driven-architectures-real-time-ai-processing/) -- MEDIUM confidence
- [Redis: Automate Sales Infrastructure](https://redis.io/blog/automate-sales-infrastructure-speed-revenue/) -- MEDIUM confidence
- [Perficient: Postgres RAG Stack with pgvector](https://blogs.perficient.com/2025/07/17/postgres-typescript-rag-stack/) -- MEDIUM confidence
- [DEV: Hybrid Search Engine for AI Memory (pgvector)](https://dev.to/jakob_sandstrm_a11b3056c/under-the-hood-building-a-hybrid-search-engine-for-ai-memory-nodejs-pgvector-3c5k) -- MEDIUM confidence
- [webrtcHacks: Video Call Helper Chrome Extension Architecture](https://github.com/webrtcHacks/videoCallHelper) -- MEDIUM confidence
- [Datagrid: Self-Improving AI Agents with Feedback Loops](https://datagrid.com/blog/7-tips-build-self-improving-ai-agents-feedback-loops) -- MEDIUM confidence
- [OpenAI Cookbook: Self-Evolving Agents](https://developers.openai.com/cookbook/examples/partners/self_evolving_agents/autonomous_agent_retraining) -- MEDIUM confidence
- [getDisplayMedia Bluetooth/USB Audio Issue](https://groups.google.com/g/discuss-webrtc/c/1c3lhtlyYQ8) -- HIGH confidence (firsthand bug report)
- [AddPipe: getDisplayMedia Audio Demo](https://addpipe.com/getdisplaymedia-demo/) -- MEDIUM confidence

---
*Architecture research for: Real-time AI call copilot for life insurance sales*
*Researched: 2026-03-26*
