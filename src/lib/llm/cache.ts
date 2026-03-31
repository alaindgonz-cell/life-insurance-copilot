import Anthropic from '@anthropic-ai/sdk';
import type { LLMProviderConfig } from './types';

/**
 * Injects cache_control on system prompt text blocks when using Anthropic provider.
 * OpenRouter may or may not honor cache_control -- we inject it regardless and let the provider decide.
 *
 * Per Anthropic docs:
 * - Minimum cacheable tokens: 4,096 for Claude Opus 4.6
 * - Cache TTL: 5 minutes (refreshed on each hit)
 * - Max 4 cache breakpoints per request
 * - Place cached content at the beginning of the prompt
 */
export function injectCacheControl(
  system: string | Array<Anthropic.TextBlockParam>,
  providerConfig: LLMProviderConfig
): Array<Anthropic.TextBlockParam> {
  // Convert string to block array
  const blocks: Array<Anthropic.TextBlockParam> = typeof system === 'string'
    ? [{ type: 'text' as const, text: system }]
    : [...system];

  // Only inject cache_control for Anthropic provider (OpenRouter support is unverified)
  if (providerConfig.provider === 'anthropic' && blocks.length > 0) {
    // Add cache_control to the last system block (the playbook)
    const lastBlock = blocks[blocks.length - 1];
    return [
      ...blocks.slice(0, -1),
      { ...lastBlock, cache_control: { type: 'ephemeral' as const } },
    ];
  }

  return blocks;
}
