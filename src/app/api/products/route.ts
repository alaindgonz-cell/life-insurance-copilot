import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { embedProduct } from '@/lib/embeddings/pipeline';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const CreateProductSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['term', 'whole', 'universal', 'final_expense']),
  description: z.string().min(1),
  features: z.array(z.string()),
  targetAge: z.string().optional(),
  priceRange: z.string().optional(),
});

export async function GET() {
  try {
    const allProducts = await db.select({
      id: products.id, name: products.name, category: products.category,
      description: products.description, features: products.features,
      targetAge: products.targetAge, priceRange: products.priceRange,
      createdAt: products.createdAt,
    }).from(products).orderBy(desc(products.createdAt));
    return NextResponse.json(allProducts);
  } catch (error) {
    logger.error({ error }, 'Error listing products');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = CreateProductSchema.parse(body);

    const [product] = await db.insert(products).values(data).returning();
    embedProduct(product.id).catch(err => logger.error({ error: err }, `Failed to embed product ${product.id}`));

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error creating product');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
