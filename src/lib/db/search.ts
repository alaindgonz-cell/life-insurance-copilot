import { prisma } from './client'
import { generateEmbedding, embeddingToSql } from '../embeddings/client'

export interface SearchResult {
  id: string
  type: 'product' | 'knowledge'
  title: string
  content: string
  similarity: number
  metadata: Record<string, unknown>
}

/**
 * Semantic search over products and knowledge base using pgvector cosine similarity.
 */
export async function semanticSearch(
  query: string,
  options: {
    topK?: number
    minSimilarity?: number
    types?: Array<'product' | 'knowledge'>
  } = {}
): Promise<SearchResult[]> {
  const { topK = 5, minSimilarity = 0.6, types = ['product', 'knowledge'] } = options

  const embedding = await generateEmbedding(query)
  const embSql = embeddingToSql(embedding)

  const results: SearchResult[] = []

  if (types.includes('product')) {
    const products = await prisma.$queryRaw<
      Array<{ id: string; name: string; description: string; category: string; features: string[]; similarity: number }>
    >`
      SELECT
        id, name, description, category, features,
        1 - (embedding <=> ${embSql}::vector) as similarity
      FROM "Product"
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${embSql}::vector) > ${minSimilarity}
      ORDER BY embedding <=> ${embSql}::vector
      LIMIT ${topK}
    `

    results.push(
      ...products.map((p) => ({
        id: p.id,
        type: 'product' as const,
        title: p.name,
        content: p.description,
        similarity: p.similarity,
        metadata: { category: p.category, features: p.features },
      }))
    )
  }

  if (types.includes('knowledge')) {
    const knowledge = await prisma.$queryRaw<
      Array<{ id: string; title: string; content: string; category: string; tags: string[]; similarity: number }>
    >`
      SELECT
        id, title, content, category, tags,
        1 - (embedding <=> ${embSql}::vector) as similarity
      FROM "KnowledgeBase"
      WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> ${embSql}::vector) > ${minSimilarity}
      ORDER BY embedding <=> ${embSql}::vector
      LIMIT ${topK}
    `

    results.push(
      ...knowledge.map((k) => ({
        id: k.id,
        type: 'knowledge' as const,
        title: k.title,
        content: k.content,
        similarity: k.similarity,
        metadata: { category: k.category, tags: k.tags },
      }))
    )
  }

  // Sort all results by similarity descending
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
}

export async function searchProducts(query: string, topK = 3): Promise<SearchResult[]> {
  return semanticSearch(query, { topK, types: ['product'] })
}

export async function searchKnowledge(query: string, category?: string, topK = 3): Promise<SearchResult[]> {
  // For knowledge with category filter, fall back to text search when embedding search is insufficient
  const results = await semanticSearch(query, { topK: topK * 2, types: ['knowledge'] })
  if (category) {
    return results.filter((r) => r.metadata.category === category).slice(0, topK)
  }
  return results.slice(0, topK)
}
