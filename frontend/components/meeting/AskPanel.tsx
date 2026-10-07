"use client";

import { MessageCircleQuestion, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { api } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { AskResponse } from "@/lib/types";

interface Exchange {
  question: string;
  response: AskResponse | null;
  error?: string;
}

const SUGGESTIONS = ["What was decided?", "What are the next steps?", "Were any risks raised?"];

export function AskPanel({ meetingId, onSeek }: { meetingId: number; onSeek: (ms: number) => void }) {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [asking, setAsking] = useState(false);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2 || asking) return;
    setAsking(true);
    setQuestion("");
    setExchanges((current) => [...current, { question: trimmed, response: null }]);
    // Fill in the answer (or the error) on the exchange that was just added.
    const finish = (result: Partial<Exchange>) =>
      setExchanges((current) =>
        current.map((exchange, index) =>
          index === current.length - 1 ? { ...exchange, ...result } : exchange,
        ),
      );
    try {
      finish({ response: await api.ask(meetingId, trimmed) });
    } catch (error) {
      finish({ error: (error as Error).message });
    } finally {
      setAsking(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(question);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {exchanges.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface p-5 text-center">
            <MessageCircleQuestion size={22} className="mx-auto mb-2 text-brand" />
            <p className="font-semibold">Ask about this meeting</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted">
              Answers quote the most relevant lines of the transcript, with links to the moment
              they were said.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="rounded-full border border-line px-3 py-1 text-[13px] hover:border-brand hover:text-brand"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {exchanges.map((exchange, index) => (
          <div key={index} className="space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand px-3.5 py-2 text-white dark:text-[#16131f]">
              {exchange.question}
            </p>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5">
              {exchange.error ? (
                <p className="text-red-500">{exchange.error}</p>
              ) : !exchange.response ? (
                <p className="text-muted">Searching the transcript…</p>
              ) : exchange.response.sources.length === 0 ? (
                <p>{exchange.response.answer}</p>
              ) : (
                <>
                  <p className="mb-2 text-[13px] text-muted">Here is what the meeting says about that:</p>
                  <ul className="space-y-2">
                    {exchange.response.sources.map((source) => (
                      <li key={source.id} className="border-l-2 border-brand pl-2.5">
                        <button
                          type="button"
                          onClick={() => onSeek(source.start_ms)}
                          className="text-xs font-medium text-brand hover:underline"
                        >
                          {source.speaker_name} at {formatTimestamp(source.start_ms)}
                        </button>
                        <p className="leading-relaxed">{source.text}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex shrink-0 gap-2 border-t border-line p-3">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about this meeting"
          aria-label="Question"
          className="h-9 flex-1 rounded-lg border border-line bg-surface px-3 outline-none placeholder:text-muted focus:border-brand"
        />
        <button
          type="submit"
          disabled={asking || question.trim().length < 2}
          aria-label="Ask"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-50 dark:text-[#16131f]"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
