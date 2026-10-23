'use client';

import RefillForecastCard from './RefillForecastCard';
import { ToolApprovalCard, ToolOutcomeCard } from './ToolApprovalCard';
import dynamic from 'next/dynamic';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { MyUIMessage } from '@/lib/chat-types';
import { useMedications } from '@/lib/use-medications';
import { localMedicationStore } from '@/lib/medication-store';
import type { Medication } from '@/lib/medications';

const Streamdown = dynamic(
  () => import('streamdown').then((mod) => mod.Streamdown),
  { ssr: false },
);

const STORAGE_KEY = 'dose-forecast-chat';
const STALL_TIMEOUT_MS = 30000; // no new content for 30s while active = treat as failed
const SAVE_ERROR =
  "That change couldn't be saved. Check the name, pill count, and doses per day, then try again.";

type MessagePart = MyUIMessage['parts'][number];
type AddPart = Extract<MessagePart, { type: 'tool-addMedication' }>;
type UpdatePart = Extract<MessagePart, { type: 'tool-updateMedicationStock' }>;

const CLIENT_TOOL_TYPES = ['tool-addMedication', 'tool-updateMedicationStock'];

function findMedication(list: Medication[], name: string) {
  const wanted = name.trim().toLowerCase();
  return list.find((m) => m.name.trim().toLowerCase() === wanted);
}

// Auto-continue only after the user answered one of the approval tools. The SDK's
// built-in helper would also re-send after every server-side forecast, costing an
// extra request on a rate-limited key. Only the latest step is checked (after the
// last 'step-start'), so the follow-up reply can't trigger another send.
function shouldSendAfterMedicationTools({ messages }: { messages: MyUIMessage[] }) {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'assistant') return false;

  let lastStepStart = -1;
  last.parts.forEach((part, index) => {
    if (part.type === 'step-start') lastStepStart = index;
  });

  const toolParts = last.parts.slice(lastStepStart + 1).filter((p) => p.type.startsWith('tool-'));
  const hasClientTool = toolParts.some((p) => CLIENT_TOOL_TYPES.includes(p.type));
  const allAnswered = toolParts.every(
    (p) => 'state' in p && (p.state === 'output-available' || p.state === 'output-error'),
  );

  return hasClientTool && allAnswered;
}

