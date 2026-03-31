import type Anthropic from '@anthropic-ai/sdk';
import type { InferenceRole, LLMCallParams, LLMResponse } from './types';
import { getLLMConfig } from './config';
import { callWithFallback } from './fallback';
import { logger } from '../logger';
import { db } from '../db';
import { llmLogs } from '../db/schema';

type ContentBlock = Anthropic.ContentBlock;

const factoryLogger = logger.child({ component: 'llm-factory' });

export interface LLMClient {
  /**
   * Stream a response (default mode per D-04).
   * Returns the raw stream plus metadata for logging.
   */
  stream(params: LLMCallParams): Promise<{
    stream: Awaited<ReturnType<typeof callWithFallback>>['stream'];
    provider: 'anthropic' | 'openrouter';
    model: string;
    wasFallback: boolean;
  }>;

  /**
   * Convenience: call and wait for full response.
   * Collects the stream internally and returns the complete message.
   */
  call(params: LLMCallParams): Promise<LLMResponse>;
}

/**
 * Factory function per D-01: createLLMClient('classification') returns
 * a configured client based on the inference role.
 */
export function createLLMClient(role: InferenceRole): LLMClient {
  const roleConfig = getLLMConfig(role);

  return {
    async stream(params: LLMCallParams) {
      const result = await callWithFallback(roleConfig, params);

      factoryLogger.debug(
        { role, provider: result.provider, model: result.model, wasFallback: result.wasFallback },
        'LLM stream initiated'
      );

      return result;
    },

    async call(params: LLMCallParams) {
      const startTime = Date.now();
      const { stream, provider, model, wasFallback } = await callWithFallback(roleConfig, params);

      const finalMessage = await stream.finalMessage();
      const latencyMs = Date.now() - startTime;

      const blocks = finalMessage.content as ContentBlock[];

      const content = blocks
        .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
        .map((block) => block.text)
        .join('');

      const toolCalls = blocks.filter(
        (block): block is Extract<ContentBlock, { type: 'tool_use' }> => block.type === 'tool_use'
      );

      const response: LLMResponse = {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
          cacheReadTokens: (finalMessage.usage as Record<string, number>).cache_read_input_tokens,
          cacheCreationTokens: (finalMessage.usage as Record<string, number>).cache_creation_input_tokens,
        },
        model,
        provider,
        wasFallback,
      };

      // Log to database (fire-and-forget, don't block response)
      db.insert(llmLogs).values({
        role,
        provider,
        model,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cacheReadTokens: response.usage.cacheReadTokens ?? 0,
        cacheCreationTokens: response.usage.cacheCreationTokens ?? 0,
        latencyMs,
        wasFallback: wasFallback ? 1 : 0,
      }).catch((err) => {
        factoryLogger.error({ error: (err as Error).message }, 'Failed to log LLM call');
      });

      return response;
    },
  };
}
