"use client";

import { CalendarClock, Gauge, HelpCircle, ListChecks, type LucideIcon } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { colorFor, formatTimestamp } from "@/lib/format";
import type { Insights } from "@/lib/types";

/** Which transcript lines to show: a label for the banner and the line ids. */
export interface TranscriptFilter {
  key: string;
  label: string;
  ids: Set<number>;
}

const ICONS: Record<string, LucideIcon> = {
  tasks: ListChecks,
  questions: HelpCircle,
  dates: CalendarClock,
  metrics: Gauge,
};

interface Props {
  insights: Insights | null;
  /** Line ids for each speaker, used when a speaker is clicked. */
  speakerLineIds: Map<string, number[]>;
  active: TranscriptFilter | null;
  onChange: (filter: TranscriptFilter | null) => void;
}

export function SmartSearchPanel({ insights, speakerLineIds, active, onChange }: Props) {
  if (!insights) return <p className="p-6 text-muted">Analysing the transcript…</p>;
  if (insights.speakers.length === 0) {
    return <p className="p-6 text-muted">Smart search needs a transcript.</p>;
  }

  // Clicking the active filter again clears it.
  const toggle = (key: string, label: string, ids: number[]) =>
    onChange(active?.key === key ? null : { key, label, ids: new Set(ids) });

  return (
    <div className="mx-auto max-w-2xl px-5 py-7">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">Smart filters</h2>
      <p className="mb-3 mt-1 text-[13px] text-muted">Pick a filter to show only those lines of the transcript.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {insights.filters.map((filter) => {
          const Icon = ICONS[filter.key] ?? ListChecks;
          const selected = active?.key === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              aria-pressed={selected}
              disabled={filter.count === 0}
              onClick={() => toggle(filter.key, filter.label, filter.segment_ids)}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left disabled:opacity-50 ${
                selected ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface hover:bg-hover"
              }`}
            >
              <Icon size={16} />
              <span className="flex-1 font-medium">{filter.label}</span>
              <span className="tabular-nums text-muted">{filter.count}</span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-muted">Speakers</h2>
      <p className="mb-3 mt-1 text-[13px] text-muted">Share of talk time. Pick a speaker to show only their lines.</p>
      <div className="space-y-1.5">
        {insights.speakers.map((speaker) => {
          const key = `speaker:${speaker.name}`;
          const selected = active?.key === key;
          return (
            <button
              key={speaker.name}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(key, speaker.name, speakerLineIds.get(speaker.name) ?? [])}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${
                selected ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-hover"
              }`}
            >
              <Avatar name={speaker.name} size={26} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{speaker.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {speaker.percent}% · {formatTimestamp(speaker.talk_ms)}
                  </span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-hover">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${speaker.percent}%`, background: colorFor(speaker.name) }}
                  />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
