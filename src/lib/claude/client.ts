import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateSuggestion(
  transcriptContext: string,
  suggestionType: 'product_info' | 'objection_handler' | 'compliance' | 'tip'
): Promise<string> {
  const systemPrompts: Record<typeof suggestionType, string> = {
    product_info: `You are a life insurance product expert. Based on the conversation context,
      provide a concise (2-3 sentences) product recommendation or information point that would
      help the agent. Focus on specific product features relevant to what the prospect said.`,
    objection_handler: `You are an expert insurance sales trainer. Based on the objection raised
      in the conversation, provide a concise (2-3 sentences) response strategy. Be empathetic
      and address the specific concern mentioned.`,
    compliance: `You are a life insurance compliance officer. Flag any compliance-sensitive
      statements and provide the correct phrasing. Keep responses brief and actionable.`,
    tip: `You are an experienced insurance sales coach. Based on the conversation flow,
      provide a brief (1-2 sentence) tactical tip to help move the conversation forward.`,
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: systemPrompts[suggestionType],
    messages: [
      {
        role: 'user',
        content: `Recent conversation:\n${transcriptContext}\n\nProvide a helpful ${suggestionType.replace('_', ' ')} suggestion for the agent.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')
  return content.text
}
