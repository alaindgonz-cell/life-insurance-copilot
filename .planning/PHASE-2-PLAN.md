# Phase 2 Execution Plan: Audio Capture Pipeline

## Overview
Build the real-time audio pipeline from browser microphone → WebSocket → Deepgram STT → transcript storage → UI display.

## Architecture

```
Browser
  └─ useAudioCapture hook (MediaRecorder, 16kHz PCM)
       └─ useWebSocket hook (WebSocket client)
            └─ WS Server (port 3001)
                 ├─ Deepgram Streaming STT
                 │    └─ transcript → Redis pub/sub → WS Server → Browser
                 └─ Prisma → PostgreSQL (transcript storage)
```

## Files to Create

### Hooks (Frontend)
1. `src/hooks/useAudioCapture.ts` — MediaRecorder hook
2. `src/hooks/useWebSocket.ts` — WebSocket client hook
3. `src/hooks/useCallSession.ts` — Orchestrates audio + WS + session state

### WebSocket Server
4. `src/server/index.ts` — WS server entry point
5. `src/server/sessionManager.ts` — Track active sessions and connections
6. `src/server/audioHandler.ts` — Handle audio chunks, forward to Deepgram
7. `src/server/deepgramClient.ts` — Deepgram streaming connection per session

### Components
8. `src/components/call/CallSession.tsx` — Main call UI
9. `src/components/call/TranscriptFeed.tsx` — Live scrolling transcript
10. `src/components/call/AudioControls.tsx` — Mic on/off, start/end call buttons

### API Routes
11. `src/app/api/sessions/route.ts` — POST to create session, GET to list
12. `src/app/api/sessions/[id]/route.ts` — GET session details

### Pages
13. `src/app/(dashboard)/call/page.tsx` — Call interface page

### Tests
14. `src/server/__tests__/audioHandler.test.ts`
15. `src/hooks/__tests__/useAudioCapture.test.ts`

## Implementation Notes

### Audio Capture
- Use MediaRecorder with `audio/webm;codecs=opus` or `audio/pcm`
- Chunk interval: 250ms for low latency
- Convert to base64 for WebSocket transport
- Sample rate: 16000 Hz (Deepgram requirement)

### WebSocket Protocol
Messages are JSON with `{ type, payload }` structure:
- Client → Server: `session_start`, `audio_chunk`, `session_end`
- Server → Client: `transcript`, `suggestion`, `error`, `session_ready`

### Deepgram Config
- Model: nova-2
- Language: en-US
- Smart format: true
- Interim results: true (for low-latency display)
- Endpointing: 300ms

### Transcript Storage
- Save final (non-interim) transcript segments to DB
- Speaker diarization: initial phase uses "agent" as default speaker
