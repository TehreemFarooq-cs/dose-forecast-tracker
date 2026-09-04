import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { DOSE_FORECAST_SYSTEM_PROMPT, AI_MODEL_CONFIG } from '@/config/ai';
import { tools } from '@/lib/tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: google(AI_MODEL_CONFIG.model),
      system: DOSE_FORECAST_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature: AI_MODEL_CONFIG.temperature,
      maxOutputTokens: AI_MODEL_CONFIG.maxOutputTokens,
      tools,
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        if (error == null) return 'Something went wrong.';
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        return 'Something went wrong.';
      },
    });
  } catch (error: any) {
    console.error('Error in chat route:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}