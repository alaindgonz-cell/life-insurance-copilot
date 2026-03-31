import { config } from '../config';
import type { InferenceRole, RoleConfig, LLMProviderConfig } from './types';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api';

function makePrimary(model: string): LLMProviderConfig {
  // Detect if using OpenRouter key (allows all roles to route via OpenRouter temporarily)
  const isOpenRouterKey = config.ANTHROPIC_API_KEY.startsWith('sk-or-');
  return {
    provider: isOpenRouterKey ? 'openrouter' : 'anthropic',
    model,
    apiKey: config.ANTHROPIC_API_KEY,
    ...(isOpenRouterKey ? { baseUrl: OPENROUTER_BASE_URL } : {}),
  };
}

function makeFallback(): LLMProviderConfig {
  return {
    provider: 'openrouter',
    model: config.LLM_FALLBACK_MODEL,
    baseUrl: OPENROUTER_BASE_URL,
    apiKey: config.OPENROUTER_API_KEY,
  };
}

const roleConfigMap: Record<InferenceRole, RoleConfig> = {
  classification: {
    primary: makePrimary(config.LLM_CLASSIFICATION_MODEL),
    fallback: makeFallback(),
  },
  suggestion: {
    primary: makePrimary(config.LLM_SUGGESTION_MODEL),
    fallback: makeFallback(),
  },
  guardrail: {
    primary: makePrimary(config.LLM_GUARDRAIL_MODEL),
    fallback: makeFallback(),
  },
  'post-call-analysis': {
    primary: makePrimary(config.LLM_POST_CALL_ANALYSIS_MODEL),
    fallback: makeFallback(),
  },
  generation: {
    primary: makePrimary(config.LLM_GENERATION_MODEL),
    fallback: makeFallback(),
  },
};

export function getLLMConfig(role: InferenceRole): RoleConfig {
  return roleConfigMap[role];
}
