# Phase 1: Infrastructure & Project Foundation - Research

**Researched:** 2026-03-26
**Domain:** Next.js project scaffolding, Docker dev environment, LLM provider abstraction
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire project foundation: a Next.js 15 LTS application with App Router, Docker Compose services (PostgreSQL with pgvector, Redis), a typed configuration system, Drizzle ORM schema, and most critically, a factory-pattern LLM abstraction that supports streaming, prompt caching, tool use, and automatic fallback. The project starts from an empty directory (only CLAUDE.md exists).

The LLM abstraction is the architectural centerpiece. The Anthropic SDK v0.80.0 natively supports streaming, prompt caching (`cache_control`), and tool use. OpenRouter provides an "Anthropic Skin" compatibility layer -- setting `ANTHROPIC_BASE_URL=https://openrouter.ai/api` lets the same Anthropic SDK talk to OpenRouter models without a separate client. This means the factory pattern can use one SDK for both providers, switching via base URL and API key.

**Primary recommendation:** Use `@anthropic-ai/sdk` as the single SDK for both Anthropic and OpenRouter (via base URL swap). Build the factory with a typed role-to-provider+model config map, streaming-first with `messages.stream()`, and automatic `cache_control` injection on system prompts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Factory pattern -- `createLLMClient('classification')` returns a configured client based on the inference role. Each role maps to a provider+model in config.
- **D-02:** Claude's discretion on inference role definitions -- use typed enum roles (e.g., 'classification', 'suggestion', 'guardrail', 'post-call-analysis') with type-safe mapping to provider+model combos.
- **D-03:** Prompt caching built in from day one. The factory marks system prompts with `cache_control` automatically when using Anthropic. The playbook (~5-10K tokens) stays cached across calls during a live call for 90% cost reduction and 85% latency reduction.
- **D-04:** Streaming-first -- the factory returns a stream by default. Critical for the real-time suggestion pipeline.
- **D-05:** Automatic silent fallback to Mimo v2 Pro via OpenRouter when Claude hits rate limits or timeouts. Log the fallback but don't interrupt the rep mid-call.
- **D-06:** Tool use (function calling) supported from day one. The call flow engine (Phase 4) will need structured JSON output for angle detection and flow tracking.
- **D-07:** Two models pre-configured: Claude Opus 4.6 (primary) and Mimo v2 Pro via OpenRouter (fallback). Add more later as needed.
- **D-08:** Single Next.js app with App Router and clean internal boundaries. Services in `src/lib/services/`, no monorepo overhead at this team scale.
- **D-09:** Separate Node.js WebSocket server in `src/server/` for audio streaming. Runs alongside Next.js as a separate process. Both start via one command (`pnpm dev`).
- **D-10:** Core database tables defined in Phase 1 with Drizzle ORM: calls, transcripts, knowledge_cards, llm_logs. Other phases add columns/tables as needed.
- **D-11:** Docker Compose runs PostgreSQL (with pgvector) and Redis only. Next.js and the WebSocket server run natively on the machine with hot reload.
- **D-12:** Seed script included (`pnpm db:seed`) with sample data reflecting the actual 14-angle playbook structure and realistic call scenarios.
- **D-13:** Typed config module (`src/lib/config.ts`) reads `.env` vars, validates with Zod at startup, crashes early if required vars are missing. `.env.example` documents all required variables.
- **D-14:** LLM model-per-role mapping lives in `.env` variables: `LLM_CLASSIFICATION_MODEL`, `LLM_SUGGESTION_MODEL`, `LLM_FALLBACK_PROVIDER`, etc.

