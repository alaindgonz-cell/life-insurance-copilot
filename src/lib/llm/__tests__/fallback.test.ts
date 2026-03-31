import { describe, it, expect, vi } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';

// Mock the logger to avoid crash-early config parsing
vi.mock('../../logger', () => ({
  logger: {
    child: () => ({
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

import { isRetryableError } from '../fallback';

/**
 * Tests for src/lib/llm/fallback.ts
 * Validates error classification for retry/fallback decisions.
 *
 * Creates mock Anthropic SDK error instances to test isRetryableError.
 */

// Helper to create a minimal Headers-like object for APIError constructor
const fakeHeaders = { get: () => null } as unknown as Headers;

describe('isRetryableError', () => {
  it('returns true for RateLimitError', () => {
    const error = new Anthropic.RateLimitError(429, undefined, 'Rate limited', fakeHeaders);
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for InternalServerError', () => {
    const error = new Anthropic.InternalServerError(500, undefined, 'Server error', fakeHeaders);
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns false for generic Error', () => {
    const error = new Error('Something went wrong');
    expect(isRetryableError(error)).toBe(false);
  });

  it('returns true for APIConnectionError', () => {
    const error = new Anthropic.APIConnectionError({ message: 'Connection failed', cause: new Error('ECONNREFUSED') });
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for APIConnectionTimeoutError', () => {
    const error = new Anthropic.APIConnectionTimeoutError({ message: 'Request timed out' });
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns true for generic timeout errors', () => {
    const error = new Error('Request timeout after 30s');
    expect(isRetryableError(error)).toBe(true);
  });

  it('returns false for non-error values', () => {
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
    expect(isRetryableError('string error')).toBe(false);
  });
});
