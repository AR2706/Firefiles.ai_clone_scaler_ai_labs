"use client";

import { CalendarX2, Plus, ServerCrash } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MeetingFilters } from "@/components/meetings/MeetingFilters";
import { useCapture } from "@/components/layout/AppShell";
import { MeetingRow } from "@/components/meetings/MeetingRow";
import { Button } from "@/components/ui/Button";
import { EmptyState, Spinner } from "@/components/ui/States";
import { api } from "@/lib/api";
import { dayBoundary, dayLabel } from "@/lib/format";
import type { MeetingFilters as Filters, MeetingListItem, MeetingPage, Participant, Tag } from "@/lib/types";
import { useDebounce } from "@/lib/useDebounce";

const PAGE_SIZE = 20;
const DEFAULT_FILTERS: Filters = { sort: "recent", page: 1 };

/** Group a sorted list into [day label, meetings] pairs, keeping the order. */
function groupByDay(meetings: MeetingListItem[]): [string, MeetingListItem[]][] {
  const groups: [string, MeetingListItem[]][] = [];
  for (const meeting of meetings) {
    const label = dayLabel(meeting.started_at);
    const last = groups[groups.length - 1];
    if (last && last[0] === label) last[1].push(meeting);
    else groups.push([label, [meeting]]);
  }
  return groups;
}

export default function MeetingsLibraryPage() {
  const openCapture = useCapture();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState<MeetingPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Wait until typing pauses before asking the server.
  const debouncedQuery = useDebounce(filters.q ?? "");

  const load = useCallback(() => {
    api
      .listMeetings({
        ...filters,
        q: debouncedQuery,
        date_from: dayBoundary(filters.date_from, "start"),
        date_to: dayBoundary(filters.date_to, "end"),
        page_size: PAGE_SIZE,
      })
      .then((result) => {
        setPage(result);
        setError(null);
      })
      .catch((reason: Error) => setError(reason.message));
    // `filters.q` is left out on purpose: the debounced copy drives reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filters.participant, filters.tag, filters.date_from, filters.date_to, filters.sort, filters.page]);

  useEffect(load, [load]);

  useEffect(() => {
    api.participants().then(setParticipants).catch(() => {});
    api.tags().then(setTags).catch(() => {});
  }, []);

  // Changing any filter returns to the first page.
  const changeFilters = (changes: Partial<Filters>) =>
    setFilters((current) => ({ ...current, ...changes, page: changes.page ?? 1 }));

  const groups = useMemo(() => groupByDay(page?.items ?? []), [page]);
  const sortedByDate = (filters.sort ?? "recent") === "recent" || filters.sort === "oldest";
  const currentPage = filters.page ?? 1;
  const pageCount = page ? Math.max(1, Math.ceil(page.total / PAGE_SIZE)) : 1;
  const isFiltered = Boolean(
    debouncedQuery || filters.participant || filters.tag || filters.date_from || filters.date_to,
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">My meetings</h1>
          <p className="text-muted">
            {page ? `${page.total} ${page.total === 1 ? "meeting" : "meetings"}` : "Loading your meetings"}
          </p>
        </div>
        <Button variant="primary" onClick={() => openCapture("paste")}>
          <Plus size={16} /> New meeting
        </Button>
      </div>

      <div className="mb-4">
        <MeetingFilters
          filters={filters}
          participants={participants}
          tags={tags}
          onChange={changeFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {error ? (
          <EmptyState
            icon={ServerCrash}
            title="Could not load meetings"
            description={error}
            action={<Button onClick={load}>Try again</Button>}
          />
        ) : !page ? (
          <Spinner label="Loading meetings" />
        ) : page.items.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title={isFiltered ? "No meetings match these filters" : "No meetings yet"}
            description={
              isFiltered
                ? "Try a different search or clear the filters."
                : "Create your first meeting by pasting or uploading a transcript."
            }
            action={
              isFiltered ? (
                <Button onClick={() => setFilters(DEFAULT_FILTERS)}>Clear filters</Button>
              ) : (
                <Button variant="primary" onClick={() => openCapture("paste")}>
                  <Plus size={16} /> New meeting
                </Button>
              )
            }
          />
        ) : sortedByDate ? (
          groups.map(([label, meetings]) => (
            <section key={label}>
              <h2 className="border-b border-line bg-bg px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                {label}
              </h2>
              <div className="divide-y divide-line border-b border-line last:border-b-0">
                {meetings.map((meeting) => (
                  <MeetingRow key={meeting.id} meeting={meeting} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="divide-y divide-line">
            {page.items.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>

      {page && pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-muted">
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button size="sm" disabled={currentPage <= 1} onClick={() => changeFilters({ page: currentPage - 1 })}>
              Previous
            </Button>
            <Button size="sm" disabled={currentPage >= pageCount} onClick={() => changeFilters({ page: currentPage + 1 })}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
