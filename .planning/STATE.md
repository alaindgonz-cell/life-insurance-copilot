# Project State

## Current Milestone: v1.0 — Core Call Copilot MVP

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Foundation & Infrastructure | ✅ Complete |
| 2 | Audio Capture Pipeline | ✅ Complete |
| 3 | Real-Time AI Suggestions Engine | ⏳ Pending |
| 4 | Product Knowledge Base & Vector Search | ⏳ Pending |
| 5 | Call Session Management | ⏳ Pending |
| 6 | Agent Authentication & Multi-Tenancy | ⏳ Pending |
| 7 | Compliance & Script Guidance | ⏳ Pending |
| 8 | Analytics Dashboard | ⏳ Pending |
| 9 | Performance & Reliability | ⏳ Pending |
| 10 | Deployment & CI/CD | ⏳ Pending |

## Current Phase: 3 — Real-Time AI Suggestions Engine

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
