import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { AI_MODEL_CONFIG, buildSystemPrompt } from '@/config/ai';
import { tools } from '@/lib/tools';
import { inventorySchema } from '@/lib/medications';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: UIMessage[] = body.messages;

    // Saved medications come from the browser (local-first storage), so treat them
    // as untrusted input: validate, cap the size, and fall back to "none" if invalid.
    const parsed = inventorySchema.safeParse(body.medications ?? []);
    const medications = parsed.success ? parsed.data : [];

    const result = streamText({
      model: google(AI_MODEL_CONFIG.model),
      system: buildSystemPrompt(medications),
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
    return new Response(error.message || 'Failed to process chat request', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}