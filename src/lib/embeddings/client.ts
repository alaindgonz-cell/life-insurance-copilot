import { VoyageAIClient } from 'voyageai';
import { config } from '../config';

const voyage = new VoyageAIClient({ apiKey: config.VOYAGE_API_KEY || config.ANTHROPIC_API_KEY });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await voyage.embed({
    model: 'voyage-3',
    input: text,
  });
  const first = response.data?.[0];
  if (!first || !first.embedding) throw new Error('No embedding returned from Voyage AI');
  return first.embedding;
}

export function embeddingToSql(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