export default function ChatInterface() {
  const { medications, add, update } = useMedications();

  // Keep the latest saved medications in a ref so every request (send, retry,
  // example prompt) carries the current stock without recreating the transport.
  const medsRef = useRef(medications);
  useEffect(() => {
    medsRef.current = medications;
  }, [medications]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<MyUIMessage>({
        api: '/api/chat',
        // A function, not an object: an object would be captured once and go stale.
        body: () => ({
          medications: medsRef.current.map(({ name, pillsRemaining, dosesPerDay }) => ({
            name,
            pillsRemaining,
            dosesPerDay,
          })),
        }),
      }),
    [],
  );

  const [streamIssue, setStreamIssue] = useState(false);

  const { messages, sendMessage, status, stop, setMessages, error, regenerate, addToolOutput } =
    useChat<MyUIMessage>({
      transport,
      sendAutomaticallyWhen: shouldSendAfterMedicationTools,
      onFinish: ({ isDisconnect }) => {
        if (isDisconnect) {
          setStreamIssue(true);
        }
      },
    });

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [busyToolCallId, setBusyToolCallId] = useState<string | null>(null);
  const lastUpdateRef = useRef(Date.now());

  // While an approval card is open the assistant is waiting for an answer, so sending
  // another message would leave that tool call without a result and the server would
  // reject the request.
  const lastMessage = messages[messages.length - 1];
  const hasPendingApproval =
    lastMessage?.role === 'assistant' &&
    lastMessage.parts.some(
      (p) =>
        (p.type === 'tool-addMedication' || p.type === 'tool-updateMedicationStock') &&
        p.state === 'input-available',
    );

  const examples =
    medications.length > 0
      ? [
          `When will my ${medications[0].name} run out?`,
          'Which of my medications needs a refill first?',
          'Add Cetirizine, 30 pills, 1 a day',
        ]
      : [
          'Add Cetirizine, 30 pills, 1 a day',
          'I have 14 pills of Drug A left and I take 2 a day — when will I need a refill?',
          'What should I know about taking antibiotics with food?',
        ];

  // --- Approval handlers: the write happens here, in the browser, then we report back. ---

  const approveAdd = async (
    toolCallId: string,
    input: { name: string; pillsRemaining: number; dosesPerDay: number },
  ) => {
    if (busyToolCallId) return;
    setBusyToolCallId(toolCallId);
    try {
      const saved = await add(input);
      // Refresh the ref now so the follow-up request already includes the new medication.
      medsRef.current = await localMedicationStore.list();
      addToolOutput({
        tool: 'addMedication',
        toolCallId,
        output: { status: 'saved', name: saved.name },
      });
    } catch {
      addToolOutput({
        tool: 'addMedication',
        toolCallId,
        state: 'output-error',
        errorText: SAVE_ERROR,
      });
    } finally {
      setBusyToolCallId(null);
    }
  };

  const declineAdd = (toolCallId: string, name: string) => {
    addToolOutput({ tool: 'addMedication', toolCallId, output: { status: 'declined', name } });
  };

  const approveUpdate = async (
    toolCallId: string,
    input: { name: string; pillsRemaining: number },
  ) => {
    if (busyToolCallId) return;
    const target = findMedication(medsRef.current, input.name);
    if (!target) {
      addToolOutput({
        tool: 'updateMedicationStock',
        toolCallId,
        output: { status: 'not_found', name: input.name },
      });
      return;
    }

    setBusyToolCallId(toolCallId);
    try {
      await update(target.id, { pillsRemaining: input.pillsRemaining });
      medsRef.current = await localMedicationStore.list();
      addToolOutput({
        tool: 'updateMedicationStock',
        toolCallId,
        output: { status: 'updated', name: target.name },
      });
    } catch {
      addToolOutput({
        tool: 'updateMedicationStock',
        toolCallId,
        state: 'output-error',
        errorText: SAVE_ERROR,
      });
    } finally {
      setBusyToolCallId(null);
    }
  };

  const respondUpdate = (toolCallId: string, name: string, status: 'declined' | 'not_found') => {
    addToolOutput({ tool: 'updateMedicationStock', toolCallId, output: { status, name } });
  };

  // --- Rendering for the two approval tools ---

  const renderAddMedication = (part: AddPart, key: number) => {
    switch (part.state) {
      case 'input-streaming':
        return (
          <p key={key} className="text-xs text-gray-500 italic my-2 animate-pulse">
            Preparing a change to your list…
          </p>
        );

      case 'input-available': {
        const { name, pillsRemaining, dosesPerDay } = part.input;
        const exists = Boolean(findMedication(medications, name));
        return (
          <ToolApprovalCard
            key={key}
            title="Add this medication?"
            lines={[
              name,
              `${pillsRemaining} ${pillsRemaining === 1 ? 'pill' : 'pills'} in stock`,
              dosesPerDay === 0 ? 'As-needed' : `${dosesPerDay} per day`,
            ]}
            note={
              exists
                ? 'A medication with this name is already on your list. Approving adds a second entry.'
                : undefined
            }
            approveLabel="Add medication"
            busy={busyToolCallId === part.toolCallId}
            onApprove={() => approveAdd(part.toolCallId, part.input)}
            onDecline={() => declineAdd(part.toolCallId, name)}
          />
        );
      }

      case 'output-available':
        return part.output.status === 'saved' ? (
          <ToolOutcomeCard
            key={key}
            tone="success"
            title={`Added ${part.output.name}`}
            detail="It's now on your Medications page."
          />
        ) : (
          <ToolOutcomeCard
            key={key}
            tone="neutral"
            title="Change declined"
            detail="Your list was not changed."
          />
        );

      case 'output-error':
        return (
          <ToolOutcomeCard
            key={key}
            tone="error"
            title="Couldn't save the change"
            detail={part.errorText}
          />
        );

      default:
        return null;
    }
  };

  const renderUpdateStock = (part: UpdatePart, key: number) => {
    switch (part.state) {
      case 'input-streaming':
        return (
          <p key={key} className="text-xs text-gray-500 italic my-2 animate-pulse">
            Preparing a change to your list…
          </p>
        );

      case 'input-available': {
        const { name, pillsRemaining } = part.input;
        const target = findMedication(medications, name);

        if (!target) {
          return (
            <ToolApprovalCard
              key={key}
              title="Can't update that"
              note={`There's no saved medication named "${name}".`}
              declineLabel="Dismiss"
              onDecline={() => respondUpdate(part.toolCallId, name, 'not_found')}
            />
          );
        }

        return (
          <ToolApprovalCard
            key={key}
            title="Update stock?"
            lines={[target.name, `${target.pillsRemaining} → ${pillsRemaining} pills`]}
            approveLabel="Update stock"
            busy={busyToolCallId === part.toolCallId}
            onApprove={() => approveUpdate(part.toolCallId, part.input)}
            onDecline={() => respondUpdate(part.toolCallId, name, 'declined')}
          />
        );
      }

      case 'output-available': {
        const { status, name } = part.output;
        if (status === 'updated') {
          return (
            <ToolOutcomeCard
              key={key}
              tone="success"
              title={`Updated ${name}`}
              detail="Your stock count was saved."
            />
          );
        }
        if (status === 'not_found') {
          return (
            <ToolOutcomeCard
              key={key}
              tone="warning"
              title="Nothing was changed"
              detail={`There's no saved medication named "${name}".`}
            />
          );
        }
        return (
          <ToolOutcomeCard
            key={key}
            tone="neutral"
            title="Change declined"
            detail="Your list was not changed."
          />
        );
      }

      case 'output-error':
        return (
          <ToolOutcomeCard
            key={key}
            tone="error"
            title="Couldn't save the change"
            detail={part.errorText}
          />
        );

      default:
        return null;
    }
  };

  // Reset the retry-guard once a retry actually resolves (success or new error)
  useEffect(() => {
    if (status !== 'submitted' && status !== 'streaming') {
      setIsRetrying(false);
    }
  }, [status]);

  // Track the last time messages actually changed, so we can detect a silent stall
  useEffect(() => {
    lastUpdateRef.current = Date.now();
  }, [messages]);

  // Watchdog: if streaming/submitted goes quiet too long, treat it as a failed connection
  useEffect(() => {
    if (status !== 'streaming' && status !== 'submitted') return;

    const interval = setInterval(() => {
      if (Date.now() - lastUpdateRef.current > STALL_TIMEOUT_MS) {
        stop();
        setStreamIssue(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, stop]);

  const handleRetry = () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setStreamIssue(false);
    lastUpdateRef.current = Date.now();
    regenerate();
  };

  // Load saved conversation once, after mount (browser-only, avoids hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setMessages(JSON.parse(raw));
      }
    } catch {
      // corrupted data — ignore, start fresh
    }
    setHasLoaded(true);
  }, [setMessages]);

  // Persist whenever messages change — but only after the initial load has completed
  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, hasLoaded]);

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isNearBottom = (el: HTMLDivElement) =>
    el.scrollHeight - el.scrollTop - el.clientHeight < 48;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pinned = isNearBottom(el);
    isPinnedRef.current = pinned;
    setShowJumpToLatest(!pinned);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && isPinnedRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    isPinnedRef.current = true;
    setShowJumpToLatest(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== 'ready' || hasPendingApproval) return;
    sendMessage({ text: input });
    setInput('');
    isPinnedRef.current = true;
    setStreamIssue(false);
    lastUpdateRef.current = Date.now();
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 relative">
      <button
        onClick={clearConversation}
        className="text-xs text-gray-500 hover:text-gray-700 underline mb-2 self-start"
      >
        Clear conversation
      </button>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0"
      >
        {hasLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-2xl mb-2" aria-hidden="true">
              💊
            </p>
            <h2 className="font-semibold text-gray-800 mb-1">Ask about your medications</h2>
            <p className="text-sm text-gray-500 mb-4 max-w-xs">
              I can help you track dosages, plan refills, and understand your medication schedule.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    sendMessage({ text: example });
                    isPinnedRef.current = true;
                  }}
                  className="text-left text-sm bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 hover:border-blue-400 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${
              m.role === 'user'
                ? 'bg-blue-600 text-white ml-auto max-w-[80%]'
                : 'bg-gray-200 text-gray-800 mr-auto max-w-[80%]'
            }`}
          >
            <p className="text-xs font-bold mb-1">{m.role === 'user' ? 'You' : 'AI'}</p>
            {m.parts.map((part, i) => {
              if (part.type === 'text') {
                return (
                  <Streamdown key={i} isAnimating={status === 'streaming'} className="text-sm">
                    {part.text}
                  </Streamdown>
                );
              }

              if (part.type === 'tool-addMedication') {
                return renderAddMedication(part, i);
              }

              if (part.type === 'tool-updateMedicationStock') {
                return renderUpdateStock(part, i);
              }

              if (part.type === 'tool-getRefillForecast') {
                switch (part.state) {
                  case 'input-streaming':
                    return (
                      <div key={i} className="text-xs text-gray-500 italic my-2 animate-pulse">
                        Reading dosage details…
                      </div>
                    );

                  case 'input-available':
                    return (
                      <div key={i} className="text-xs text-gray-500 italic my-2 animate-pulse">
                        Calculating refill forecast for {part.input?.drugName ?? '…'}…
                      </div>
                    );

                  case 'output-available':
                    return <RefillForecastCard key={i} result={part.output} />;

                  case 'output-error':
                    return (
                      <div
                        key={i}
                        className="rounded-lg border-2 border-red-300 bg-red-50 p-3 my-2 text-sm text-red-800"
                      >
                        <p className="font-semibold mb-1">Couldn't calculate a forecast</p>
                        <p>{part.errorText}</p>
                      </div>
                    );

                  default:
                    return null;
                }
              }

              return null;
            })}
          </div>
        ))}

        {status === 'submitted' && (
          <div className="bg-gray-200 text-gray-800 p-3 rounded-lg mr-auto max-w-[80%] text-sm animate-pulse">
            Thinking...
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-lg mr-auto max-w-[80%] text-sm">
            <p className="font-semibold mb-1">Message failed to send</p>
            <p className="text-red-700 mb-2">
              {error?.message || 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {isRetrying ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        )}

        {streamIssue && status !== 'streaming' && status !== 'submitted' && (
          <div className="bg-orange-50 border-2 border-orange-300 text-orange-800 p-3 rounded-lg mr-auto max-w-[80%] text-sm">
            <p className="font-semibold mb-1">Connection interrupted</p>
            <p className="text-orange-700 mb-2">
              The response was cut off partway through. The text above is incomplete — retry to get
              the full answer.
            </p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-orange-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-orange-700 disabled:opacity-50"
            >
              {isRetrying ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        )}
      </div>

      {showJumpToLatest && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-md"
        >
          Jump to latest ↓
        </button>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          id="message-input"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            hasPendingApproval
              ? 'Approve or decline the request above to continue'
              : 'Ask about your medication schedule or dose forecast...'
          }
          disabled={status === 'error' || hasPendingApproval}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {status === 'streaming' || status === 'submitted' ? (
          <button
            type="button"
            onClick={() => stop()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={status !== 'ready' || !input.trim() || hasPendingApproval}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}