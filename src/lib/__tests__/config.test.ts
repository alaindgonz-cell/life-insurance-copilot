import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for src/lib/config.ts
 * Validates Zod schema parsing, crash-early behavior, and default values.
 *
 * Strategy: Use vi.stubEnv() and vi.resetModules() to test config parsing
 * in isolation without importing the module at top level (which would crash
 * if env vars are missing).
 */

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
  REDIS_URL: 'redis://localhost:6379',
  ANTHROPIC_API_KEY: 'sk-ant-test-key-123',
  OPENROUTER_API_KEY: 'sk-or-test-key-456',
};

async function importConfig() {
  const mod = await import('../config');
  return mod;
}

describe('config module', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('throws ZodError when ANTHROPIC_API_KEY is missing', async () => {
    vi.stubEnv('DATABASE_URL', VALID_ENV.DATABASE_URL);
    vi.stubEnv('REDIS_URL', VALID_ENV.REDIS_URL);
    vi.stubEnv('OPENROUTER_API_KEY', VALID_ENV.OPENROUTER_API_KEY);
    // Stub to empty string to trigger min(1) validation failure
    vi.stubEnv('ANTHROPIC_API_KEY', '');

    await expect(importConfig()).rejects.toThrow();
  });

  it('throws ZodError when DATABASE_URL is missing', async () => {
    vi.stubEnv('REDIS_URL', VALID_ENV.REDIS_URL);
    vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
    vi.stubEnv('OPENROUTER_API_KEY', VALID_ENV.OPENROUTER_API_KEY);
    // Stub to empty string to trigger url() validation failure
    vi.stubEnv('DATABASE_URL', '');

    await expect(importConfig()).rejects.toThrow();
  });

  it('produces typed config with correct values when all required vars are set', async () => {
    vi.stubEnv('DATABASE_URL', VALID_ENV.DATABASE_URL);
    vi.stubEnv('REDIS_URL', VALID_ENV.REDIS_URL);
    vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
    vi.stubEnv('OPENROUTER_API_KEY', VALID_ENV.OPENROUTER_API_KEY);

    const { config } = await importConfig();

    expect(config.DATABASE_URL).toBe(VALID_ENV.DATABASE_URL);
    expect(config.REDIS_URL).toBe(VALID_ENV.REDIS_URL);
    expect(config.ANTHROPIC_API_KEY).toBe(VALID_ENV.ANTHROPIC_API_KEY);
    expect(config.OPENROUTER_API_KEY).toBe(VALID_ENV.OPENROUTER_API_KEY);
  });

  it('applies default values when optional vars are missing', async () => {
    vi.stubEnv('DATABASE_URL', VALID_ENV.DATABASE_URL);
    vi.stubEnv('REDIS_URL', VALID_ENV.REDIS_URL);
    vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
    vi.stubEnv('OPENROUTER_API_KEY', VALID_ENV.OPENROUTER_API_KEY);
    // Remove optional vars to test defaults
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.WS_PORT;

    const { config } = await importConfig();

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.WS_PORT).toBe(3001);
  });

  it('defaults LLM model vars correctly', async () => {
    vi.stubEnv('DATABASE_URL', VALID_ENV.DATABASE_URL);
    vi.stubEnv('REDIS_URL', VALID_ENV.REDIS_URL);
    vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
    vi.stubEnv('OPENROUTER_API_KEY', VALID_ENV.OPENROUTER_API_KEY);
    delete process.env.LLM_CLASSIFICATION_MODEL;
    delete process.env.LLM_SUGGESTION_MODEL;

    const { config } = await importConfig();

    expect(config.LLM_CLASSIFICATION_MODEL).toBe('claude-opus-4-6');
    expect(config.LLM_SUGGESTION_MODEL).toBe('claude-opus-4-6');
  });
});