### Claude's Discretion
- Exact inference role enum values and their mapping structure
- Internal folder layout within `src/` beyond the decided boundaries
- Seed data content -- should reflect the 14-angle playbook structure with realistic scenarios
- Database table column definitions for the core tables
- pnpm scripts beyond `dev`, `build`, `db:seed`

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INF-01 | LLM provider abstracted behind clean interface; model swappable between Anthropic API, OpenRouter, or any OpenAI-compatible API via configuration | Factory pattern using `@anthropic-ai/sdk` with base URL swapping for OpenRouter "Anthropic Skin" compatibility. Single SDK, multiple providers. |
| INF-02 | Model selection configurable per inference role without code changes | Typed enum roles mapped to provider+model combos in env vars, read by Zod-validated config module |
| INF-03 | API keys and provider endpoints configurable via environment variables or admin settings | Zod-validated `src/lib/config.ts` reading `.env`, crash-early on missing required vars |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack:** Next.js (React) frontend, Node.js backend, PostgreSQL + pgvector, Redis, Deepgram for STT
- **Model:** Claude Opus 4.6 as primary AI model
- **Latency:** Suggestions within ~2 seconds of relevant conversation moment
- **Day-one ready:** Must be functional for real calls
- **Team size:** 2-5 reps, single-user auth sufficient for v1
- **Prompt caching strategy:** System prompt + full playbook as cached prefix, 5-min TTL, 90% cost reduction on cache hits
- **GSD workflow enforcement:** Do not make direct repo edits outside a GSD workflow unless user explicitly asks

## Standard Stack

### Core (Phase 1 specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.5.14 | App framework (App Router) | Latest 15.x LTS. Next.js 16 is too new. Verified via npm registry. |
| react / react-dom | 19.x | UI rendering | Ships with Next.js 15. |
| typescript | 5.7+ | Type safety | Non-negotiable for multi-stream real-time system. Latest stable is 6.0.2 but Next.js 15 targets 5.x. Use 5.7+. |
| @anthropic-ai/sdk | 0.80.0 | LLM client (Anthropic + OpenRouter) | Official SDK. Streaming, prompt caching, tool use all supported. OpenRouter works via base URL swap. |
| drizzle-orm | 0.45.1 | Database ORM | Native pgvector support (`vector` column type, distance functions, HNSW index definitions). Zero deps. |
| drizzle-kit | 0.31.10 | Migrations | Schema-driven migrations, push-based dev workflow. |
| pg | 8.20.0 | PostgreSQL driver | Required by Drizzle for node-postgres adapter. |
| ioredis | 5.10.1 | Redis client | Best Pub/Sub ergonomics. Active maintenance. 12M+ weekly downloads. |
| ws | 8.20.0 | WebSocket server | Fastest Node.js WebSocket lib. Binary frame support for audio streaming. |
| zod | 3.24.4 | Runtime validation | Config validation, API payload validation, LLM response parsing. |
| pino | 10.3.1 | Structured logging | Fast JSON logger. Essential for debugging real-time pipeline. |
| dotenv | 17.3.1 | Environment config | Load `.env` files. |
| concurrently | 9.2.1 | Process management | Run Next.js + WebSocket server with one `pnpm dev` command. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/ws | 8.18.1 | WS type definitions | TypeScript dev dependency |
| @types/node | 22.x | Node.js type definitions | Match Node.js 22 runtime |
| @types/pg | latest | pg type definitions | TypeScript dev dependency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @anthropic-ai/sdk (direct) | Vercel AI SDK + @ai-sdk/anthropic | Adds abstraction layer; loses direct cache_control access. Direct SDK gives full control over prompt caching and streaming needed for this use case. |
| ioredis | node-redis | node-redis is "officially recommended" but ioredis has more intuitive Pub/Sub API with separate subscriber instances. |
| drizzle-orm | Prisma | Prisma still requires raw SQL for pgvector operations. Drizzle has first-class vector types. |
| concurrently | turbo/nx | Overkill for 2 processes. concurrently is simpler. |

