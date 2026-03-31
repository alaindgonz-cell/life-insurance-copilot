import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, vector, boolean } from 'drizzle-orm/pg-core';

// Phase 1 core tables
export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id'),
  prospectName: varchar('prospect_name', { length: 200 }),
  prospectPhone: varchar('prospect_phone', { length: 20 }),
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
  confidence: integer('confidence'),
  startMs: integer('start_ms'),
  endMs: integer('end_ms'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const knowledgeCards = pgTable('knowledge_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  angle: varchar('angle', { length: 100 }),
  stage: varchar('stage', { length: 50 }),
  category: varchar('category', { length: 50 }),
  title: varchar('title', { length: 200 }),
  content: text('content'),
  tags: jsonb('tags').$type<string[]>().default([]),
  embedding: vector('embedding', { dimensions: 1024 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }),
  category: varchar('category', { length: 50 }),
  description: text('description'),
  features: jsonb('features').$type<string[]>().default([]),
  targetAge: varchar('target_age', { length: 50 }),
  priceRange: varchar('price_range', { length: 100 }),
  embedding: vector('embedding', { dimensions: 1024 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const suggestions = pgTable('suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').references(() => calls.id),
  type: varchar('type', { length: 30 }),
  content: text('content'),
  trigger: varchar('trigger', { length: 200 }),
  shown: boolean('shown').default(false),
  accepted: boolean('accepted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  name: varchar('name', { length: 200 }),
  role: varchar('role', { length: 20 }).default('agent'),
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
