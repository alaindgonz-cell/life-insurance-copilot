import { VoyageAIClient } from 'voyageai'

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY ?? process.env.ANTHROPIC_API_KEY })

/**
 * Generate a 1024-dimensional embedding for the given text using Voyage AI.
 * Uses the voyage-3 model via the Voyage AI embedding API.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await voyage.embed({
    model: 'voyage-3',
    input: text,
  })
  const first = response.data?.[0]
  if (!first || !first.embedding) throw new Error('No embedding returned from Voyage AI')
  return first.embedding
}

export function embeddingToSql(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