**Installation:**
```bash
# Install pnpm first (not currently installed)
npm install -g pnpm

# Initialize project
pnpm create next-app@15.5.14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Core dependencies
pnpm add @anthropic-ai/sdk drizzle-orm pg ioredis ws zod pino dotenv

# Dev dependencies
pnpm add -D drizzle-kit @types/ws @types/pg @types/node concurrently typescript
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/                        # Next.js App Router (pages, layouts, API routes)
    layout.tsx                # Root layout
    page.tsx                  # Landing/dashboard page
    api/
      health/route.ts         # Health check endpoint
      llm/test/route.ts       # LLM test endpoint (dev only)
  lib/
    config.ts                 # Zod-validated env config (D-13)
    db/
      index.ts                # Drizzle client instance
      schema.ts               # All table definitions (D-10)
      seed.ts                 # Seed script (D-12)
      migrations/             # Drizzle migration files
    llm/
      types.ts                # InferenceRole enum, provider types, config types
      config.ts               # Role-to-provider+model mapping (reads from env)
      factory.ts              # createLLMClient() factory (D-01)
      providers/
        anthropic.ts          # Anthropic provider (direct API)
        openrouter.ts         # OpenRouter provider (Anthropic SDK + base URL swap)
      fallback.ts             # Fallback logic with retry + silent switch (D-05)
      cache.ts                # cache_control injection utilities (D-03)
    redis/
      index.ts                # Redis client instance
    logger.ts                 # Pino logger instance
  server/
    index.ts                  # WebSocket server entry point (D-09)
    ws-handler.ts             # WebSocket connection handler (stub for Phase 2)
docker/
  compose.yaml                # PostgreSQL + Redis (D-11)
  init.sql                    # CREATE EXTENSION vector
drizzle.config.ts             # Drizzle Kit configuration
.env.example                  # All required env vars documented
```

### Pattern 1: LLM Factory with Provider Abstraction

**What:** A factory function that returns a streaming-capable LLM client configured for a specific inference role, with automatic prompt caching and fallback.

**When to use:** Every LLM call in the application goes through this factory.

**Key insight -- OpenRouter Anthropic Skin:** OpenRouter exposes an endpoint compatible with the Anthropic Messages API. By setting `baseURL` to `https://openrouter.ai/api` on the Anthropic SDK client, the same SDK works for both providers. This eliminates the need for a separate OpenAI-compatible client.

**Example:**
```typescript
// src/lib/llm/types.ts
export const InferenceRole = {
  CLASSIFICATION: 'classification',
  SUGGESTION: 'suggestion',
  GUARDRAIL: 'guardrail',
  POST_CALL_ANALYSIS: 'post-call-analysis',
  GENERATION: 'generation',
} as const;

export type InferenceRole = typeof InferenceRole[keyof typeof InferenceRole];

export interface LLMProviderConfig {
  provider: 'anthropic' | 'openrouter';
  model: string;
  baseUrl?: string;
  apiKey: string;
}

export interface RoleConfig {
  primary: LLMProviderConfig;
  fallback?: LLMProviderConfig;
}

// src/lib/llm/factory.ts
import Anthropic from '@anthropic-ai/sdk';

export function createLLMClient(role: InferenceRole): ConfiguredLLMClient {
  const roleConfig = getLLMConfig(role);

  // Both Anthropic and OpenRouter use the same SDK
  const client = new Anthropic({
    apiKey: roleConfig.primary.apiKey,
    baseURL: roleConfig.primary.baseUrl, // undefined for Anthropic, 'https://openrouter.ai/api' for OpenRouter
  });

  return new ConfiguredLLMClient(client, roleConfig);
}
```

### Pattern 2: Streaming with Automatic Prompt Caching

**What:** Every streaming call automatically injects `cache_control` on system prompts when using the Anthropic provider.

**When to use:** All inference calls. The playbook system prompt (~5-10K tokens) stays cached across calls during a live call.

**Critical details from official docs:**
- Minimum cacheable tokens for Claude Opus 4.6: **4,096 tokens**
- Cache TTL: 5 minutes (refreshed on each hit -- perfect for active calls)
- Cache reads cost 0.1x base price (90% savings)
- Cache writes cost 1.25x base price (amortized quickly during active calls)
- Maximum 4 cache breakpoints per request
- Place cached content at the beginning of the prompt

**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
const stream = client.messages.stream({
  model: 'claude-opus-4-6',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: systemPromptWithPlaybook, // 5-10K tokens
      cache_control: { type: 'ephemeral' }, // 5-min TTL, auto-refresh
    },
  ],
  messages: conversationMessages,
});

// High-level streaming API -- returns MessageStream with event emitters
stream.on('text', (text) => {
  // Send to client via WebSocket
});

