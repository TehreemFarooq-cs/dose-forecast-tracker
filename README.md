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