<!-- GSD:project-start source:PROJECT.md -->
## Project

**Life Insurance Call Copilot**

A real-time AI copilot that listens to live insurance calls via browser audio capture, tracks where the rep is in a detailed sales flow, and delivers contextual suggestions — what to say next, how to handle objections, and when compliance guardrails apply. It runs as a floating overlay on top of the rep's RingCentral web app. Built for a small team (2-5 reps) selling life insurance policies on inbound service calls.

**Core Value:** The rep never freezes on a call — the copilot always knows where they are in the flow and what to say next, increasing service-to-sale conversions while staying compliant.

### Constraints

- **Latency**: Suggestions must appear within ~2 seconds of relevant conversation moment — useless if slow
- **Audio**: Browser audio capture (Web Audio API / getDisplayMedia for tab, getUserMedia for mic) — bluetooth headphone routing must work
- **Model**: Claude Opus 4.6 as the single AI model for all inference (intent classification, suggestions, compliance, post-call analysis)
- **Day-one ready**: Must be functional for real calls tomorrow — base model with the full playbook loaded
- **Tech stack**: Next.js (React) frontend, Node.js backend, PostgreSQL + pgvector for knowledge retrieval, Redis for event bus, Deepgram for STT
- **Team size**: 2-5 reps initially, single-user auth sufficient for v1
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.5.x (LTS) | Frontend framework + API routes | Stable LTS with Turbopack, App Router mature. Next.js 16 is too fresh (16.2.1 released days ago) -- stick with battle-tested 15.x LTS for a production copilot. | HIGH |
| React | 19.x | UI rendering | Ships with Next.js 15. Concurrent features enable non-blocking UI updates for real-time overlay. | HIGH |
| TypeScript | 5.7+ | Type safety | Non-negotiable for a real-time system with multiple data flows. Catches WebSocket message shape bugs at compile time. | HIGH |
| Node.js | 20 LTS | Backend runtime | Recommended for production in 2026. Gets security patches through late 2026. Native WebSocket support, excellent streaming perf. | HIGH |
### Speech-to-Text
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Deepgram Nova-3 | Latest (API) | Real-time streaming STT | Sub-300ms latency, 94%+ accuracy, native speaker diarization (`diarize=true`), interim results for fast feedback. Best-in-class for real-time call transcription. | HIGH |
| @deepgram/sdk | 4.11.x | Node.js Deepgram client | Official SDK with V2 WebSocket API (`listen.v2.connect()`), typed events, reconnection handling. Isomorphic -- works in browser and Node. | HIGH |
### AI Model
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Claude Opus 4.6 | API (latest) | All inference: intent classification, suggestions, compliance, post-call analysis | Project constraint. Highest quality reasoning. Use prompt caching aggressively -- system prompt + playbook as cached prefix saves 90% cost and 85% latency on repeated calls. | HIGH |
| @anthropic-ai/sdk | 0.39.x | Node.js Anthropic client | Official SDK with streaming support, typed responses, automatic retries. ~7M weekly npm downloads. | HIGH |
### Database
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16+ | Primary data store | Transcripts, call records, agent learning data. Rock-solid, and pgvector lives inside it -- one database, not two. | HIGH |
| pgvector | 0.8.2 | Vector similarity search | Knowledge card retrieval via cosine similarity on embeddings. HNSW index for sub-10ms nearest-neighbor queries. Iterative scan feature (0.8.0+) prevents overfiltering. | HIGH |
| Drizzle ORM | 0.45.x | Database ORM | Native `vector` column type, built-in `cosineDistance`/`l2Distance` functions, HNSW index definitions in schema. Zero dependencies, 7.4kb. First-class pgvector support unlike Prisma which still requires raw SQL for vectors. | HIGH |
| drizzle-kit | 0.45.x | Migrations | Schema-driven migrations, introspection, push-based dev workflow. | HIGH |
### Caching & Event Bus
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Redis | 7.x | Pub/Sub event bus + session cache | Fire-and-forget Pub/Sub for broadcasting transcription events, suggestion updates, and flow state changes between services. Also caches active call state for fast reads. | HIGH |
| ioredis | 5.10.x | Node.js Redis client | Mature, full-featured (Pub/Sub, Streams, pipelining, Lua scripting). 12M+ weekly downloads. Note: maintainers recommend node-redis for new projects, but ioredis has better Pub/Sub ergonomics and is battle-tested. | MEDIUM |
### Real-Time Communication
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ws | 8.20.x | WebSocket server | Fastest, most downloaded Node.js WebSocket library (35M weekly downloads). Raw protocol control needed for audio streaming -- Socket.IO's abstraction layer adds unnecessary overhead for this use case. | HIGH |
| Web Audio API | Browser native | Audio capture & mixing | Combine mic (getUserMedia) + tab audio (getDisplayMedia) into unified stream. AudioContext for real-time processing, gain control, and format conversion before sending to Deepgram. | HIGH |
### Browser Audio Capture
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| getUserMedia | Browser native | Microphone capture | Captures rep's voice including bluetooth headphones. Well-supported across all modern browsers. | HIGH |
| getDisplayMedia | Browser native | Tab audio capture | Captures customer's voice from RingCentral tab audio. Chrome/Edge only for audio -- this is acceptable since reps use Chrome on desktop. Requires user to select "Share tab audio" checkbox. | HIGH |
| MediaRecorder API | Browser native | Audio encoding | Encode mixed audio stream to opus/webm for efficient WebSocket transmission to backend. | HIGH |
### Supporting Libraries
| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| pgvector (npm) | 0.2.x | Vector encoding helpers | Encoding/decoding float arrays for pgvector queries alongside Drizzle | HIGH |
| zod | 3.24.x | Runtime validation | Validate WebSocket message shapes, API payloads, Claude response parsing | HIGH |
| zustand | 5.x | Client state management | Lightweight store for call state, transcript buffer, current suggestions. No Redux bloat for a focused overlay app. | HIGH |
| tailwindcss | 4.x | Styling | Utility-first CSS for rapid overlay UI development. v4 with Oxide engine is fast. | MEDIUM |
| shadcn/ui | latest | UI components | Copy-paste components (not a dependency). Cards, badges, scrollable areas for the overlay. | MEDIUM |
| pino | 9.x | Structured logging | Fast JSON logger for Node.js. Essential for debugging real-time audio pipeline issues. | HIGH |
| dotenv | 16.x | Environment config | API keys for Deepgram, Anthropic, database URLs | HIGH |
### DevOps & Infrastructure
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Docker + Docker Compose | Latest | Local dev environment | PostgreSQL, Redis, and app services in containers. Reproducible setup. | HIGH |
| pnpm | 9.x | Package manager | Faster installs, strict dependency resolution, disk-efficient. | MEDIUM |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| STT | Deepgram Nova-3 | AssemblyAI, Google Cloud STT, Whisper | Deepgram has lowest latency for real-time streaming (<300ms). AssemblyAI comparable but Deepgram's diarization + interim results are more mature for live calls. Whisper is offline-only. |
| ORM | Drizzle | Prisma | Prisma requires raw SQL for pgvector operations (native support still in beta/Prisma Next). Drizzle has first-class vector types, distance functions, and index definitions in schema today. |
| WebSocket | ws | Socket.IO | Socket.IO adds ~50KB client bundle, automatic reconnection, rooms, and fallback transports we don't need. Raw ws gives us control over the audio binary streaming protocol. Lower overhead = lower latency. |
| State Mgmt | Zustand | Redux, Jotai | Redux is overkill for a focused overlay app. Zustand is 1.2KB, no boilerplate, supports subscriptions for real-time updates. |
| Redis Client | ioredis | node-redis | ioredis has more intuitive Pub/Sub API (separate subscriber instances), better documented patterns for event bus architecture. node-redis is "officially recommended" but ioredis is still actively maintained (v5.10.1, 5 days ago). |
| Framework | Next.js 15 LTS | Next.js 16, Remix, Vite+React | Next.js 16 is too new (weeks old). Remix/Vite lack the API route integration we need. Next.js 15 LTS gets security patches and is production-proven. |
| Vector DB | pgvector (in PostgreSQL) | Pinecone, Weaviate, Qdrant | One database to manage, not two. pgvector 0.8.2 with HNSW achieves 28x lower p95 latency than Pinecone (with pgvectorscale). For 2-5 reps and a bounded knowledge base, pgvector is more than sufficient. |
## Architecture-Critical Stack Decisions
### Audio Pipeline (Browser to Deepgram)
### Latency Budget (< 2 seconds end-to-end)
| Stage | Target | Technology |
|-------|--------|------------|
| Audio capture + encode | ~50ms | Web Audio API + MediaRecorder |
| Network to backend | ~30ms | WebSocket (binary frames) |
| Backend to Deepgram | ~20ms | WebSocket forwarding |
| Deepgram transcription | ~200-300ms | Nova-3 streaming |
| Claude inference | ~800-1200ms | Opus 4.6 with prompt caching |
| Response to client | ~30ms | WebSocket |
| **Total** | **~1130-1630ms** | **Within 2s budget** |
### Prompt Caching Strategy (Critical for Latency)
- **System prompt + full playbook** (~5-10K tokens): Cache as static prefix. 85% latency reduction on cache hits.
- **Cache TTL**: 5-minute default is perfect for active calls (continuous requests keep cache warm).
- **Cache hierarchy**: tools > system > messages. Never change system prompt mid-call.
- **Minimum cacheable prefix**: 1,024 tokens. The playbook easily exceeds this.
- **Cost impact**: Cache reads are 0.1x base price. For an active call making requests every few seconds, this drops cost by ~90%.
## Installation
# Initialize project
# Core dependencies
# Database
# Dev dependencies
## Environment Variables Required
# AI
# Speech-to-Text
# Database
# Redis
# App
## Sources
- [Deepgram Speaker Diarization Docs](https://developers.deepgram.com/docs/diarization)
- [Deepgram Nova-3 STT Benchmarks](https://deepgram.com/learn/speech-to-text-benchmarks)
- [Deepgram JS SDK (npm)](https://www.npmjs.com/package/@deepgram/sdk)
- [Next.js 15.5 Release](https://nextjs.org/blog/next-15-5)
- [Next.js 16 Release / npm](https://www.npmjs.com/package/next)
- [pgvector 0.8.2 Release](https://www.postgresql.org/about/news/pgvector-082-released-3245/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Drizzle ORM pgvector Guide](https://orm.drizzle.team/docs/guides/vector-similarity-search)
- [Drizzle ORM (npm)](https://www.npmjs.com/package/drizzle-orm)
- [Anthropic Claude SDK (npm)](https://www.npmjs.com/package/@anthropic-ai/sdk)
- [Claude Prompt Caching Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Claude API Pricing 2026](https://www.metacto.com/blogs/anthropic-api-pricing-a-full-breakdown-of-costs-and-integration)
- [ws WebSocket Library (npm)](https://www.npmjs.com/package/ws)
- [ioredis (npm)](https://www.npmjs.com/package/ioredis)
- [MDN getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
- [getDisplayMedia Audio Capture Support](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia_audio_capture_support)
- [addpipe getDisplayMedia Demo](https://addpipe.com/getdisplaymedia-demo/)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
