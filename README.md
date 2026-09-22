# Dose Forecast Assistant 💊

**Dose Forecast Assistant** is an AI-powered chat interface that helps patients on multi-drug regimens track medication supply and forecast refill timing. It's built for anyone managing more than one prescription who needs to reason about pill counts, dosing frequency, and when they'll run out — a common but tedious task usually done manually with a calendar or pillbox. I chose this idea because it demonstrates AI used for something concrete rather than decorative: the assistant doesn't just answer questions about medications in prose, it calls a real deterministic tool (`getRefillForecast`) to calculate exact refill dates from user-supplied pill counts and dosing schedules, combining conversational flexibility with the precision a health-adjacent tool actually needs.

## Live Demo

[your Vercel URL here]

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS**
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/google`)
- **Google Gemini** (`gemini-3.6-flash`) via Google AI Studio
- **Streamdown** for streaming-safe markdown rendering (lazy-loaded)
- **Vitest** + **React Testing Library** for unit tests

## Features

- Token-by-token streaming responses
- Stop button — cancels generation mid-stream without breaking chat state
- Scroll-aware auto-scroll: pins to bottom while the user is at the bottom, releases on manual scroll up, with a "Jump to latest" affordance
- Thinking indicator before the first token
- A real server-side tool (`getRefillForecast`) with typed lifecycle states rendered distinctly in the UI
- Conversation persisted to `localStorage`, survives page refresh
- "Clear conversation" control
- First-run empty state with click-to-fill example prompts
- Mobile-friendly layout (`h-dvh`, responsive input)
- Designed error states for network failures, mid-stream disconnects, rate limits, and tool execution failures — each with a working retry

## Getting Started

```bash
npm install
```

Create `.env.local` in the project root:


Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- `app/api/chat/route.ts` — server route handler; calls Gemini via `streamText`, registers the `getRefillForecast` tool, and returns a UI message stream. Forwards real error messages to the client instead of the SDK's default masked "An error occurred."
- `app/error.tsx` — route-level error boundary catching render-time crashes not otherwise handled by React.
- `components/ChatInterface.tsx` — client chat component using `useChat`; owns streaming state, retry logic, mid-stream stall detection, scroll behavior, and localStorage persistence.
- `components/RefillForecastCard.tsx` — the rendered result of a successful tool call, color-coded by urgency.
- `lib/tools.ts` — the `getRefillForecast` tool definition (Zod schema + `execute`).
- `lib/chat-types.ts` — a custom `UIMessage` type inferred from the tool definitions, giving typed `input`/`output` on tool parts throughout the client.
- `config/ai.ts` — system prompt and model config in one module.

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

```ts
{
  drugName: string;
  pillsRemaining: number;
  dosesPerDay: number;
  daysRemaining: number;
  refillByDate: string;   // YYYY-MM-DD
  status: 'ok' | 'low' | 'critical';
}
```

**Error case:** if `dosesPerDay` is `0`, the tool throws a descriptive error instead of dividing by zero, since a PRN medication's usage can't be forecasted from a fixed daily rate.

**Rendering:** each of the tool's four lifecycle states gets a distinct visual treatment — a quiet status line while input streams/resolves, a color-coded `RefillForecastCard` on success, and a red error card with the actual error message on failure.

## Error Handling & Edge Cases

- **Route-level error boundary** (`app/error.tsx`) — catches render-time crashes elsewhere uncaught by React, with a "Try again" recovery action.
- **Pre-send / request failures** — `useChat`'s `error` state renders a designed red card with the actual error message and a working **Retry** button (via `regenerate()`), which resends only the failed message, not the whole conversation. The input is disabled while an error is showing.
- **Mid-stream disconnects** — since a dropped connection after streaming has started doesn't reliably surface through `useChat`'s built-in error/disconnect signals, a client-side stall watchdog tracks time since the last content update. If a response goes silent too long while active, it's treated as failed: the in-flight request is stopped, the partial (incomplete) text is preserved, and a distinct orange "Connection interrupted" card with Retry appears.
- **Server error responses are returned as plain text**, not JSON — `toUIMessageStreamResponse`'s `onError` is configured to forward the actual error message so the UI shows a clean sentence instead of raw JSON (verified via a simulated 429).
- **Tool execution failures** — both designed validation errors (e.g. a PRN/0-doses-per-day medication) and genuine unexpected runtime errors render through the same `output-error` tool-part state as a designed card, not a crash.
- **First-run empty state** — a new conversation shows onboarding copy plus three click-to-fill example prompts, rather than a blank panel.

## Testing

8 unit tests across two files, run with:

```bash
npm test
```

- `lib/tools.test.ts` — 5 tests covering `getRefillForecast`'s core math (days remaining, refill date format), all three status thresholds (`ok`/`low`/`critical`, including the boundary case), and the PRN (0 doses/day) error path.
- `components/RefillForecastCard.test.tsx` — 3 tests covering rendered content and status-label correctness across states.

## Performance & Accessibility

- **Lighthouse:** Accessibility 98–100, Best Practices 100, SEO 100, Performance 100 (desktop) / 75–82 (mobile, throttled)
- **axe DevTools:** 0 issues (1 moderate heading-hierarchy issue found and fixed — see below)
- **Concrete improvements made from audit findings:**
  - *Accessibility:* axe flagged a heading-level skip (`<h1>` → `<h3>`) caused by the AI streaming markdown headings into responses. Fixed by instructing the model, via the system prompt, to use bold labels and lists instead of markdown headings — keeps the page's heading hierarchy clean for screen reader navigation.
  - *Performance:* Lighthouse flagged unused JavaScript and long main-thread tasks on mobile. Lazy-loaded the `Streamdown` markdown renderer via `next/dynamic` so it's excluded from the initial bundle and only loads once a message actually needs rendering — raised mobile Performance from ~46 to ~82.

## Deployment Checklist

**Platform:** Vercel (auto-deploys from GitHub) · **Branch:** `capstone`

**Pre-deployment**
- [x] Environment variables configured in Vercel (`GOOGLE_GENERATIVE_AI_API_KEY`), scoped correctly
- [x] `.env.local` excluded from git — no secrets committed
- [x] Production build tested locally (`npm run build && npm run start`) before relying on Vercel's build
- [x] All unit tests passing before deploy
- [x] No console errors during the happy path

**Error handling verified (manual sabotage testing)**
- [x] Pre-send network failure → designed error + retry
- [x] Mid-stream disconnect → stall watchdog → designed error + retry
- [x] Simulated 429 → clean error message, not raw JSON
- [x] Tool execution failure (designed + simulated crash) → designed error card, not a crash
- [x] Route-level render crash → caught by `error.tsx`

**Post-deployment verification**
- [x] Live URL tested end-to-end
- [x] Tested at mobile viewport width
- [x] Lighthouse and axe results confirmed above

**Monitoring:** Vercel's built-in deployment and runtime function logs. No external monitoring/alerting (e.g. Sentry) integrated at this stage — a known limitation.

**Rollback Plan:** If a deployment regresses, go to the Vercel dashboard → Deployments → locate the last known-good deployment → **Promote to Production** to instantly revert the live URL without a new commit. Fix forward on `capstone` in parallel, then promote the new build once verified.

## Known Limitations

- If the page is refreshed while a response is actively streaming, that partial message is not recovered — persistence is client-only via `localStorage`, with no server-side stream resumption.
- No automated alerting/monitoring beyond Vercel's built-in logs.
- Mobile Lighthouse Performance (75–82) is below the 90+ target; a real trade-off made under time constraints (see Reflection).

## Reflection

**What was hardest, and why:** The hardest problems weren't the AI integration itself — streaming, tool calling, and structured output all worked close to as documented once I understood the current SDK version's API surface. What consistently cost the most time was the *seams between systems that don't fail loudly*. A missing Tailwind install produced a cascade of layout symptoms that looked like a scroll bug, a flex bug, and a CSS bug in turn, before the real cause surfaced. Detecting a mid-stream connection failure was similarly deceptive: the AI SDK's own disconnect signal didn't fire reliably in testing, and Chrome DevTools' network throttling doesn't reliably simulate real browser offline events either — so I built a client-side stall-timeout heuristic instead, calibrating it against real (sometimes slow) model response times after two rounds of false positives.

**What I'd do differently next time:** I'd write tests earlier, in parallel with features, rather than as a late-stage pass — testing `getRefillForecast` after the fact was easy precisely because it's a pure function, but writing that test first likely would have surfaced the 0-doses-per-day edge case as a designed requirement from the start. I'd also audit accessibility and performance continuously rather than at the end — it turned out to be mostly clean already from using semantic HTML throughout, suggesting it's cheaper to maintain than to fix retroactively.

**One thing that surprised me:** How much of "AI product engineering" is actually about the failure paths, not the happy path. The model calling a tool and returning a clean result was the easy part; correctly distinguishing a legitimately slow response from a dead connection, forwarding a useful error message instead of a masked generic one, and making a retry button resend only the failed message instead of the whole conversation took far more iteration than the core streaming/tool-calling implementation itself.
