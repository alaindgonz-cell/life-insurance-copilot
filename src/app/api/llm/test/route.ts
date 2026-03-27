import { NextRequest, NextResponse } from 'next/server';
import { createLLMClient, InferenceRole } from '@/lib/llm';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (config.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const role = (body.role as (typeof InferenceRole)[keyof typeof InferenceRole]) || InferenceRole.GENERATION;
    const prompt = body.prompt || 'Say "Hello from the Life Insurance Copilot!" in exactly those words.';

    const client = createLLMClient(role);
    const response = await client.call({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 256,
    });

    return NextResponse.json({
      success: true,
      role,
      provider: response.provider,
      model: response.model,
      wasFallback: response.wasFallback,
      content: response.content,
      usage: response.usage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
