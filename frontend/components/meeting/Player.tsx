"use client";

import { Download, Pause, Play, RotateCcw, RotateCw } from "lucide-react";

import { colorFor, formatTimestamp } from "@/lib/format";
import type { Chapter, Segment } from "@/lib/types";
import type { Playback } from "@/lib/usePlayback";

const SPEEDS = [1, 1.25, 1.5, 2];
const SKIP_MS = 15_000;

interface Props {
  playback: Playback;
  durationMs: number;
  segments: Segment[];
  chapters: Chapter[];
  /** Link that downloads the transcript. */
  downloadUrl: string;
}

export function Player({ playback, durationMs, segments, chapters, downloadUrl }: Props) {
  const { currentMs, playing, speed, setSpeed, seek, toggle } = playback;
  const percent = (ms: number) => (durationMs > 0 ? (ms / durationMs) * 100 : 0);
  const disabled = durationMs === 0;

  return (
    <div className="shrink-0 border-t border-line bg-surface px-4 py-2.5">
      {/* Who spoke when: one coloured block per transcript line. */}
      <div className="relative mb-1 h-2 overflow-hidden rounded-full bg-hover" aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment.id}
            className="absolute inset-y-0 opacity-70"
            style={{
              left: `${percent(segment.start_ms)}%`,
              width: `${Math.max(0.3, percent(segment.end_ms - segment.start_ms) - 0.15)}%`,
              background: colorFor(segment.speaker_name),
            }}
          />
        ))}
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={Math.max(1, durationMs)}
          step={250}
          value={currentMs}
          disabled={disabled}
          onChange={(event) => seek(Number(event.target.value))}
          aria-label="Seek"
          aria-valuetext={formatTimestamp(currentMs)}
          className="block h-4 w-full cursor-pointer accent-[var(--brand)]"
        />
        {/* Small ticks mark where each chapter starts. */}
        {chapters.map((chapter) => (
          <span
            key={chapter.id}
            title={chapter.title}
            className="pointer-events-none absolute top-[5px] h-1.5 w-0.5 rounded bg-ink/40"
            style={{ left: `${percent(chapter.start_ms)}%` }}
          />
        ))}
      </div>

      <div className="mt-1 flex items-center gap-3">
        <span className="w-24 text-xs tabular-nums text-muted">
          {formatTimestamp(currentMs)} / {formatTimestamp(durationMs)}
        </span>

        <div className="flex flex-1 items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => seek(currentMs - SKIP_MS)}
            disabled={disabled}
            aria-label="Back 15 seconds"
            className="rounded-full p-2 text-muted hover:bg-hover hover:text-ink disabled:opacity-40"
          >
            <RotateCcw size={17} />
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-strong disabled:opacity-40 dark:text-[#16131f]"
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={() => seek(currentMs + SKIP_MS)}
            disabled={disabled}
            aria-label="Forward 15 seconds"
            className="rounded-full p-2 text-muted hover:bg-hover hover:text-ink disabled:opacity-40"
          >
            <RotateCw size={17} />
          </button>
        </div>

        <div className="flex w-24 items-center justify-end gap-1">
          <select
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            aria-label="Playback speed"
            className="h-7 rounded-md border border-line bg-surface px-1 text-xs"
          >
            {SPEEDS.map((value) => (
              <option key={value} value={value}>
                {value}x
              </option>
            ))}
          </select>
          <a
            href={downloadUrl}
            aria-label="Download transcript"
            title="Download transcript"
            className="rounded-full p-2 text-muted hover:bg-hover hover:text-ink"
          >
            <Download size={16} />
          </a>
        </div>
      </div>
      <p className="mt-0.5 text-center text-[11px] text-muted">
        {disabled ? "No transcript to play." : "Sample playback: this meeting has no audio file, so the player follows the transcript timings."}
      </p>
    </div>
  );
}
