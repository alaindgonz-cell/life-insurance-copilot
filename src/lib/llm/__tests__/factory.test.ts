import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for src/lib/llm/factory.ts
 * Validates createLLMClient factory returns correct interface.
 *
 * Strategy: Stub env vars before importing to avoid crash-early.
 * Does NOT make actual API calls.
 */

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
  REDIS_URL: 'redis://localhost:6379',
  ANTHROPIC_API_KEY: 'sk-ant-test-key-123',
  OPENROUTER_API_KEY: 'sk-or-test-key-456',
};

function stubEnv() {
  vi.stubEnv('DATABASE_URL', VALID_ENV.DATABASE_URL);
  vi.stubEnv('REDIS_URL', VALID_ENV.REDIS_URL);
  vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
  vi.stubEnv('OPENROUTER_API_KEY', VALID_ENV.OPENROUTER_API_KEY);
}

describe('createLLMClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns object with stream and call methods', async () => {
    stubEnv();
    const { createLLMClient } = await import('../factory');
    const client = createLLMClient('generation');

    expect(client).toBeDefined();
    expect(typeof client.stream).toBe('function');
    expect(typeof client.call).toBe('function');
  });

  it('accepts all 5 inference roles without error', async () => {
    stubEnv();
    const { createLLMClient } = await import('../factory');
    const roles = ['classification', 'suggestion', 'guardrail', 'post-call-analysis', 'generation'] as const;

    for (const role of roles) {
      const client = createLLMClient(role);
      expect(client).toBeDefined();
      expect(typeof client.stream).toBe('function');
      expect(typeof client.call).toBe('function');
    }
  });
});
