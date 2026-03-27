import { describe, it, expect } from 'vitest';
import { injectCacheControl } from '../cache';
import type { LLMProviderConfig } from '../types';

/**
 * Tests for src/lib/llm/cache.ts
 * Validates cache_control injection behavior for Anthropic vs OpenRouter.
 * Pure function tests -- no env or external dependencies.
 */

const anthropicConfig: LLMProviderConfig = {
  provider: 'anthropic',
  model: 'claude-opus-4-6',
  apiKey: 'test-key',
};

const openrouterConfig: LLMProviderConfig = {
  provider: 'openrouter',
  model: 'anthropic/claude-opus-4.6',
  baseUrl: 'https://openrouter.ai/api',
  apiKey: 'test-key',
};

describe('injectCacheControl', () => {
  it('adds cache_control to last block when provider is anthropic', () => {
    const blocks = injectCacheControl('Hello system prompt', anthropicConfig);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toHaveProperty('cache_control');
    expect((blocks[0] as any).cache_control).toEqual({ type: 'ephemeral' });
  });

  it('does NOT add cache_control when provider is openrouter', () => {
    const blocks = injectCacheControl('Hello system prompt', openrouterConfig);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).not.toHaveProperty('cache_control');
  });

  it('handles string input by converting to TextBlockParam array', () => {
    const blocks = injectCacheControl('Test prompt', anthropicConfig);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('text');
    expect(blocks[0].text).toBe('Test prompt');
  });

  it('handles TextBlockParam[] input', () => {
    const input = [
      { type: 'text' as const, text: 'First block' },
      { type: 'text' as const, text: 'Second block' },
    ];
    const blocks = injectCacheControl(input, anthropicConfig);
    expect(blocks).toHaveLength(2);
    // Only last block should have cache_control
    expect(blocks[0]).not.toHaveProperty('cache_control');
    expect((blocks[1] as any).cache_control).toEqual({ type: 'ephemeral' });
  });

  it('returns original blocks unchanged for openrouter with array input', () => {
    const input = [
      { type: 'text' as const, text: 'First block' },
      { type: 'text' as const, text: 'Second block' },
    ];
    const blocks = injectCacheControl(input, openrouterConfig);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).not.toHaveProperty('cache_control');
    expect(blocks[1]).not.toHaveProperty('cache_control');
  });
});
