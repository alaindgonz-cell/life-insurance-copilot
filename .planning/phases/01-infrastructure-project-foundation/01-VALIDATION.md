---
phase: 1
slug: infrastructure-project-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (recommended for Next.js 15 + TypeScript) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | INF-01 | unit | `pnpm vitest run src/lib/llm/__tests__/factory.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | INF-02 | unit | `pnpm vitest run src/lib/llm/__tests__/config.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 0 | INF-03 | unit | `pnpm vitest run src/lib/__tests__/config.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 0 | D-03 | unit | `pnpm vitest run src/lib/llm/__tests__/cache.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 0 | D-05 | unit | `pnpm vitest run src/lib/llm/__tests__/fallback.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 0 | D-10 | integration | `pnpm vitest run src/lib/db/__tests__/schema.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration file
- [ ] `src/lib/llm/__tests__/factory.test.ts` — stubs for INF-01
- [ ] `src/lib/llm/__tests__/config.test.ts` — stubs for INF-02
- [ ] `src/lib/__tests__/config.test.ts` — stubs for INF-03, D-13
- [ ] `src/lib/llm/__tests__/cache.test.ts` — stubs for D-03
- [ ] `src/lib/llm/__tests__/fallback.test.ts` — stubs for D-05
- [ ] `src/lib/db/__tests__/schema.test.ts` — stubs for D-10
- [ ] Framework install: `pnpm add -D vitest @vitejs/plugin-react`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker Compose starts PostgreSQL + Redis | D-11 | Container orchestration | `docker compose -f docker/compose.yaml up -d` then verify ports 5432, 6379 respond |
| Next.js dev server runs | Success Criteria 1 | Dev server startup | `pnpm dev` then verify http://localhost:3000 responds |
| WebSocket server runs alongside Next.js | D-09 | Multi-process startup | `pnpm dev` then verify ws://localhost:3001 accepts connection |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
