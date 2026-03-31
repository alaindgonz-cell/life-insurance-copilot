import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { embedProduct } from '@/lib/embeddings/pipeline'

const CreateProductSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['term', 'whole', 'universal', 'final_expense']),
  description: z.string().min(1),
  features: z.array(z.string()),
  targetAge: z.string().optional(),
  priceRange: z.string().optional(),
})

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        features: true,
        targetAge: true,
        priceRange: true,
        createdAt: true,
      },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('[API] Error listing products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const data = CreateProductSchema.parse(body)

    const product = await prisma.product.create({ data })

    // Generate embedding in background
    embedProduct(product.id).catch((err) =>
      console.error(`[API] Failed to embed product ${product.id}:`, err)
    )

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[API] Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
