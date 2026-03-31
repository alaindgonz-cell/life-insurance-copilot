import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Generate a 1536-dimensional embedding for the given text using Claude.
 * Uses the voyage-3 model via Anthropic's embedding API.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await anthropic.embeddings.create({
    model: 'voyage-3',
    input: text,
  })
  return response.data[0].embedding
}

export function embeddingToSql(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
