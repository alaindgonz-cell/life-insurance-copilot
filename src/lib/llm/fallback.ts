import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../logger';
import type { RoleConfig, LLMCallParams } from './types';
import { injectCacheControl } from './cache';

const fallbackLogger = logger.child({ component: 'llm-fallback' });

/**
 * Determines if an error is retryable (rate limit, timeout, 5xx).
 * Non-retryable: 400 bad request, 401 auth, 404 not found.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.RateLimitError) return true;
  if (error instanceof Anthropic.InternalServerError) return true;
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIConnectionTimeoutError) return true;
  // Generic timeout detection
  if (error instanceof Error && error.message.toLowerCase().includes('timeout')) return true;
  return false;
}

/**
 * Calls the primary provider. On retryable failure, silently falls back to the fallback provider.
 * Logs the fallback but never surfaces it to the caller (per D-05: rep should never notice).
 *
 * Returns: { stream, provider, model, wasFallback }
 */
export async function callWithFallback(
  roleConfig: RoleConfig,
  params: LLMCallParams
): Promise<{
  stream: ReturnType<Anthropic['messages']['stream']>;
  provider: 'anthropic' | 'openrouter';
  model: string;
  wasFallback: boolean;
}> {
  const { primary, fallback } = roleConfig;

  // Prepare system with cache_control for primary
  const systemBlocks = params.system
    ? injectCacheControl(params.system, primary)
    : undefined;

  try {
    const client = new Anthropic({
      apiKey: primary.apiKey,
      ...(primary.baseUrl ? { baseURL: primary.baseUrl } : {}),
    });

    const stream = client.messages.stream({
      model: primary.model,
      max_tokens: params.max_tokens ?? 1024,
      ...(systemBlocks ? { system: systemBlocks } : {}),
      messages: params.messages,
      ...(params.tools ? { tools: params.tools } : {}),
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    });

    return { stream, provider: primary.provider, model: primary.model, wasFallback: false };
  } catch (error) {
    if (isRetryableError(error) && fallback) {
      fallbackLogger.warn(
        { role: primary.model, error: (error as Error).message, fallbackModel: fallback.model },
        'Primary LLM provider failed, falling back silently'
      );

      // Prepare system with cache_control for fallback
      const fallbackSystemBlocks = params.system
        ? injectCacheControl(params.system, fallback)
        : undefined;

      const fallbackClient = new Anthropic({
        apiKey: fallback.apiKey,
        ...(fallback.baseUrl ? { baseURL: fallback.baseUrl } : {}),
      });

      const stream = fallbackClient.messages.stream({
        model: fallback.model,
        max_tokens: params.max_tokens ?? 1024,
        ...(fallbackSystemBlocks ? { system: fallbackSystemBlocks } : {}),
        messages: params.messages,
        ...(params.tools ? { tools: params.tools } : {}),
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      });

      return { stream, provider: fallback.provider, model: fallback.model, wasFallback: true };
    }

    throw error;
  }
}
