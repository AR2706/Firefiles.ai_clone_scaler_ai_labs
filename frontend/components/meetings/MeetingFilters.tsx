"use client";

import { Search, X } from "lucide-react";

import type { MeetingFilters as Filters, Participant, SortOption, Tag } from "@/lib/types";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A to Z" },
  { value: "duration", label: "Longest first" },
];

const controlClass =
  "h-9 rounded-lg border border-line bg-surface px-2.5 text-[13px] outline-none focus:border-brand";

interface Props {
  filters: Filters;
  participants: Participant[];
  tags: Tag[];
  onChange: (changes: Partial<Filters>) => void;
  onClear: () => void;
}

export function MeetingFilters({ filters, participants, tags, onChange, onClear }: Props) {
  const hasFilters = Boolean(
    filters.q || filters.participant || filters.tag || filters.date_from || filters.date_to,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1 basis-full lg:basis-0">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={filters.q ?? ""}
          onChange={(event) => onChange({ q: event.target.value })}
          placeholder="Filter by title, participant or transcript"
          aria-label="Filter meetings"
          className={`${controlClass} w-full pl-9 placeholder:text-muted`}
        />
      </div>

      <select
        value={filters.participant ?? ""}
        onChange={(event) => onChange({ participant: event.target.value })}
        aria-label="Filter by participant"
        className={controlClass}
      >
        <option value="">All participants</option>
        {participants.map((participant) => (
          <option key={participant.id} value={participant.name}>
            {participant.name}
          </option>
        ))}
      </select>

      <select
        value={filters.tag ?? ""}
        onChange={(event) => onChange({ tag: event.target.value })}
        aria-label="Filter by tag"
        className={controlClass}
      >
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.name}>
            {tag.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.date_from ?? ""}
        max={filters.date_to}
        onChange={(event) => onChange({ date_from: event.target.value })}
        aria-label="From date"
        className={controlClass}
      />
      <span className="text-muted">to</span>
      <input
        type="date"
        value={filters.date_to ?? ""}
        min={filters.date_from}
        onChange={(event) => onChange({ date_to: event.target.value })}
        aria-label="To date"
        className={controlClass}
      />

      <select
        value={filters.sort ?? "recent"}
        onChange={(event) => onChange({ sort: event.target.value as SortOption })}
        aria-label="Sort meetings"
        className={controlClass}
      >
        {SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="flex h-9 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-muted hover:bg-hover hover:text-ink"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );
}
