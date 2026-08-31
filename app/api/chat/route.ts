import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { DOSE_FORECAST_SYSTEM_PROMPT, AI_MODEL_CONFIG } from '@/config/ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('gemini-2.5-flash'),
      system: DOSE_FORECAST_SYSTEM_PROMPT,
      messages,
      temperature: AI_MODEL_CONFIG.temperature,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}