import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for src/lib/llm/config.ts
 * Validates role-to-provider config mapping, primary/fallback setup.
 *
 * Strategy: Stub env vars before dynamic import to avoid crash-early config parse.
 */

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
  REDIS_URL: 'redis://localhost:6379',
  ANTHROPIC_API_KEY: 'sk-ant-test-key-123',
  OPENROUTER_API_KEY: 'sk-or-test-key-456',
};

function stubEnv(overrides: Record<string, string> = {}) {
  vi.stubEnv('DATABASE_URL', VALID_ENV.DATABASE_URL);
  vi.stubEnv('REDIS_URL', VALID_ENV.REDIS_URL);
  vi.stubEnv('ANTHROPIC_API_KEY', VALID_ENV.ANTHROPIC_API_KEY);
  vi.stubEnv('OPENROUTER_API_KEY', VALID_ENV.OPENROUTER_API_KEY);
  for (const [key, val] of Object.entries(overrides)) {
    vi.stubEnv(key, val);
  }
}

async function importLLMConfig() {
  const mod = await import('../config');
  return mod;
}

describe('LLM role config (getLLMConfig)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('returns config with primary.provider === "anthropic" for classification', async () => {
    stubEnv();
    const { getLLMConfig } = await importLLMConfig();
    const cfg = getLLMConfig('classification');
    expect(cfg.primary.provider).toBe('anthropic');
  });

  it('returns config with fallback.provider === "openrouter" for classification', async () => {
    stubEnv();
    const { getLLMConfig } = await importLLMConfig();
    const cfg = getLLMConfig('classification');
    expect(cfg.fallback).toBeDefined();
    expect(cfg.fallback!.provider).toBe('openrouter');
  });

  it('returns different models when env vars differ', async () => {
    stubEnv({ LLM_CLASSIFICATION_MODEL: 'custom-model-v1' });
    const { getLLMConfig } = await importLLMConfig();
    const cfg = getLLMConfig('classification');
    expect(cfg.primary.model).toBe('custom-model-v1');
  });

  it('returns valid configs for all 5 inference roles', async () => {
    stubEnv();
    const { getLLMConfig } = await importLLMConfig();
    const roles = ['classification', 'suggestion', 'guardrail', 'post-call-analysis', 'generation'] as const;

    for (const role of roles) {
      const cfg = getLLMConfig(role);
      expect(cfg.primary).toBeDefined();
      expect(cfg.primary.provider).toBe('anthropic');
      expect(cfg.primary.apiKey).toBe(VALID_ENV.ANTHROPIC_API_KEY);
      expect(cfg.fallback).toBeDefined();
      expect(cfg.fallback!.provider).toBe('openrouter');
      expect(cfg.fallback!.apiKey).toBe(VALID_ENV.OPENROUTER_API_KEY);
    }
  });
});
