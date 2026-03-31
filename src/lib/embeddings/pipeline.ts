import { prisma } from '../db/client'
import { generateEmbedding, embeddingToSql } from './client'

/**
 * Generate and store embeddings for a product.
 */
export async function embedProduct(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error(`Product ${productId} not found`)

  const text = [
    product.name,
    product.description,
    product.category,
    product.features.join(', '),
  ].join('\n')

  const embedding = await generateEmbedding(text)
  const embSql = embeddingToSql(embedding)

  await prisma.$executeRaw`
    UPDATE "Product"
    SET embedding = ${embSql}::vector
    WHERE id = ${productId}
  `

  console.log(`[EmbeddingPipeline] Embedded product: ${product.name}`)
}

/**
 * Generate and store embeddings for a knowledge base entry.
 */
export async function embedKnowledgeEntry(entryId: string): Promise<void> {
  const entry = await prisma.knowledgeBase.findUnique({ where: { id: entryId } })
  if (!entry) throw new Error(`KnowledgeBase entry ${entryId} not found`)

  const text = [entry.title, entry.content, entry.category, entry.tags.join(', ')].join('\n')

  const embedding = await generateEmbedding(text)
  const embSql = embeddingToSql(embedding)

  await prisma.$executeRaw`
    UPDATE "KnowledgeBase"
    SET embedding = ${embSql}::vector
    WHERE id = ${entryId}
  `

  console.log(`[EmbeddingPipeline] Embedded knowledge entry: ${entry.title}`)
}

/**
 * Re-embed all products and knowledge entries (for initial setup).
 */
export async function embedAll(): Promise<{ products: number; knowledge: number }> {
  const products = await prisma.product.findMany({ select: { id: true } })
  const knowledge = await prisma.knowledgeBase.findMany({ select: { id: true } })

  for (const p of products) {
    await embedProduct(p.id)
  }

  for (const k of knowledge) {
    await embedKnowledgeEntry(k.id)
  }

  return { products: products.length, knowledge: knowledge.length }
}
