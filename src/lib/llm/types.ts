import Anthropic from '@anthropic-ai/sdk';

export const InferenceRole = {
  CLASSIFICATION: 'classification',
  SUGGESTION: 'suggestion',
  GUARDRAIL: 'guardrail',
  POST_CALL_ANALYSIS: 'post-call-analysis',
  GENERATION: 'generation',
} as const;

export type InferenceRole = typeof InferenceRole[keyof typeof InferenceRole];

export interface LLMProviderConfig {
  provider: 'anthropic' | 'openrouter';
  model: string;
  baseUrl?: string;
  apiKey: string;
}

export interface RoleConfig {
  primary: LLMProviderConfig;
  fallback?: LLMProviderConfig;
}

// Streaming message params type -- extends Anthropic's MessageCreateParams
export interface LLMCallParams {
  system?: string | Array<Anthropic.TextBlockParam>;
  messages: Anthropic.MessageParam[];
  max_tokens?: number;
  tools?: Anthropic.Tool[];
  temperature?: number;
}

// Result wrapper for non-streaming calls
export interface LLMResponse {
  content: string;
  toolCalls?: Anthropic.ToolUseBlock[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
  };
  model: string;
  provider: 'anthropic' | 'openrouter';
  wasFallback: boolean;
}