const finalMessage = await stream.finalMessage();
// finalMessage.usage includes cache_read_input_tokens, cache_creation_input_tokens
```

### Pattern 3: Silent Fallback with Logging

**What:** When the primary provider (Anthropic) fails (rate limit, timeout, 5xx), automatically retry with the fallback provider (OpenRouter + Mimo v2 Pro). Log the fallback but never surface it to the user.

**When to use:** Every LLM call wraps in fallback logic.

**Example:**
```typescript
async function callWithFallback(
  role: InferenceRole,
  params: MessageCreateParams
): Promise<MessageStream> {
  const config = getLLMConfig(role);

  try {
    const primaryClient = new Anthropic({
      apiKey: config.primary.apiKey,
      baseURL: config.primary.baseUrl,
    });
    return primaryClient.messages.stream({
      model: config.primary.model,
      ...params,
    });
  } catch (error) {
    if (isRetryableError(error) && config.fallback) {
      logger.warn({ role, error: error.message }, 'LLM primary failed, falling back');

      const fallbackClient = new Anthropic({
        apiKey: config.fallback.apiKey,
        baseURL: config.fallback.baseUrl,
      });
      return fallbackClient.messages.stream({
        model: config.fallback.model,
        ...params,
      });
    }
    throw error;
  }
}
```

### Pattern 4: Zod-Validated Config

**What:** A single config module that reads all env vars, validates them with Zod, and crashes at startup if anything is missing.

**When to use:** Import `config` anywhere instead of reading `process.env` directly.

**Example:**
```typescript
// src/lib/config.ts
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Anthropic (primary)
  ANTHROPIC_API_KEY: z.string().min(1),

  // OpenRouter (fallback)
  OPENROUTER_API_KEY: z.string().min(1),

  // LLM role-to-model mapping
  LLM_CLASSIFICATION_MODEL: z.string().default('claude-opus-4-6'),
  LLM_SUGGESTION_MODEL: z.string().default('claude-opus-4-6'),
  LLM_GUARDRAIL_MODEL: z.string().default('claude-opus-4-6'),
  LLM_GENERATION_MODEL: z.string().default('claude-opus-4-6'),
  LLM_POST_CALL_ANALYSIS_MODEL: z.string().default('claude-opus-4-6'),
  LLM_FALLBACK_MODEL: z.string().default('mimo-v2-pro'), // OpenRouter model ID

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  WS_PORT: z.coerce.number().default(3001),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
```

### Pattern 5: Drizzle Schema with pgvector

**What:** Core database tables with vector column support.

**Example:**
```typescript
// src/lib/db/schema.ts
import { pgTable, serial, text, timestamp, integer, jsonb, varchar, uuid } from 'drizzle-orm/pg-core';
import { vector } from 'drizzle-orm/pg-core';

export const calls = pgTable('calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  angleDetected: varchar('angle_detected', { length: 100 }),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  metadata: jsonb('metadata'),
});

export const transcripts = pgTable('transcripts', {
  id: uuid('id').defaultRandom().primaryKey(),
  callId: uuid('call_id').references(() => calls.id).notNull(),
  speaker: varchar('speaker', { length: 20 }).notNull(), // 'rep' | 'customer'
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  confidence: integer('confidence'), // Deepgram confidence 0-100
});

