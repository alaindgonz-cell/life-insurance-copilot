# Phase 1: Infrastructure & Project Foundation - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

The project has a working development environment with a clean LLM abstraction that any downstream component can call. Next.js application runs locally with PostgreSQL and Redis accessible via Docker Compose. An LLM call can be made through the provider abstraction and returns a response from Claude. The LLM provider can be switched from Anthropic to OpenRouter via environment variable. Different inference roles can be configured to use different models.

</domain>

<decisions>
## Implementation Decisions

### LLM Abstraction Design
- **D-01:** Factory pattern — `createLLMClient('classification')` returns a configured client based on the inference role. Each role maps to a provider+model in config.
- **D-02:** Claude's discretion on inference role definitions — use typed enum roles (e.g., 'classification', 'suggestion', 'guardrail', 'post-call-analysis') with type-safe mapping to provider+model combos.
- **D-03:** Prompt caching built in from day one. The factory marks system prompts with `cache_control` automatically when using Anthropic. The playbook (~5-10K tokens) stays cached across calls during a live call for 90% cost reduction and 85% latency reduction.
- **D-04:** Streaming-first — the factory returns a stream by default. Critical for the real-time suggestion pipeline.
- **D-05:** Automatic silent fallback to Mimo v2 Pro via OpenRouter when Claude hits rate limits or timeouts. Log the fallback but don't interrupt the rep mid-call.
- **D-06:** Tool use (function calling) supported from day one. The call flow engine (Phase 4) will need structured JSON output for angle detection and flow tracking.
- **D-07:** Two models pre-configured: Claude Opus 4.6 (primary) and Mimo v2 Pro via OpenRouter (fallback). Add more later as needed.

### Project Structure
- **D-08:** Single Next.js app with App Router and clean internal boundaries. Services in `src/lib/services/`, no monorepo overhead at this team scale. Professional internal organization without unnecessary ceremony.
- **D-09:** Separate Node.js WebSocket server in `src/server/` for audio streaming. Runs alongside Next.js as a separate process. Both start via one command (`pnpm dev`).
- **D-10:** Core database tables defined in Phase 1 with Drizzle ORM: calls, transcripts, knowledge_cards, llm_logs. Other phases add columns/tables as needed.

### Docker & Local Dev Setup
- **D-11:** Docker Compose runs PostgreSQL (with pgvector) and Redis only. Next.js and the WebSocket server run natively on the machine with hot reload for fastest dev feedback.
- **D-12:** Seed script included (`pnpm db:seed`) with sample data reflecting the actual 14-angle playbook structure and realistic call scenarios, so the LLM abstraction can be verified with representative data.

### Config & Environment Strategy
- **D-13:** Typed config module (`src/lib/config.ts`) reads `.env` vars, validates with Zod at startup, and exports typed config. Crashes early if required vars are missing. `.env.example` documents all required variables.
- **D-14:** LLM model-per-role mapping lives in `.env` variables: `LLM_CLASSIFICATION_MODEL`, `LLM_SUGGESTION_MODEL`, `LLM_FALLBACK_PROVIDER`, etc.

### Claude's Discretion
- Exact inference role enum values and their mapping structure
- Internal folder layout within `src/` beyond the decided boundaries
- Seed data content — should reflect the 14-angle playbook structure with realistic scenarios
- Database table column definitions for the core tables
- pnpm scripts beyond `dev`, `build`, `db:seed`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tech Stack
- `CLAUDE.md` — Full technology stack decisions, version pinning, architecture-critical choices, latency budget, prompt caching strategy

### Requirements
- `.planning/REQUIREMENTS.md` §Infrastructure — INF-01 (provider abstraction), INF-02 (per-role model config), INF-03 (env-based API keys)

### Project Vision
- `.planning/PROJECT.md` — Core value, constraints (latency, audio capture, model choice, day-one readiness), key decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — project is empty (only CLAUDE.md exists)

### Established Patterns
- None — this is the foundation phase that establishes all patterns

### Integration Points
- The LLM abstraction will be consumed by every downstream phase (transcription, flow engine, suggestions, guardrails, post-call analysis)
- The WebSocket server will be extended in Phase 2 (audio capture) and Phase 3 (transcription)
- The database schema will be extended in every subsequent phase

</code_context>

<specifics>
## Specific Ideas

- The user wants a very effective and professional tool — architecture should reflect production-grade quality even at small scale
- Automatic silent fallback is critical: if Claude is rate-limited mid-call, the rep should never notice a disruption
- The 14-angle playbook is central to the entire system — seed data should reflect its structure so verification is meaningful
- Day-one readiness is a hard constraint — the foundation must be solid enough that subsequent phases can build fast

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-infrastructure-project-foundation*
*Context gathered: 2026-03-26*
