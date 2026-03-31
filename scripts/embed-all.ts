#!/usr/bin/env ts-node
/**
 * Script to generate embeddings for all products and knowledge base entries.
 * Run after seeding: npm run db:embed
 */

import 'dotenv/config'
import { embedAll } from '../src/lib/embeddings/pipeline'

async function main() {
  console.log('Generating embeddings for all content...')
  const result = await embedAll()
  console.log(`Done! Embedded ${result.products} products, ${result.knowledge} knowledge entries`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
