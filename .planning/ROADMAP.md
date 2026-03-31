# Life Insurance Copilot — v1.0 Roadmap

## Milestone: v1.0 — Core Call Copilot MVP

### Phase 1: Project Foundation & Infrastructure ✅
**Status**: Complete
**Goal**: Scaffold Next.js project, set up DB schema, configure all integrations

Success Criteria:
- [x] Next.js 14 project scaffolded with TypeScript + Tailwind
- [x] Prisma schema with all core models (User, CallSession, Transcript, AISuggestion, Product, KnowledgeBase)
- [x] Docker Compose for PostgreSQL + pgvector + Redis
- [x] Base lib clients: Prisma, Redis, Deepgram, Claude
- [x] CLAUDE.md with full project context
- [x] .env.example with all required variables

---

### Phase 2: Audio Capture Pipeline ✅
**Status**: Complete
**Goal**: Browser captures microphone audio and streams it to the server via WebSocket; server forwards to Deepgram STT and returns real-time transcriptions

Success Criteria:
- [x] `useAudioCapture` hook: requests mic permission, captures PCM audio chunks via MediaRecorder
- [x] WebSocket client connects to ws-server with session authentication
- [x] WebSocket server (ws library) accepts audio chunks per session
- [x] Deepgram streaming STT integration: forwards audio → receives transcripts
- [x] Transcript segments saved to PostgreSQL via Prisma
- [x] Real-time transcript pushed back to browser via WebSocket
- [x] `<CallSession>` component shows live transcript feed
- [x] Unit tests for WebSocket message handling

---

### Phase 3: Real-Time AI Suggestions Engine ✅
**Status**: Complete
**Goal**: Claude analyzes live transcript and surfaces contextual suggestions

Success Criteria:
- [x] Sliding window transcript buffer (last N turns) sent to Claude
- [x] Suggestion types: product_info, objection_handler, compliance, tip
- [x] Trigger detection: keyword/semantic matching to fire suggestions
- [x] Suggestions streamed back to UI via WebSocket
- [x] `<SuggestionPanel>` component renders suggestion cards
- [x] Agent can accept/dismiss suggestions; actions recorded in DB
- [x] Debounce logic prevents suggestion spam

---

### Phase 4: Product Knowledge Base & Vector Search ✅
**Status**: Complete
**Goal**: pgvector-powered semantic search over insurance products and scripts

Success Criteria:
- [x] Products and KnowledgeBase records seeded with embeddings
- [x] `/api/search` endpoint: semantic search via pgvector cosine similarity
- [x] Claude uses search results to ground product suggestions
- [x] Admin UI to add/edit knowledge base entries
- [x] Embedding pipeline: auto-generate embeddings on content save

---

### Phase 5: Call Session Management
**Status**: Pending
**Goal**: Full lifecycle management of call sessions

Success Criteria:
- [ ] Start/end call session flow in UI
- [ ] Session timer and status indicator
- [ ] Prospect info capture (name, phone) before call
- [ ] Call history page with session list
- [ ] Session detail page with full transcript replay
- [ ] Export transcript as PDF/text

---

### Phase 6: Agent Authentication & Multi-Tenancy
**Status**: Pending
**Goal**: NextAuth.js login, role-based access, team management

Success Criteria:
- [ ] Email/password login via NextAuth credentials provider
- [ ] Agent and Manager roles
- [ ] Managers can view all agents' call history
- [ ] Session isolation: agents only see their own active sessions

---

### Phase 7: Compliance & Script Guidance
**Status**: Pending
**Goal**: Real-time compliance monitoring and script adherence

Success Criteria:
- [ ] Compliance rule engine: flags forbidden phrases
- [ ] Required disclosure prompts at key conversation moments
- [ ] Script checklist: tracks which talking points were covered
- [ ] Compliance score per call session

---

### Phase 8: Analytics Dashboard
**Status**: Pending
**Goal**: Aggregate metrics on call performance and AI usage

Success Criteria:
- [ ] Calls per day/week chart
- [ ] Average call duration
- [ ] Top objections encountered
- [ ] Suggestions accepted rate
- [ ] Agent leaderboard

---

### Phase 9: Performance & Reliability
**Status**: Pending
**Goal**: Production-ready reliability and performance

Success Criteria:
- [ ] WebSocket reconnection with exponential backoff
- [ ] Redis pub/sub for horizontal scaling of WS server
- [ ] Database connection pooling configured
- [ ] Error boundaries and graceful degradation in UI
- [ ] Structured logging with request IDs

---

### Phase 10: Deployment & CI/CD
**Status**: Pending
**Goal**: Production deployment pipeline

Success Criteria:
- [ ] Dockerfile for Next.js app
- [ ] Dockerfile for WS server
- [ ] GitHub Actions CI: lint + test on PR
- [ ] Production environment variables documented
- [ ] Health check endpoints
- [ ] Database migration workflow for production