export const knowledgeCards = pgTable('knowledge_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  angle: varchar('angle', { length: 100 }).notNull(),
  stage: varchar('stage', { length: 50 }).notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const llmLogs = pgTable('llm_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  callId: uuid('call_id').references(() => calls.id),
  role: varchar('role', { length: 50 }).notNull(), // inference role
  provider: varchar('provider', { length: 20 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  cacheReadTokens: integer('cache_read_tokens'),
  cacheCreationTokens: integer('cache_creation_tokens'),
  latencyMs: integer('latency_ms'),
  wasFallback: integer('was_fallback').default(0), // boolean as int
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Pattern 6: Docker Compose for Dev Services

**What:** PostgreSQL with pgvector and Redis running in containers. App runs natively.

**Example:**
```yaml
# docker/compose.yaml
services:
  postgres:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: copilot
      POSTGRES_PASSWORD: copilot_dev
      POSTGRES_DB: copilot
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U copilot"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

```sql
-- docker/init.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Anti-Patterns to Avoid

- **Using Vercel AI SDK as a wrapper:** Adds unnecessary abstraction. Direct `@anthropic-ai/sdk` gives full control over `cache_control`, streaming events, and usage metrics. The Vercel AI SDK hides these details.
- **Separate SDK per provider:** OpenRouter's Anthropic Skin means one SDK handles both. Don't install `openai` package for OpenRouter.
- **Reading `process.env` directly:** Always go through the Zod-validated config. Raw env access bypasses validation and loses type safety.
- **Running Next.js in Docker for dev:** Hot reload is slower. Run natively with `next dev --turbopack` for fastest feedback loop.
- **Using `docker-compose.yml`:** The 2026 Compose spec prefers `compose.yaml` as the filename.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LLM streaming | Custom HTTP streaming parser | `@anthropic-ai/sdk` `messages.stream()` | SDK handles SSE parsing, reconnection, type-safe events |
| Prompt caching | Manual token counting and cache management | SDK `cache_control: { type: 'ephemeral' }` | Anthropic handles cache lifecycle, TTL refresh, eviction |
| Database migrations | Raw SQL migration scripts | `drizzle-kit push` (dev) / `drizzle-kit migrate` (prod) | Schema diffing, rollback tracking, type generation |
| Env validation | Manual `if (!process.env.X) throw` checks | Zod schema parsing | Validates all vars at once, provides typed output, better error messages |
| Process orchestration | Custom shell scripts to start services | `concurrently` | Cross-platform, colored output, proper signal handling |
| UUID generation | Custom ID generators | PostgreSQL `gen_random_uuid()` via Drizzle `defaultRandom()` | Database-level generation, no client dependency |

## Common Pitfalls

### Pitfall 1: Prompt Cache Misses Due to Dynamic Content in System Prompt
**What goes wrong:** Cache never hits because system prompt includes timestamps, session IDs, or per-request context that changes every call.
**Why it happens:** Developers embed dynamic data in the cached portion of the prompt.
**How to avoid:** Keep the system prompt + playbook 100% static. Put all dynamic context (current transcript, call state) in user messages AFTER the cache breakpoint.
**Warning signs:** `cache_creation_input_tokens` is always high, `cache_read_input_tokens` is always 0 in llm_logs.

### Pitfall 2: OpenRouter Model IDs Differ from Anthropic
**What goes wrong:** Passing `claude-opus-4-6` to OpenRouter returns an error.
**Why it happens:** OpenRouter uses its own model ID format (e.g., `anthropic/claude-opus-4.6`).
**How to avoid:** The role-to-model config must store the provider-specific model ID. When using OpenRouter, use `anthropic/claude-opus-4.6`, not `claude-opus-4-6`.
**Warning signs:** 404 or "model not found" errors when fallback activates.

### Pitfall 3: Minimum Cache Token Threshold
**What goes wrong:** Small system prompts silently skip caching with no error.
**Why it happens:** Claude Opus 4.6 requires minimum 4,096 tokens for caching. A short system prompt won't hit this threshold.
**How to avoid:** The playbook is 5-10K tokens so this should not be an issue in production. For testing, use a sufficiently long system prompt or accept no caching in tests.
**Warning signs:** `cache_creation_input_tokens` is always 0 despite `cache_control` being set.

### Pitfall 4: Drizzle-Kit Migration CLI Silently Fails
**What goes wrong:** `drizzle-kit migrate` exits with code 1 but doesn't print the PostgreSQL error.
**Why it happens:** Known bug in drizzle-kit (reported March 2026, issue #5520).
**How to avoid:** Use `drizzle-kit push` for development (applies schema directly). For production migrations, check the database state manually if migrate fails. Consider logging the SQL output.
**Warning signs:** Migration command exits non-zero with only NOTICE messages, no error output.

### Pitfall 5: pnpm Not Installed
**What goes wrong:** Project uses pnpm but it's not globally installed on the development machine.
**Why it happens:** Node.js ships with npm, not pnpm.
**How to avoid:** First task must include `npm install -g pnpm` or use `corepack enable && corepack prepare pnpm@latest --activate`.
**Warning signs:** `pnpm: command not found`.

### Pitfall 6: WebSocket Server Port Conflict
**What goes wrong:** WebSocket server fails to start because port 3001 is already in use.
**Why it happens:** Other services or previous instances using the same port.
**How to avoid:** Make WS_PORT configurable via env var. Add error handling for EADDRINUSE with a clear message.
**Warning signs:** EADDRINUSE error on startup.

## Code Examples

### Anthropic SDK Streaming with Tool Use
```typescript
// Source: https://github.com/anthropics/anthropic-sdk-typescript
const stream = client.messages.stream({
  model: 'claude-opus-4-6',
  max_tokens: 1024,
  tools: [
    {
      name: 'detect_angle',
      description: 'Detect which insurance angle applies to this call',
      input_schema: {
        type: 'object',
        properties: {
          angle: { type: 'string', enum: ['standard', 'preferred', 'term', 'permanent', 'loan', 'death_claim', 'new_shopper', 'dental_vision', 'auto', 'homeowners', '401k', 'annuity', 'cashout_extension', 'beneficiary'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['angle', 'confidence'],
      },
    },
  ],
  system: [
    {
      type: 'text',
      text: playbook, // 5-10K tokens, gets cached
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages,
});

// Event-based streaming
stream.on('text', (text) => { /* handle text delta */ });
stream.on('inputJson', (json) => { /* handle tool input streaming */ });

const finalMessage = await stream.finalMessage();
```

### Drizzle Client Setup
```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config';
import * as schema from './schema';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### Drizzle Config
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Redis Client Setup
```typescript
// src/lib/redis/index.ts
import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.REDIS_URL);

// Separate instance for Pub/Sub (ioredis requires dedicated connection for subscribers)
export const redisSub = new Redis(config.REDIS_URL);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual prompt token counting for caching | `cache_control: { type: 'ephemeral' }` with automatic caching | Feb 2026 | Anthropic auto-caches static prompt portions. Just add cache_control field. |
| Separate OpenAI SDK for OpenRouter | Anthropic SDK with `baseURL` swap | 2025-2026 | One SDK for all providers. OpenRouter "Anthropic Skin" is API-compatible. |
| `docker-compose.yml` | `compose.yaml` | 2024 (Compose V2 spec) | Preferred filename in modern Docker Compose. |
| `pgvector/pgvector:pg16` | `pgvector/pgvector:pg17` | 2025 | PostgreSQL 17 with pgvector 0.8.2 pre-installed. |
| Prisma for pgvector | Drizzle ORM | 2024-2025 | Drizzle has native vector column type, distance functions, HNSW index in schema. Prisma still needs raw SQL. |

**Deprecated/outdated:**
- `client.beta.messages.stream()` for caching -- prompt caching is now GA, use `client.messages.stream()` with `cache_control` directly
- `docker-compose` CLI (v1) -- use `docker compose` (v2, built into Docker)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Yes (via nvm) | 22.22.1 | -- |
| npm | Package install | Yes (via nvm) | 10.9.4 | -- |
| pnpm | Package manager (D-08) | No | -- | Install via `npm install -g pnpm` |
| Docker | Container services | Yes | 29.2.1 | -- |
| Docker Compose | PostgreSQL + Redis | Yes | v5.1.0 | -- |
| PostgreSQL | Database (via Docker) | Via Docker | pg17 image | -- |
| Redis | Cache/PubSub (via Docker) | Via Docker | 7-alpine image | -- |

**Missing dependencies with no fallback:**
- None -- all critical tools are available or installable.

**Missing dependencies with fallback:**
- pnpm: Not installed. Install via `npm install -g pnpm` as first step.

**Note:** Node.js is available via nvm at `~/.nvm/versions/node/v22.22.1/bin/node`. The shell must source nvm to access it. This may need to be addressed in scripts or documented in project setup instructions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Next.js 15 + TypeScript) |
| Config file | None -- Wave 0 must create `vitest.config.ts` |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INF-01 | LLM factory returns configured client for any provider | unit | `pnpm vitest run src/lib/llm/__tests__/factory.test.ts -t "provider abstraction"` | No -- Wave 0 |
| INF-01 | Provider can be switched via config without code changes | unit | `pnpm vitest run src/lib/llm/__tests__/factory.test.ts -t "provider switch"` | No -- Wave 0 |
| INF-02 | Different roles can use different models | unit | `pnpm vitest run src/lib/llm/__tests__/config.test.ts -t "role model mapping"` | No -- Wave 0 |
| INF-03 | Config validates env vars and crashes on missing required vars | unit | `pnpm vitest run src/lib/__tests__/config.test.ts -t "env validation"` | No -- Wave 0 |
| INF-03 | API keys configurable via environment | unit | `pnpm vitest run src/lib/__tests__/config.test.ts -t "api keys"` | No -- Wave 0 |
| D-03 | Prompt caching injects cache_control on system prompts | unit | `pnpm vitest run src/lib/llm/__tests__/cache.test.ts` | No -- Wave 0 |
| D-05 | Fallback activates on primary failure | unit | `pnpm vitest run src/lib/llm/__tests__/fallback.test.ts` | No -- Wave 0 |
| D-10 | Database schema creates all core tables | integration | `pnpm drizzle-kit push && pnpm vitest run src/lib/db/__tests__/schema.test.ts` | No -- Wave 0 |
| D-13 | Config module crash-early on invalid env | unit | `pnpm vitest run src/lib/__tests__/config.test.ts -t "crash early"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration file
- [ ] `src/lib/llm/__tests__/factory.test.ts` -- covers INF-01
- [ ] `src/lib/llm/__tests__/config.test.ts` -- covers INF-02
- [ ] `src/lib/llm/__tests__/cache.test.ts` -- covers D-03
- [ ] `src/lib/llm/__tests__/fallback.test.ts` -- covers D-05
- [ ] `src/lib/__tests__/config.test.ts` -- covers INF-03, D-13
- [ ] `src/lib/db/__tests__/schema.test.ts` -- covers D-10
- [ ] Framework install: `pnpm add -D vitest @vitejs/plugin-react`

## Open Questions

1. **OpenRouter prompt caching support via Anthropic Skin**
   - What we know: OpenRouter's Anthropic Skin is API-compatible with the Anthropic Messages API. It supports tool use and streaming.
   - What's unclear: Whether `cache_control` fields are passed through and honored by OpenRouter, or silently ignored. If the fallback provider (Mimo v2 Pro) doesn't support caching, the fallback calls will have higher latency.
   - Recommendation: The fallback is for rate-limit/timeout scenarios, so slightly higher latency is acceptable. Test during implementation and log cache metrics from fallback calls.

2. **Mimo v2 Pro model ID on OpenRouter**
   - What we know: OpenRouter uses format like `provider/model-name` for model IDs.
   - What's unclear: The exact model ID for Mimo v2 Pro on OpenRouter.
   - Recommendation: Check OpenRouter model list during implementation. The config is env-var driven so the model ID is easily changed.

3. **Embedding model for knowledge_cards**
   - What we know: The knowledge_cards table has a vector column with 1536 dimensions. Anthropic does not provide an embeddings API.
   - What's unclear: Which embedding model to use (OpenAI text-embedding-3-small, Voyage AI, etc.). This is a Phase 4 concern.
   - Recommendation: Define the vector column now but leave the dimensions flexible. The embedding model choice can be deferred to Phase 4 when knowledge cards are actually populated.

## Sources

### Primary (HIGH confidence)
- [Anthropic Prompt Caching Official Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) -- cache_control API, TTL, pricing, minimum tokens
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript) -- streaming API, tool use, SDK patterns
- [@anthropic-ai/sdk npm](https://www.npmjs.com/package/@anthropic-ai/sdk) -- version 0.80.0 verified
- [Drizzle ORM pgvector Guide](https://orm.drizzle.team/docs/guides/vector-similarity-search) -- native vector column, distance functions, HNSW index
- [Next.js 15 Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) -- App Router conventions
- [pgvector/pgvector Docker Hub](https://hub.docker.com/r/pgvector/pgvector) -- pg17 image
- npm registry -- all package versions verified via `npm view`

### Secondary (MEDIUM confidence)
- [OpenRouter Anthropic Agent SDK Docs](https://openrouter.ai/docs/guides/community/anthropic-agent-sdk) -- Anthropic Skin base URL compatibility
- [Drizzle-kit bug #5520](https://github.com/drizzle-team/drizzle-orm/issues/5520) -- silent migration failure (March 2026)

### Tertiary (LOW confidence)
- OpenRouter prompt caching passthrough -- not verified whether cache_control is honored via Anthropic Skin. Needs implementation-time validation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry, official docs confirm API patterns
- Architecture: HIGH -- factory pattern with Anthropic SDK is well-documented, OpenRouter Anthropic Skin confirmed
- Pitfalls: HIGH -- cache minimum tokens, model ID format, drizzle-kit bug all from official/primary sources

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable stack, 30-day validity)
