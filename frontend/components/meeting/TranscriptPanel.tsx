"use client";

import { ChevronDown, ChevronUp, MessageSquare, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { colorFor, formatTimestamp } from "@/lib/format";
import type { Comment, Segment } from "@/lib/types";

import type { TranscriptFilter } from "./SmartSearchPanel";

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** How many times `query` appears in each segment, in order. */
function countMatches(segments: Segment[], query: string): number[] {
  if (!query) return segments.map(() => 0);
  const pattern = new RegExp(escapeRegExp(query), "gi");
  return segments.map((segment) => segment.text.match(pattern)?.length ?? 0);
}

/** Wrap each match in <mark>. `firstIndex` is this segment's first match number. */
function highlight(text: string, query: string, firstIndex: number, activeIndex: number): ReactNode {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  let matchNumber = firstIndex;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} data-active={matchNumber++ === activeIndex}>
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

interface Props {
  /** Every line of the meeting; `filter` narrows what is shown. */
  segments: Segment[];
  currentMs: number;
  playing: boolean;
  comments: Comment[];
  filter: TranscriptFilter | null;
  onClearFilter: () => void;
  onSeek: (ms: number) => void;
  /** Resolves to true when the comment was saved. */
  onAddComment: (segmentId: number, body: string) => Promise<boolean>;
  onDeleteComment: (commentId: number) => void;
}

export function TranscriptPanel({
  segments: allSegments,
  currentMs,
  playing,
  comments,
  filter,
  onClearFilter,
  onSeek,
  onAddComment,
  onDeleteComment,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const lineRefs = useRef(new Map<number, HTMLDivElement>());

  const segments = useMemo(
    () => (filter ? allSegments.filter((segment) => filter.ids.has(segment.id)) : allSegments),
    [allSegments, filter],
  );

  // The line being spoken is the last one that has already started.
  const activeSegmentId = useMemo(() => {
    let active: number | null = null;
    for (const segment of allSegments) {
      if (segment.start_ms <= currentMs) active = segment.id;
      else break;
    }
    return active;
  }, [allSegments, currentMs]);

  const trimmedQuery = query.trim();
  const matchCounts = useMemo(() => countMatches(segments, trimmedQuery), [segments, trimmedQuery]);
  const totalMatches = matchCounts.reduce((sum, count) => sum + count, 0);

  // firstMatchIndex[i] = number of matches before segment i.
  const firstMatchIndex = useMemo(() => {
    let running = 0;
    return matchCounts.map((count) => {
      const start = running;
      running += count;
      return start;
    });
  }, [matchCounts]);

  useEffect(() => setActiveMatch(0), [trimmedQuery]);

  const scrollToSegment = (segmentId: number, block: ScrollLogicalPosition) =>
    lineRefs.current.get(segmentId)?.scrollIntoView({ behavior: "smooth", block });

  // Follow playback and seeking, unless the user is looking at search results.
  useEffect(() => {
    if (activeSegmentId !== null && !trimmedQuery) scrollToSegment(activeSegmentId, "nearest");
  }, [activeSegmentId, trimmedQuery]);

  // Bring the selected search match into view.
  useEffect(() => {
    if (!trimmedQuery || totalMatches === 0) return;
    const index = firstMatchIndex.findIndex(
      (start, i) => activeMatch >= start && activeMatch < start + matchCounts[i],
    );
    if (index >= 0) scrollToSegment(segments[index].id, "center");
  }, [activeMatch, trimmedQuery, totalMatches, firstMatchIndex, matchCounts, segments]);

  const stepMatch = (direction: 1 | -1) =>
    setActiveMatch((current) => (current + direction + totalMatches) % totalMatches);

  const submitComment = async (event: FormEvent, segmentId: number) => {
    event.preventDefault();
    if (!draft.trim()) return;
    if (await onAddComment(segmentId, draft.trim())) {
      setDraft("");
      setCommentingOn(null);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Transcript">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-2.5">
        <div className="relative mr-auto w-full max-w-[280px]">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && totalMatches > 0) stepMatch(event.shiftKey ? -1 : 1);
            }}
            placeholder="Search transcript"
            aria-label="Search transcript"
            className="h-8 w-full rounded-lg border border-line bg-bg pl-8 pr-7 text-[13px] outline-none placeholder:text-muted focus:border-brand"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {trimmedQuery && (
          <div className="flex shrink-0 items-center gap-0.5 text-xs text-muted">
            <span className="tabular-nums">
              {totalMatches === 0 ? "0 results" : `${activeMatch + 1} of ${totalMatches}`}
            </span>
            <button
              type="button"
              onClick={() => stepMatch(-1)}
              disabled={totalMatches === 0}
              aria-label="Previous match"
              className="rounded p-1 hover:bg-hover disabled:opacity-40"
            >
              <ChevronUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => stepMatch(1)}
              disabled={totalMatches === 0}
              aria-label="Next match"
              className="rounded p-1 hover:bg-hover disabled:opacity-40"
            >
              <ChevronDown size={15} />
            </button>
          </div>
        )}
      </div>

      {filter && (
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-brand-soft px-4 py-1.5 text-[13px]">
          <span className="flex-1 text-brand">
            Showing {segments.length} of {allSegments.length} lines: <span className="font-semibold">{filter.label}</span>
          </span>
          <button type="button" onClick={onClearFilter} className="font-medium text-brand hover:underline">
            Show all
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {allSegments.length === 0 && (
          <p className="px-3 py-10 text-center text-muted">This meeting has no transcript.</p>
        )}
        {segments.map((segment, index) => {
          const isActive = segment.id === activeSegmentId;
          const lineComments = comments.filter((comment) => comment.segment_id === segment.id);
          return (
            <div
              key={segment.id}
              ref={(element) => {
                if (element) lineRefs.current.set(segment.id, element);
                else lineRefs.current.delete(segment.id);
              }}
              className={`group rounded-xl px-2.5 py-2 ${isActive ? "bg-brand-soft" : "hover:bg-hover"}`}
            >
              <div className="flex gap-2.5">
                <Avatar name={segment.speaker_name} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: colorFor(segment.speaker_name) }}>
                      {segment.speaker_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSeek(segment.start_ms)}
                      title="Jump to this moment"
                      className="rounded text-xs tabular-nums text-muted hover:text-brand hover:underline"
                    >
                      {formatTimestamp(segment.start_ms)}
                    </button>
                    {isActive && playing && (
                      <span className="text-[11px] font-medium text-brand">Speaking</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCommentingOn(commentingOn === segment.id ? null : segment.id);
                        setDraft("");
                      }}
                      aria-label="Comment on this line"
                      className="ml-auto rounded p-1 text-muted opacity-0 hover:bg-surface hover:text-brand focus:opacity-100 group-hover:opacity-100"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>
                  {/* Clicking the text also seeks the player to this line. */}
                  <p
                    onClick={() => onSeek(segment.start_ms)}
                    className="mt-0.5 cursor-pointer leading-relaxed"
                  >
                    {highlight(segment.text, trimmedQuery, firstMatchIndex[index], activeMatch)}
                  </p>

                  {lineComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="mt-1.5 flex items-start gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px]"
                    >
                      <MessageSquare size={13} className="mt-0.5 shrink-0 text-brand" />
                      <span className="flex-1">
                        <span className="font-medium">{comment.author.name}: </span>
                        {comment.body}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteComment(comment.id)}
                        aria-label="Delete comment"
                        className="text-muted hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {commentingOn === segment.id && (
                    <form onSubmit={(event) => submitComment(event, segment.id)} className="mt-1.5 flex gap-2">
                      <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Add a comment"
                        autoFocus
                        className="h-8 flex-1 rounded-lg border border-line bg-surface px-2.5 text-[13px] outline-none focus:border-brand"
                      />
                      <button
                        type="submit"
                        className="h-8 rounded-lg bg-brand px-3 text-[13px] font-medium text-white dark:text-[#16131f]"
                      >
                        Save
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
