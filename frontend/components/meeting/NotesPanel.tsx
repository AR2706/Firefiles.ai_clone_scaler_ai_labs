"use client";

import { ChevronDown, Copy, Pencil, Sparkles, Star, Wand2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { TagChip } from "@/components/meetings/MeetingRow";
import { AvatarStack } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dropdown, MenuItem } from "@/components/ui/Dropdown";
import { inputClass } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { formatDate, formatDuration, formatTime, formatTimestamp } from "@/lib/format";
import type { MeetingDetail, SummaryStyle } from "@/lib/types";

import { ActionItems } from "./ActionItems";

const REFINE_OPTIONS: { style: SummaryStyle; label: string; hint: string }[] = [
  { style: "condensed", label: "Condense", hint: "List only key points" },
  { style: "standard", label: "Standard", hint: "The default level of detail" },
  { style: "expanded", label: "Expand and elaborate", hint: "Adds more detail and context" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

/** The whole summary as plain text, for the copy button. */
function summaryAsText(meeting: MeetingDetail): string {
  const lines = [meeting.title, ""];
  if (meeting.summary?.overview) lines.push("Overview", meeting.summary.overview, "");
  if (meeting.summary?.key_points.length) {
    lines.push("Notes", ...meeting.summary.key_points.map((point) => `- ${point}`), "");
  }
  if (meeting.chapters.length) {
    lines.push(
      "Time-stamped notes",
      ...meeting.chapters.map((c) => `- ${formatTimestamp(c.start_ms)} ${c.title}: ${c.summary}`),
      "",
    );
  }
  if (meeting.action_items.length) {
    lines.push(
      "Action items",
      ...meeting.action_items.map(
        (item) => `- [${item.is_done ? "x" : " "}] ${item.text}${item.assignee ? ` (${item.assignee})` : ""}`,
      ),
    );
  }
  return lines.join("\n").trim();
}

interface Props {
  meeting: MeetingDetail;
  currentMs: number;
  hasTranscript: boolean;
  onMeetingChange: (meeting: MeetingDetail) => void;
  onSeek: (ms: number) => void;
}

export function NotesPanel({ meeting, currentMs, hasTranscript, onMeetingChange, onSeek }: Props) {
  const toast = useToast();
  const { summary, chapters } = meeting;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  /** Run a request, show a toast, and keep the buttons disabled meanwhile. */
  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveOverview = () =>
    run(async () => {
      const updated = await api.updateSummary(meeting.id, { overview: draft });
      onMeetingChange({ ...meeting, summary: updated });
      setEditing(false);
    }, "Summary updated");

  const refine = (style: SummaryStyle) =>
    run(async () => onMeetingChange(await api.regenerateSummary(meeting.id, style)), "Summary rewritten from the transcript");

  const rate = (rating: number) =>
    run(async () => {
      const updated = await api.updateSummary(meeting.id, { rating });
      onMeetingChange({ ...meeting, summary: updated });
    }, "Thanks for the feedback");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryAsText(meeting));
      toast.success("Summary copied");
    } catch {
      toast.error("Copying is blocked in this browser.");
    }
  };

  // The chapter being played is the last one that has already started.
  const activeChapterId = [...chapters].reverse().find((chapter) => chapter.start_ms <= currentMs)?.id;

  return (
    <article className="mx-auto max-w-2xl px-5 py-7">
      <h1 className="text-2xl font-semibold tracking-tight">{meeting.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
        {meeting.participants.length > 0 && (
          <AvatarStack names={meeting.participants.map((p) => p.name)} max={5} />
        )}
        <span>
          {formatDate(meeting.started_at)}, {formatTime(meeting.started_at)}
        </span>
        <span>{formatDuration(meeting.duration_seconds)}</span>
        {meeting.tags.map((tag) => (
          <TagChip key={tag.id} name={tag.name} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1 border-b border-line pb-2">
        <span className="flex items-center gap-1.5 px-1 text-[13px] font-medium text-brand">
          <Sparkles size={14} /> General summary
        </span>
        <Dropdown
          align="left"
          width="w-64"
          trigger={(toggle, open) => (
            <Button size="sm" variant="ghost" onClick={toggle} disabled={busy || !hasTranscript} aria-expanded={open}>
              <Wand2 size={13} /> Refine summary <ChevronDown size={13} />
            </Button>
          )}
        >
          {(close) => (
            <>
              <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Rewrite from the transcript
              </div>
              {REFINE_OPTIONS.map((option) => (
                <MenuItem
                  key={option.style}
                  onClick={() => {
                    close();
                    refine(option.style);
                  }}
                >
                  <span>
                    <span className="block font-medium">
                      {option.label}
                      {summary?.style === option.style && summary.generated_by !== "seed" ? " (current)" : ""}
                    </span>
                    <span className="block text-xs text-muted">{option.hint}</span>
                  </span>
                </MenuItem>
              ))}
            </>
          )}
        </Dropdown>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy summary"
          title="Copy summary"
          className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-ink"
        >
          <Copy size={14} />
        </button>
        {!editing && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => {
              setDraft(summary?.overview ?? "");
              setEditing(true);
            }}
          >
            <Pencil size={13} /> Edit
          </Button>
        )}
      </div>

      {summary && summary.keywords.length > 0 && (
        <Section title="Keywords">
          <div className="flex flex-wrap gap-1.5">
            {summary.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[13px]">
                {keyword}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Overview">
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={6}
              aria-label="Overview"
              className={`${inputClass} resize-y leading-relaxed`}
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={saveOverview} disabled={busy}>Save</Button>
            </div>
          </div>
        ) : summary?.overview ? (
          <p className="leading-relaxed">{summary.overview}</p>
        ) : (
          <p className="text-muted">
            {hasTranscript
              ? "No summary yet. Use Refine summary to create one from the transcript."
              : "This meeting has no transcript. Choose Edit to write a summary by hand."}
          </p>
        )}
      </Section>

      {summary && summary.key_points.length > 0 && (
        <Section title="Notes">
          <ul className="space-y-1.5">
            {summary.key_points.map((point) => (
              <li key={point} className="flex gap-2.5 leading-relaxed">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {chapters.length > 0 && (
        <Section title="Time-stamped notes">
          <ol className="-mx-2 space-y-0.5">
            {chapters.map((chapter) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  onClick={() => onSeek(chapter.start_ms)}
                  className={`block w-full rounded-lg px-2 py-1.5 text-left ${
                    chapter.id === activeChapterId ? "bg-brand-soft" : "hover:bg-hover"
                  }`}
                >
                  <span className="font-medium">{chapter.title}</span>{" "}
                  <span className="text-[13px] tabular-nums text-brand">({formatTimestamp(chapter.start_ms)})</span>
                  <span className="block text-[13px] leading-relaxed text-muted">{chapter.summary}</span>
                </button>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section title="Action items">
        <ActionItems
          meetingId={meeting.id}
          items={meeting.action_items}
          onChange={(items) => onMeetingChange({ ...meeting, action_items: items })}
          onSeek={onSeek}
        />
      </Section>

      {summary && (
        <div className="mt-8 flex w-fit items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
          <span className="text-[13px]">Did you like the summary?</span>
          <span className="flex" role="radiogroup" aria-label="Rate this summary">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={summary.rating === value}
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                disabled={busy}
                onClick={() => rate(value)}
                className="p-0.5 text-brand"
              >
                <Star size={17} fill={summary.rating !== null && value <= summary.rating ? "currentColor" : "none"} />
              </button>
            ))}
          </span>
        </div>
      )}
    </article>
  );
}
