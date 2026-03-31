# Project State

## Current Milestone: v1.0 — Core Call Copilot MVP

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Foundation & Infrastructure | ✅ Complete |
| 2 | Audio Capture Pipeline | ✅ Complete |
| 3 | Real-Time AI Suggestions Engine | ✅ Complete |
| 4 | Product Knowledge Base & Vector Search | ✅ Complete |
| 5 | Call Session Management | ✅ Complete |
| 6 | Agent Authentication & Multi-Tenancy | ⏳ Pending |
| 7 | Compliance & Script Guidance | ⏳ Pending |
| 8 | Analytics Dashboard | ⏳ Pending |
| 9 | Performance & Reliability | ⏳ Pending |
| 10 | Deployment & CI/CD | ⏳ Pending |

## Current Phase: 6 — Agent Authentication & Multi-Tenancy

### What Was Done in Phase 5
- `/dashboard/history` page: session table with duration, transcript count, suggestions count
- `/dashboard/sessions/[id]` page: transcript replay (chat bubbles), AI suggestion sidebar, metadata cards
- `/api/sessions/[id]/export` GET: plain-text transcript download
- `src/lib/utils/format.ts`: formatDuration, formatDate, formatPhone utilities
- `<ProspectInfoForm>`: collects name/phone before call starts
- Dashboard page updated with live stats from DB (async server component)
- Nav updated with History link

### What Was Done in Phase 4
- `src/lib/embeddings/client.ts`: Anthropic voyage-3 embedding API wrapper
- `src/lib/embeddings/pipeline.ts`: `embedProduct`, `embedKnowledgeEntry`, `embedAll` batch runner
- `src/lib/db/search.ts`: `semanticSearch`, `searchProducts`, `searchKnowledge` — pgvector cosine similarity queries
- `prisma/seed.ts`: 5 insurance products + 8 knowledge base entries (objections, compliance, scripts, FAQ)
- `scripts/embed-all.ts`: CLI script for batch embedding (`npm run db:embed`)
- `/api/search` GET endpoint: semantic search across products + knowledge
- `/api/products` GET/POST endpoints with auto-embedding on create
- `/api/knowledge` GET/POST endpoints with auto-embedding on create
- `suggestionEngine.ts` updated: vector search grounds Claude suggestions with relevant product/KB context

### What Was Done in Phase 3
- `triggerDetector.ts`: keyword matching for 4 suggestion types (objection_handler, product_info, compliance, tip)
- `transcriptBuffer.ts`: per-session sliding window (20 segments), formats context for Claude
- `suggestionEngine.ts`: orchestrates trigger detection → Claude API → DB persistence → WebSocket delivery; 8s debounce
- `audioHandler.ts` updated: calls `processFinalTranscript` after final transcript saved
- `<SuggestionCard>`: styled card with type badge, content, dismiss/accept actions
- `<SuggestionPanel>`: list of cards with listening state, accept API calls
- `<CallView>`: two-column layout (transcript + suggestions panel)
- `/api/sessions/[id]/suggestions/[suggestionId]` PATCH endpoint
- Unit tests for triggerDetector and transcriptBuffer

### What Was Done in Phase 2
- `useAudioCapture` hook: MediaRecorder + mic permission, 250ms PCM chunks, base64 transport
- `useWebSocket` hook: reconnection logic, JSON message parsing
- `useCallSession` hook: orchestrates audio + WS + session lifecycle
- WebSocket server (`src/server/`) on port 3001: session manager, audio handler, Deepgram client
- Deepgram streaming STT: nova-2 model, 16kHz, interim + final transcripts
- Transcript segments persisted to PostgreSQL via Prisma
- Redis pub/sub: bridges WS server transcripts to Next.js
- `<TranscriptFeed>`, `<AudioControls>`, `<CallSession>` components
- `/api/sessions` REST endpoints (POST create, GET list, GET by id)
- `/dashboard/call` page: live call interface
- Unit tests for audioHandler and useAudioCapture

### Last Updated
2026-03-31

### Notes
- WebSocket server runs on port 3001 (separate from Next.js on 3000)
- Audio format: 16kHz PCM16 for Deepgram compatibility
- Redis pub/sub used to bridge WS server events to Next.js API routes
