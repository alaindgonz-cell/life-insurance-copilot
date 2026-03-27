import { describe, it, expect } from 'vitest';
import { calls, transcripts, knowledgeCards, llmLogs } from '../schema';
import { getTableColumns } from 'drizzle-orm';

/**
 * Tests for src/lib/db/schema.ts
 * Validates all 4 core tables are defined and exported with expected columns.
 * Pure import tests -- no database connection needed.
 */

describe('database schema', () => {
  it('calls table is defined and exported', () => {
    expect(calls).toBeDefined();
    const columns = getTableColumns(calls);
    expect(columns.id).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.angleDetected).toBeDefined();
    expect(columns.startedAt).toBeDefined();
    expect(columns.endedAt).toBeDefined();
    expect(columns.metadata).toBeDefined();
  });

  it('transcripts table is defined and exported', () => {
    expect(transcripts).toBeDefined();
    const columns = getTableColumns(transcripts);
    expect(columns.id).toBeDefined();
    expect(columns.callId).toBeDefined();
    expect(columns.speaker).toBeDefined();
    expect(columns.content).toBeDefined();
    expect(columns.timestamp).toBeDefined();
    expect(columns.confidence).toBeDefined();
  });

  it('knowledgeCards table is defined and exported', () => {
    expect(knowledgeCards).toBeDefined();
    const columns = getTableColumns(knowledgeCards);
    expect(columns.id).toBeDefined();
    expect(columns.angle).toBeDefined();
    expect(columns.stage).toBeDefined();
    expect(columns.content).toBeDefined();
    expect(columns.embedding).toBeDefined();
    expect(columns.metadata).toBeDefined();
    expect(columns.createdAt).toBeDefined();
  });

  it('llmLogs table is defined and exported', () => {
    expect(llmLogs).toBeDefined();
    const columns = getTableColumns(llmLogs);
    expect(columns.id).toBeDefined();
    expect(columns.callId).toBeDefined();
    expect(columns.role).toBeDefined();
    expect(columns.provider).toBeDefined();
    expect(columns.model).toBeDefined();
    expect(columns.inputTokens).toBeDefined();
    expect(columns.outputTokens).toBeDefined();
    expect(columns.cacheReadTokens).toBeDefined();
    expect(columns.cacheCreationTokens).toBeDefined();
    expect(columns.latencyMs).toBeDefined();
    expect(columns.wasFallback).toBeDefined();
    expect(columns.createdAt).toBeDefined();
  });
});
