import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed Products
  const products = [
    {
      id: uuidv4(),
      name: '20-Year Term Life',
      category: 'term',
      description:
        'Affordable term life insurance providing pure death benefit coverage for 20 years. Ideal for families in peak earning years needing maximum coverage at minimum cost.',
      features: [
        'Fixed premium for 20 years',
        'Death benefit $100K-$5M',
        'Convertible to permanent policy',
        'No cash value',
        'Level premium',
        'Available ages 18-65',
      ],
      targetAge: '25-45',
      priceRange: '$15-$80/month',
    },
    {
      id: uuidv4(),
      name: '10-Year Term Life',
      category: 'term',
      description:
        'Short-term pure protection for a decade. Perfect for covering a specific financial obligation like a mortgage or business loan.',
      features: [
        'Fixed premium for 10 years',
        'Death benefit $50K-$2M',
        'Lower premiums than 20-year term',
        'Convertible option available',
        'Available ages 18-70',
      ],
      targetAge: '30-60',
      priceRange: '$10-$50/month',
    },
    {
      id: uuidv4(),
      name: 'Whole Life Insurance',
      category: 'whole',
      description:
        'Permanent life insurance with guaranteed death benefit and cash value growth. Provides lifelong coverage and builds wealth over time.',
      features: [
        'Permanent coverage — never expires',
        'Guaranteed cash value growth',
        'Tax-deferred cash accumulation',
        'Policy loans available',
        'Fixed premiums for life',
        'Dividend-eligible (participating policies)',
      ],
      targetAge: '30-65',
      priceRange: '$100-$500/month',
    },
    {
      id: uuidv4(),
      name: 'Universal Life Insurance',
      category: 'universal',
      description:
        'Flexible permanent life insurance allowing you to adjust premiums and death benefit over time. Combines protection with a cash value component.',
      features: [
        'Flexible premium payments',
        'Adjustable death benefit',
        'Cash value grows at current interest rates',
        'Can skip premium payments when cash value is sufficient',
        'Transparency in cost structure',
      ],
      targetAge: '35-65',
      priceRange: '$150-$600/month',
    },
    {
      id: uuidv4(),
      name: 'Final Expense Insurance',
      category: 'final_expense',
      description:
        'Simplified issue whole life insurance designed to cover funeral costs and end-of-life expenses. No medical exam required.',
      features: [
        'No medical exam required',
        'Simplified health questions only',
        'Coverage $5K-$25K',
        'Permanent coverage',
        'Fixed premiums',
        'Available ages 50-85',
        'Immediate or graded death benefit',
      ],
      targetAge: '50-85',
      priceRange: '$30-$150/month',
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    })
  }

  console.log(`Seeded ${products.length} products`)

  // Seed Knowledge Base
  const knowledgeEntries = [
    {
      id: uuidv4(),
      category: 'objection',
      title: 'Too Expensive Objection',
      content:
        'When a prospect says the premium is too expensive, acknowledge the concern and reframe: "I understand budget is important. Let\'s look at what you\'d be leaving your family without coverage — even our most affordable term policy for just $20/month could provide $250,000 for your loved ones. That\'s less than a dollar a day for peace of mind."',
      tags: ['expensive', 'cost', 'price', 'budget', 'afford'],
    },
    {
      id: uuidv4(),
      category: 'objection',
      title: 'Need to Think About It Objection',
      content:
        'When a prospect says they need to think about it: "Absolutely, this is an important decision. While you think about it, can I ask — what specific aspect are you most uncertain about? Is it the cost, the type of coverage, or something else? That way I can make sure I\'ve given you the right information to make your decision."',
      tags: ['think', 'later', 'time', 'decide', 'not sure'],
    },
    {
      id: uuidv4(),
      category: 'objection',
      title: 'Already Have Coverage Objection',
      content:
        'When a prospect says they already have coverage: "That\'s great you\'re already thinking about protection! Many people find their employer coverage ends when they leave a job, and the death benefit may not fully cover their family\'s needs long-term. Would it be worth taking 5 minutes to see if your current coverage has any gaps?"',
      tags: ['already have', 'existing policy', 'employer', 'coverage'],
    },
    {
      id: uuidv4(),
      category: 'objection',
      title: 'Need to Talk to Spouse First',
      content:
        'When a prospect wants to consult their spouse: "Of course, this is a family decision and it makes complete sense to discuss it together. Would it be possible to schedule a brief call with both of you? That way I can answer any questions your spouse might have directly, and you won\'t need to relay complex policy details."',
      tags: ['spouse', 'husband', 'wife', 'partner', 'family'],
    },
    {
      id: uuidv4(),
      category: 'compliance',
      title: 'Avoid Guarantee Language',
      content:
        'COMPLIANCE: Never use words like "guarantee," "definitely," or "promise" about investment returns, approval outcomes, or specific policy performance. Correct phrasing: "Based on current rates..." or "Historically, this type of policy has..." or "Subject to underwriting approval..."',
      tags: ['guarantee', 'compliance', 'promise', 'returns'],
    },
    {
      id: uuidv4(),
      category: 'compliance',
      title: 'Required Free Look Disclosure',
      content:
        'COMPLIANCE: All policies come with a free look period (typically 10-30 days depending on state). You must disclose: "Once you receive your policy, you have [X] days to review it. If you\'re not completely satisfied, you can return it for a full refund of your premium — no questions asked."',
      tags: ['free look', 'cancel', 'refund', 'disclosure'],
    },
    {
      id: uuidv4(),
      category: 'script',
      title: 'Opening the Needs Analysis',
      content:
        'Opening script for needs analysis: "To make sure I recommend the right coverage for you, I\'d like to ask a few quick questions. First, do you have any dependents — spouse, children, or others who rely on your income? And roughly, what are your major financial obligations — mortgage, debts, college plans?"',
      tags: ['opening', 'needs analysis', 'script', 'dependents', 'income'],
    },
    {
      id: uuidv4(),
      category: 'faq',
      title: 'Term vs. Whole Life Explained',
      content:
        'Term life provides pure protection for a set period (10, 20, 30 years) at lower cost — great for covering specific needs like income replacement or mortgage. Whole life is permanent and builds cash value, costing more but providing lifelong coverage and a savings component. Simple rule: "If you need it for a specific time, term. If you need it for life, whole life."',
      tags: ['term', 'whole life', 'difference', 'compare', 'explain'],
    },
  ]

  for (const entry of knowledgeEntries) {
    await prisma.knowledgeBase.upsert({
      where: { id: entry.id },
      update: entry,
      create: entry,
    })
  }

  console.log(`Seeded ${knowledgeEntries.length} knowledge base entries`)
  console.log('Seeding complete!')
  console.log('')
  console.log('Next steps:')
  console.log('  Run: npm run db:embed  (to generate vector embeddings)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
