import { db } from './index';
import { sql } from 'drizzle-orm';
import { generateEmbedding, embeddingToSql } from '../embeddings/client';

export interface SearchResult {
  id: string;
  type: 'product' | 'knowledge';
  title: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export async function semanticSearch(
  query: string,
  options: {
    topK?: number;
    minSimilarity?: number;
    types?: Array<'product' | 'knowledge'>;
  } = {}
): Promise<SearchResult[]> {
  const { topK = 5, minSimilarity = 0.6, types = ['product', 'knowledge'] } = options;

  const embedding = await generateEmbedding(query);
  const embSql = embeddingToSql(embedding);

  const results: SearchResult[] = [];

  if (types.includes('product')) {
    const products = await db.execute<{
      id: string; name: string; description: string; category: string; features: string[]; similarity: number;
    }>(sql`
      SELECT id, name, description, category, features,
        1 - (embedding <=> ${embSql}::vector) as similarity
      FROM products
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${embSql}::vector) > ${minSimilarity}
      ORDER BY embedding <=> ${embSql}::vector
      LIMIT ${topK}
    `);

    for (const p of products.rows) {
      results.push({
        id: p.id,
        type: 'product',
        title: p.name,
        content: p.description,
        similarity: p.similarity,
        metadata: { category: p.category, features: p.features },
      });
    }
  }

  if (types.includes('knowledge')) {
    const knowledge = await db.execute<{
      id: string; title: string; content: string; category: string; tags: string[]; similarity: number;
    }>(sql`
      SELECT id, title, content, category, tags,
        1 - (embedding <=> ${embSql}::vector) as similarity
      FROM knowledge_cards
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${embSql}::vector) > ${minSimilarity}
      ORDER BY embedding <=> ${embSql}::vector
      LIMIT ${topK}
    `);

    for (const k of knowledge.rows) {
      results.push({
        id: k.id,
        type: 'knowledge',
        title: k.title,
        content: k.content,
        similarity: k.similarity,
        metadata: { category: k.category, tags: k.tags },
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

export async function searchProducts(query: string, topK = 3): Promise<SearchResult[]> {
  return semanticSearch(query, { topK, types: ['product'] });
}

export async function searchKnowledge(query: string, category?: string, topK = 3): Promise<SearchResult[]> {
  const results = await semanticSearch(query, { topK: topK * 2, types: ['knowledge'] });
  if (category) {
    return results.filter((r) => r.metadata.category === category).slice(0, topK);
  }
  return results.slice(0, topK);
}
