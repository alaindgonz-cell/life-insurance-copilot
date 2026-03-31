import { db } from '../db';
import { products, knowledgeCards } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { generateEmbedding, embeddingToSql } from './client';
import { logger } from '../logger';

export async function embedProduct(productId: string): Promise<void> {
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) throw new Error(`Product ${productId} not found`);

  const text = [product.name, product.description, product.category, ...(product.features || [])].filter(Boolean).join('\n');
  const embedding = await generateEmbedding(text);
  const embSql = embeddingToSql(embedding);

  await db.execute(sql`UPDATE products SET embedding = ${embSql}::vector WHERE id = ${productId}`);
  logger.info({ productId, name: product.name }, 'Embedded product');
}

export async function embedKnowledgeEntry(entryId: string): Promise<void> {
  const [entry] = await db.select().from(knowledgeCards).where(eq(knowledgeCards.id, entryId));
  if (!entry) throw new Error(`Knowledge entry ${entryId} not found`);

  const text = [entry.title, entry.content, entry.category, ...(entry.tags || [])].filter(Boolean).join('\n');
  const embedding = await generateEmbedding(text);
  const embSql = embeddingToSql(embedding);

  await db.execute(sql`UPDATE knowledge_cards SET embedding = ${embSql}::vector WHERE id = ${entryId}`);
  logger.info({ entryId, title: entry.title }, 'Embedded knowledge entry');
}

export async function embedAll(): Promise<{ products: number; knowledge: number }> {
  const allProducts = await db.select({ id: products.id }).from(products);
  const allKnowledge = await db.select({ id: knowledgeCards.id }).from(knowledgeCards);

  for (const p of allProducts) await embedProduct(p.id);
  for (const k of allKnowledge) await embedKnowledgeEntry(k.id);

  return { products: allProducts.length, knowledge: allKnowledge.length };
}
