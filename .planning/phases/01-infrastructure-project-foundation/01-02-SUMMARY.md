---
phase: 01-infrastructure-project-foundation
plan: 02
subsystem: infra
tags: [anthropic, openrouter, llm, streaming, prompt-caching, factory-pattern, fallback]

# Dependency graph
requires:
  - phase: 01-infrastructure-project-foundation/plan-01
    provides: config module (env vars), logger, db module, llm_logs schema
provides:
  - createLLMClient factory function with streaming-first interface
  - InferenceRole typed enum (classification, suggestion, guardrail, post-call-analysis, generation)
  - Role-to-provider+model config map reading from env vars
  - Automatic cache_control injection for Anthropic system prompts
  - Silent fallback to OpenRouter on retryable errors
  - callWithFallback wrapper with error classification
  - Barrel export for all LLM public APIs
affects: [transcription, flow-engine, suggestions, post-call-analysis, guardrails]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk (used as client for both Anthropic and OpenRouter)"]
  patterns: [factory-pattern, streaming-first, silent-fallback, fire-and-forget-logging, cache-control-injection]

key-files:
  created:
    - src/lib/llm/types.ts
    - src/lib/llm/config.ts
    - src/lib/llm/cache.ts
    - src/lib/llm/factory.ts
    - src/lib/llm/fallback.ts
    - src/lib/llm/index.ts
  modified: []

key-decisions:
  - "Single Anthropic SDK for both providers -- OpenRouter works via baseURL swap (Anthropic Skin compatibility)"
  - "Streaming-first interface: stream() is default, call() is convenience wrapper that collects stream"
  - "Fire-and-forget DB logging -- LLM call logging never blocks the response path"

patterns-established:
  - "Factory pattern: createLLMClient(role) returns configured client per inference role"
  - "Silent fallback: retryable errors trigger OpenRouter fallback, logged but invisible to caller"
  - "Cache injection: system prompts auto-get cache_control ephemeral on last block for Anthropic"

requirements-completed: [INF-01, INF-02]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 01 Plan 02: LLM Provider Abstraction Summary

**Factory-pattern LLM abstraction with streaming-first interface, automatic Anthropic prompt caching, and silent OpenRouter fallback across 5 typed inference roles**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-27T17:13:53Z
- **Completed:** 2026-03-27T17:15:37Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments
- Complete LLM abstraction layer with typed InferenceRole enum mapping 5 roles to provider+model combos via env vars
- Streaming-first factory (createLLMClient) with both stream() and call() methods, tool use support, and cache token tracking
- Automatic cache_control injection on Anthropic system prompts for 90% cost reduction on cache hits
- Silent fallback to OpenRouter on rate limits, timeouts, and 5xx errors -- invisible to callers

## Task Commits

Each task was committed atomically:

1. **Task 1: LLM types, role config, and cache utilities** - `ce369e7` (feat)
2. **Task 2: LLM factory with streaming, fallback, and barrel export** - `3810911` (feat)

## Files Created/Modified
- `src/lib/llm/types.ts` - InferenceRole enum, LLMProviderConfig, RoleConfig, LLMCallParams, LLMResponse types
- `src/lib/llm/config.ts` - Role-to-provider+model mapping reading from env vars via config module
- `src/lib/llm/cache.ts` - injectCacheControl utility for Anthropic system prompt caching
- `src/lib/llm/factory.ts` - createLLMClient factory returning streaming-first LLMClient with DB logging
- `src/lib/llm/fallback.ts` - callWithFallback with isRetryableError classification and silent OpenRouter fallback
- `src/lib/llm/index.ts` - Barrel export for all public APIs

## Decisions Made
- Used single Anthropic SDK for both Anthropic direct and OpenRouter (via baseURL swap) -- avoids maintaining two SDK integrations
- stream() returns raw stream for callers that need incremental tokens; call() wraps stream for convenience
- DB logging is fire-and-forget (.catch()) to never block LLM response path
- cache_control injected only on last system block (the playbook) per Anthropic best practices

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- LLM abstraction ready for all downstream consumers (transcription, flow engine, suggestions, post-call analysis)
- Any module can `import { createLLMClient, InferenceRole } from '@/lib/llm'` to get a configured, streaming, caching, fallback-enabled client
- Model selection per role is fully configurable via environment variables without code changes

## Self-Check: PASSED

- All 6 files confirmed present on disk
- Commit ce369e7 (Task 1) verified in git log
- Commit 3810911 (Task 2) verified in git log

---
*Phase: 01-infrastructure-project-foundation*
*Completed: 2026-03-27*
