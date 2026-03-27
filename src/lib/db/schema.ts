import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, vector } from 'drizzle-orm/pg-core';

export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: varchar('status', { length: 20 }).default('active'),
  angleDetected: varchar('angle_detected', { length: 100 }),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  metadata: jsonb('metadata'),
});

export const transcripts = pgTable('transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').references(() => calls.id),
  speaker: varchar('speaker', { length: 20 }),
  content: text('content'),
  timestamp: timestamp('timestamp').defaultNow(),
  confidence: integer('confidence'),
});

export const knowledgeCards = pgTable('knowledge_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  angle: varchar('angle', { length: 100 }),
  stage: varchar('stage', { length: 50 }),
  content: text('content'),
  embedding: vector('embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const llmLogs = pgTable('llm_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').references(() => calls.id),
  role: varchar('role', { length: 50 }),
  provider: varchar('provider', { length: 20 }),
  model: varchar('model', { length: 100 }),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  cacheReadTokens: integer('cache_read_tokens'),
  cacheCreationTokens: integer('cache_creation_tokens'),
  latencyMs: integer('latency_ms'),
  wasFallback: integer('was_fallback').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
