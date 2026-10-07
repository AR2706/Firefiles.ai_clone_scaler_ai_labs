"use client";

import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { MeetingRow } from "@/components/meetings/MeetingRow";
import { EmptyState, Spinner } from "@/components/ui/States";
import { api } from "@/lib/api";
import { formatDate, formatTimestamp } from "@/lib/format";
import type { SearchResults } from "@/lib/types";

/** Render a server snippet, turning its <mark> tags into real elements.
 *  The text is split on the tags and rendered as plain text, so nothing from
 *  a transcript is ever inserted as HTML. */
function Snippet({ html }: { html: string }) {
  const parts = html.split(/<\/?mark>/);
  return <>{parts.map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : part))}</>;
}

function SearchResultsView() {
  const query = (useSearchParams().get("q") ?? "").trim();
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    setResults(null);
    setError(null);
    api.search(query).then(setResults).catch((reason: Error) => setError(reason.message));
  }, [query]);

  if (!query) {
    return (
      <EmptyState
        icon={Search}
        title="Search all your meetings"
        description="Use the search box at the top to find a title, a participant, or anything that was said."
      />
    );
  }
  if (error) return <EmptyState icon={SearchX} title="Search failed" description={error} />;
  if (!results) return <Spinner label="Searching" />;

  const nothingFound = results.meetings.length === 0 && results.transcript_hits.length === 0;
  if (nothingFound) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No results for “${query}”`}
        description="Check the spelling or try a shorter phrase."
      />
    );
  }

  return (
    <div className="space-y-6">
      {results.meetings.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Meetings ({results.meetings.length})
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {results.meetings.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))}
          </div>
        </section>
      )}

      {results.transcript_hits.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            In transcripts ({results.transcript_hits.length})
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {results.transcript_hits.map((hit) => (
              <Link
                key={hit.segment_id}
                href={`/meetings/${hit.meeting_id}?t=${hit.start_ms}`}
                className="block px-4 py-3 hover:bg-hover"
              >
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                  <span className="font-semibold text-ink">{hit.meeting_title}</span>
                  <span>{formatDate(hit.started_at)}</span>
                  <span className="text-brand">
                    {hit.speaker_name} at {formatTimestamp(hit.start_ms)}
                  </span>
                </div>
                <p className="mt-1 leading-relaxed">
                  <Snippet html={hit.snippet} />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Search</h1>
      <Suspense fallback={<Spinner label="Searching" />}>
        <SearchResultsView />
      </Suspense>
    </div>
  );
}
