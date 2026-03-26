# Phase 1: Infrastructure & Project Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 01-infrastructure-project-foundation
**Areas discussed:** LLM abstraction design, Project structure, Docker & local dev setup, Config & env strategy

---

## LLM Abstraction Design

### Interface Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Factory pattern | createLLMClient('role') factory returning configured client per inference role | ✓ |
| Single client + role config | One shared client with .complete({role, prompt}) method | |
| You decide | Claude picks | |

**User's choice:** Factory pattern
**Notes:** None

### Inference Role Definition

| Option | Description | Selected |
|--------|-------------|----------|
| Typed enum roles | Explicit roles: classification, suggestion, guardrail, post-call-analysis | |
| Free-string roles | Any string as role name, config maps to models | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide
**Notes:** Claude will use typed enum roles based on downstream needs

### Prompt Caching

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, built-in | Factory marks system prompts with cache_control for Anthropic. 90% cost, 85% latency reduction | ✓ |
| Add later | Keep abstraction simple, optimize later | |
| You decide | Claude determines | |

**User's choice:** Yes, built-in
**Notes:** None

### Streaming Support

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, streaming-first | Factory returns stream by default, critical for real-time suggestions | ✓ |
| Non-streaming first | Simple request/response, add streaming in Phase 6 | |
| You decide | Claude determines | |

**User's choice:** Streaming-first, and if Claude runs out of tokens use Mimo v2 Pro as fallback
**Notes:** User introduced the fallback model requirement here

### Fallback Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic silent fallback | On rate limit/timeout, auto-retry with Mimo v2 Pro. Log but don't interrupt. | ✓ |
| Notify then fallback | Show indicator in UI that backup model is active | |
| You decide | Claude picks | |

**User's choice:** Automatic silent fallback
**Notes:** None

### Tool Use Support

| Option | Description | Selected |
|--------|-------------|----------|
| Tool use from day one | Call flow engine needs structured JSON via tool use. Build now. | ✓ |
| Text completions only | Parse structured output from text, add tool use later | |
| You decide | Claude determines | |

**User's choice:** Tool use from day one
**Notes:** None

### Pre-configured Models

| Option | Description | Selected |
|--------|-------------|----------|
| Just those two | Claude Opus 4.6 + Mimo v2 Pro | ✓ |
| Add Claude Haiku | Include for fast/cheap classification | |
| Add Claude Sonnet | Include as middle-tier option | |

**User's choice:** Just those two
**Notes:** None

---

## Project Structure

### Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Single Next.js app | One app with App Router, services in src/lib/services/ | ✓ |
| Monorepo | Separate apps + shared packages | |
| You decide | Claude picks | |

**User's choice:** "Keep in mind I am trying to build a very effective tool and I want it to be very professional — you decide"
**Notes:** User emphasized professional quality. Claude chose single Next.js app with clean internal boundaries — monorepo overhead not justified at 2-5 rep scale.

### WebSocket Server

| Option | Description | Selected |
|--------|-------------|----------|
| Separate process | Standalone Node.js WebSocket server in src/server/ | ✓ |
| Inside Next.js custom server | Wrap Next.js in custom server.ts | |
| You decide | Claude picks | |

**User's choice:** Separate process
**Notes:** None

### Database Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Core tables now | calls, transcripts, knowledge_cards, llm_logs defined in Phase 1 | ✓ |
| Empty schema | Just Drizzle + migrations tooling | |
| You decide | Claude determines | |

**User's choice:** Core tables now
**Notes:** None

---

## Docker & Local Dev Setup

### Docker Compose Scope

| Option | Description | Selected |
|--------|-------------|----------|
| PostgreSQL + Redis only | Databases in Docker, app runs natively with hot reload | ✓ |
| Everything containerized | All services in Docker | |
| You decide | Claude picks | |

**User's choice:** PostgreSQL + Redis only
**Notes:** None

### Seed Data

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, seed script | pnpm db:seed loads sample knowledge cards and test transcript | |
| No seed | Empty database | |
| You decide | Claude determines | ✓ |

**User's choice:** "You decide, make sure to use the context I've given you for the vision of this project"
**Notes:** Claude will include seed script with data reflecting 14-angle playbook structure

---

## Config & Environment Strategy

### Config Management

| Option | Description | Selected |
|--------|-------------|----------|
| Typed config module + .env | src/lib/config.ts with Zod validation, crashes early on missing vars | ✓ |
| Just .env + process.env | Direct process.env reads | |
| You decide | Claude picks | |

**User's choice:** Typed config module + .env
**Notes:** None

### Model-per-Role Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| .env variables | LLM_CLASSIFICATION_MODEL, LLM_SUGGESTION_MODEL, etc. | ✓ |
| JSON config file | Structured models.json | |
| You decide | Claude picks | |

**User's choice:** .env variables
**Notes:** None

---

## Claude's Discretion

- Inference role enum values and mapping structure
- Internal folder layout beyond decided boundaries
- Seed data content (must reflect 14-angle playbook)
- Database table column definitions
- pnpm scripts beyond dev, build, db:seed

## Deferred Ideas

None — discussion stayed within phase scope
