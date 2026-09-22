# Dose Forecast Assistant 💊
A streaming AI chat interface built for the "Streaming AI Chat Interface" capstone assignment - the core AI interaction for the Dose Forecast Tracker app.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS**
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/google`)
- **Google Gemini** (`gemini-3.6-flash`) via Google AI Studio
- **Streamdown** for streaming-safe markdown rendering

## Features

- Token-by-token streaming responses
- Stop button — cancels generation mid-stream without breaking chat state
- Scroll-aware auto-scroll: pins to bottom while the user is at the bottom, releases on manual scroll up, with a "Jump to latest" affordance
- Thinking indicator before the first token
- Conversation persisted to `localStorage`, survives page refresh
- "Clear conversation" control
- Mobile-friendly layout (`h-dvh`, responsive input)

## Getting started

\`\`\`bash
npm install
\`\`\`

Create `.env.local` in the project root:

\`\`\`
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
\`\`\`

Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/api/chat/route.ts` — server route handler, calls Gemini via `streamText`, returns a UI message stream
- `components/ChatInterface.tsx` — client chat component using `useChat`
- `config/ai.ts` — system prompt and model config in one module

## Known limitations

- If the page is refreshed while a response is actively streaming, that partial message is not recovered (no server-side stream resumption - persistence is client-only via `localStorage`).

## Tool: `getRefillForecast`

Calculates when a medication will run out and needs a refill, based on current pill count and daily dosage.

**When it's used:** the assistant calls this automatically whenever the user asks about refill timing, running out of medication, or how long their current supply will last — once it has a pill count and a doses-per-day figure.

**Input schema (Zod):**

| Field | Type | Description |
|---|---|---|
| `drugName` | `string` | Name of the medication |
| `pillsRemaining` | `number` (int, ≥ 0) | Pills/doses currently in stock |
| `dosesPerDay` | `number` (≥ 0) | Doses taken per day. `0` indicates an as-needed (PRN) medication |

**Return shape (success):**

\`\`\`ts
{
  drugName: string;
  pillsRemaining: number;
  dosesPerDay: number;
  daysRemaining: number;
  refillByDate: string;   // YYYY-MM-DD
  status: 'ok' | 'low' | 'critical';
}
\`\`\`

**Error case:** if `dosesPerDay` is `0`, the tool throws a descriptive error instead of dividing by zero, since a PRN medication's usage can't be forecasted from a fixed daily rate. This is rendered in the UI as a distinct red error card, using the SDK's `onError` forwarding (errors are masked by default; this route explicitly forwards the thrown message).

**Rendering:** each of the tool's four lifecycle states gets a distinct visual treatment in `ChatInterface.tsx` — a quiet status line while input streams/resolves, a color-coded `RefillForecastCard` component (green/yellow/red by urgency) on success, and a red error card with the actual error message on failure.

## Error handling & edge cases

- **Route-level error boundary** (`app/error.tsx`) - catches render-time crashes elsewhere uncaught by React, with a "Try again" recovery action.
- **Pre-send / request failures** - `useChat`'s `error` state renders a designed red card with the actual error message and a working **Retry** button (via `regenerate()`), which resends only the failed message, not the whole conversation. The input is disabled while an error is showing to avoid conflicting state.
- **Mid-stream disconnects** — since a dropped connection after streaming has started doesn't reliably surface through `useChat`'s built-in `error`/`isDisconnect` signals, a client-side stall watchdog tracks time since the last content update. If a response goes silent for 30s while active, it's treated as failed: the in-flight request is stopped, the partial (incomplete) text is preserved and a distinct orange "Connection interrupted" card with Retry appears.
- **Server error responses are returned as plain text**, not JSON - `toUIMessageStreamResponse`'s default error masking (`onError`) is configured to forward the actual error message so the UI shows a clean sentence instead of raw JSON.
- **Tool execution failures** - both designed validation errors (e.g. a PRN/0-doses-per-day medication) and genuine unexpected runtime errors render through the same `output-error` tool-part state as a designed card, not a crash.
- **First-run empty state** - a new conversation shows onboarding copy plus three click-to-fill example prompts, rather than a blank panel.