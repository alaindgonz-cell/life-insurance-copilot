import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  LLM_CLASSIFICATION_MODEL: z.string().default('claude-opus-4-6'),
  LLM_SUGGESTION_MODEL: z.string().default('claude-opus-4-6'),
  LLM_GUARDRAIL_MODEL: z.string().default('claude-opus-4-6'),
  LLM_GENERATION_MODEL: z.string().default('claude-opus-4-6'),
  LLM_POST_CALL_ANALYSIS_MODEL: z.string().default('claude-opus-4-6'),
  LLM_FALLBACK_MODEL: z.string().default('anthropic/claude-opus-4.6'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  WS_PORT: z.coerce.number().default(3001),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
