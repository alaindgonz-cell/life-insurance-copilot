import { db } from '../db';
import { knowledgeCards } from './schema';
import { sql } from 'drizzle-orm';

/**
 * Seed script for knowledge_cards table.
 * Populates cards reflecting the 14-angle playbook structure with key flow stages.
 *
 * Run with: npx tsx src/lib/db/seed.ts
 */

// All 16 angles from FLW-01 in REQUIREMENTS.md
const ANGLES = [
  'Standard',
  'Preferred',
  'Term',
  'Permanent',
  'Loan',
  'Death Claim',
  'New Shopper',
  'Dental/Vision',
  'Auto',
  'Homeowners',
  '401K',
  'Annuity',
  'Cash-Out Extension',
  'Beneficiary',
  'Annual Review',
  'Maternity/Leave',
] as const;

interface SeedCard {
  angle: string;
  stage: string;
  content: string;
  metadata: Record<string, unknown>;
}

function generateCards(): SeedCard[] {
  const cards: SeedCard[] = [];

  const angleData: Record<string, { greeting: string; hook: string; close: string }> = {
    Standard: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you have a Standard life insurance policy with us. How can I help you today?',
      hook:
        'Now [customer name], I can see here that you\'ve had your policy for [X years]. What\'s great is that based on your current health and the time you\'ve had this policy, you may actually qualify for a better rate. Would you like me to take a quick look at what options are available?',
      close:
        'Based on everything we\'ve discussed, I\'d recommend Option 2 -- the Premier Series. It gives you [coverage amount] of protection for just [price] per month. That\'s locked in and can never go up. Shall I get that started for you right now?',
    },
    Preferred: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you\'re a Preferred member -- thank you for being a valued customer. What can I assist you with today?',
      hook:
        '[Customer name], because you have Preferred status, you actually qualify for rates that aren\'t available to the general public. I\'d love to take 60 seconds to show you what exclusive options you have. Would that be okay?',
      close:
        'With your Preferred status, you\'re looking at Option 2 at just [price] per month for [coverage amount]. This is a rate most people can\'t get. Want me to lock that in before it changes?',
    },
    Term: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I can see you have a Term life policy. How can I help you today?',
      hook:
        '[Customer name], I notice your term policy is set to expire in [X years]. A lot of our customers don\'t realize that when a term policy expires, you lose all that coverage overnight. Have you thought about what happens after your term ends?',
      close:
        'The good news is we can convert your term policy to permanent coverage right now with no new medical exam required. That means your [coverage amount] stays with you for life at [price] per month. Should I process that conversion today?',
    },
    Permanent: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you have a Permanent life insurance policy with us. What can I do for you today?',
      hook:
        '[Customer name], your permanent policy has been building cash value over [X years]. Did you know you can use that cash value while you\'re still alive? Many of our customers don\'t realize the living benefits they already have.',
      close:
        'I\'d recommend we increase your coverage to [amount] while keeping your premium at just [price] per month. Your cash value continues growing, and your family gets more protection. Let me get that set up for you.',
    },
    Loan: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you\'re calling about a policy loan. Let me pull up your account and help you with that.',
      hook:
        '[Customer name], I can absolutely help with your loan request. But before we do that, I want to make sure you know -- taking a loan against your policy reduces your death benefit. Have you considered other options that might work better for your situation?',
      close:
        'Instead of the loan, what I\'d suggest is Option 2 -- we restructure your coverage so you free up [amount] in cash while actually increasing your death benefit. That way your family is still protected. Sound good?',
    },
    'Death Claim': {
      greeting:
        'Thank you for calling [company], this is [rep name]. I\'m so sorry for your loss. I\'m here to help make this process as smooth as possible. Can you tell me a little about the policyholder?',
      hook:
        'I want you to know that we\'re going to take care of everything. While we process this claim, I also want to make sure your own family is protected. Many beneficiaries discover they need their own coverage during times like this. Would it be okay if I mentioned a few options?',
      close:
        'Given everything your family is going through, having your own [coverage amount] policy at just [price] per month means one less thing to worry about. And I can get it started right now with just a few questions. Shall we do that?',
    },
    'New Shopper': {
      greeting:
        'Thank you for calling [company], this is [rep name]. Welcome! I understand you\'re looking into life insurance options. That\'s a great step. What prompted you to start looking?',
      hook:
        '[Customer name], that\'s exactly why most of our customers call. The truth is, the younger and healthier you are, the less it costs. Every day you wait, the price goes up. Let me show you what you qualify for right now.',
      close:
        'Based on your age and health, you qualify for [coverage amount] at just [price] per month. That rate is locked in today -- if you wait even a few months, it could be higher. Should I get your application started?',
    },
    'Dental/Vision': {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you\'re calling about your dental and vision benefits. How can I help?',
      hook:
        '[Customer name], I\'m happy to help with your dental/vision question. While I have you, I noticed you don\'t currently have a life insurance policy with us. Did you know we offer coverage starting at just [price] per month? That\'s less than your dental premium.',
      close:
        'So for just [price] per month -- about the cost of a coffee -- you\'d have [coverage amount] of life insurance protecting your family. And I can bundle it right here with your dental/vision. Want me to add it on?',
    },
    Auto: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you have an auto insurance policy with us. What can I help you with today?',
      hook:
        '[Customer name], absolutely -- let me help with that. Quick question though: you\'ve got your car protected, but what about protecting your family\'s income if something happened to you? A lot of our auto customers add life insurance for less than their car payment.',
      close:
        'For just [price] per month -- that\'s less than your monthly car payment -- you\'d have [coverage amount] of coverage. And since you\'re already a customer, I can set this up in about 5 minutes. Ready to get started?',
    },
    Homeowners: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you have a homeowners policy with us. How can I assist you?',
      hook:
        '[Customer name], your home is probably your biggest asset, right? Let me ask -- if something happened to you tomorrow, could your family keep making the mortgage payments? Life insurance makes sure your home stays in your family no matter what.',
      close:
        'What I recommend is [coverage amount] -- that\'s enough to pay off your mortgage and leave your family with a cushion. At just [price] per month, it\'s a fraction of your mortgage payment. Shall I set it up?',
    },
    '401K': {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you\'re calling about your 401K or retirement planning. What questions do you have?',
      hook:
        '[Customer name], that\'s a great question about your 401K. Here\'s something most people don\'t think about: if something happens to you, your family might need to cash out your 401K early and pay huge penalties. A life insurance policy protects your retirement savings by giving your family a separate, tax-free benefit.',
      close:
        'With [coverage amount] of coverage at [price] per month, your 401K stays untouched for retirement, and your family has a separate safety net. It\'s the smart play. Want me to get the paperwork going?',
    },
    Annuity: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you have an annuity with us. How can I help today?',
      hook:
        '[Customer name], your annuity is doing great for your retirement income. But here\'s what I see with a lot of our annuity customers -- they don\'t have enough life insurance to protect the wealth they\'ve built. If something happened, would your beneficiaries be covered beyond the annuity?',
      close:
        'Adding [coverage amount] of life insurance at [price] per month means your annuity keeps growing for retirement income, and your family gets a separate, tax-free death benefit. Best of both worlds. Should I get that started?',
    },
    'Cash-Out Extension': {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you\'re calling about a cash-out or policy extension. Let me pull up your details.',
      hook:
        '[Customer name], before we process that cash-out, I want to make sure you\'re getting the most value. A lot of our customers who cash out end up wanting coverage again later -- and by then, it costs significantly more. What if I could show you a way to get cash AND keep your coverage?',
      close:
        'Here\'s what I suggest: instead of cashing out completely, we restructure to Option 2. You get [cash amount] now, keep [coverage amount] of coverage, and your new premium is just [price] per month. You get the best of both. Sound fair?',
    },
    Beneficiary: {
      greeting:
        'Thank you for calling [company], this is [rep name]. I see you\'d like to update your beneficiary information. I\'m happy to help with that.',
      hook:
        '[Customer name], great -- it\'s important to keep your beneficiary info current. While we\'re making this change, I want to make sure your coverage amount is still right for your situation. Your current policy is [amount] -- with your life changes, is that still enough to take care of your family?',
      close:
        'Since your situation has changed, I\'d recommend bumping your coverage to [new amount]. That\'s just [price difference] more per month and ensures your updated beneficiary is fully taken care of. Want me to update both at the same time?',
    },
    'Annual Review': {
      greeting:
        'Thank you for calling [company], this is [rep name]. It looks like it\'s time for your annual policy review. Great timing -- let\'s make sure everything is up to date.',
      hook:
        '[Customer name], a lot has probably changed in the past year. New job? New baby? Mortgage changes? Your coverage should reflect your life today, not last year. Let me do a quick review and see if we can actually get you better protection.',
      close:
        'Based on your current situation, I\'d recommend upgrading to [coverage amount] with the Premier Series. Your new rate would be just [price] per month -- and that\'s locked in. Should I make the change effective today?',
    },
    'Maternity/Leave': {
      greeting:
        'Thank you for calling [company], this is [rep name]. Congratulations on the new addition to your family! How can I help you today?',
      hook:
        '[Customer name], this is such an exciting time! And it\'s also the perfect time to make sure your growing family is protected. With a new baby, your financial responsibilities just went up significantly. Have you thought about whether your current coverage is enough?',
      close:
        'For your growing family, I recommend [coverage amount] -- that covers college, the mortgage, and gives your spouse peace of mind. At just [price] per month, it\'s a small price for that kind of security. Ready to get it set up?',
    },
  };

  for (const angle of ANGLES) {
    const data = angleData[angle];

    cards.push({
      angle,
      stage: 'greeting',
      content: data.greeting,
      metadata: {
        tips: ['Use warm, professional tone', 'Acknowledge existing relationship', 'Listen for reason for call'],
      },
    });

    cards.push({
      angle,
      stage: 'hook',
      content: data.hook,
      metadata: {
        tips: ['Transition naturally from their reason for calling', 'Use takeaway before application', 'Create curiosity'],
        psychology: 'Scarcity and curiosity framing -- imply exclusive opportunity',
      },
    });

    cards.push({
      angle,
      stage: 'close',
      content: data.close,
      metadata: {
        tips: ['Present three options (Option 2 is the recommended one)', 'Benefits before price', 'Urgency framing'],
        psychology: 'Anchoring with three options, decoy effect makes Option 2 the obvious choice',
      },
    });
  }

  return cards;
}

async function main() {
  console.log('Seeding knowledge_cards table...');

  // Clear existing knowledge cards
  await db.delete(knowledgeCards);
  console.log('Cleared existing knowledge cards.');

  const cards = generateCards();

  // Insert all cards
  await db.insert(knowledgeCards).values(
    cards.map((card) => ({
      angle: card.angle,
      stage: card.stage,
      content: card.content,
      metadata: card.metadata,
      // embedding is null -- Phase 4 populates embeddings
    }))
  );

  console.log(`Inserted ${cards.length} knowledge cards across ${ANGLES.length} angles.`);
  console.log('Seed complete.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
