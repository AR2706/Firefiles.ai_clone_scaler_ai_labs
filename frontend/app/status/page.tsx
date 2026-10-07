"use client";

import { Activity, CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";

import { Card, Page } from "@/components/ui/Page";
import { EmptyState, Spinner } from "@/components/ui/States";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import { useMeetings } from "@/lib/useMeetings";

const SOURCE_LABELS: Record<string, string> = {
  seed: "Sample",
  upload: "File upload",
  paste: "Pasted transcript",
  form: "Details only",
};

function Badge({ ok, children }: { ok: boolean; children: string }) {
  const Icon = ok ? CheckCircle2 : CircleDashed;
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}`}>
      <Icon size={14} /> {children}
    </span>
  );
}

export default function MeetingStatusPage() {
  const { meetings, error } = useMeetings();

  return (
    <Page title="Meeting status" subtitle="Where each meeting came from and what has been processed.">
      <Card className="overflow-x-auto">
        {error ? (
          <EmptyState icon={Activity} title="Could not load meetings" description={error} />
        ) : meetings === null ? (
          <Spinner label="Loading status" />
        ) : meetings.length === 0 ? (
          <EmptyState icon={Activity} title="No meetings yet" description="Meetings appear here once you add them." />
        ) : (
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Meeting</th>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Source</th>
                <th className="px-4 py-2.5 font-semibold">Transcript</th>
                <th className="px-4 py-2.5 font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {meetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-hover">
                  <td className="px-4 py-2.5">
                    <Link href={`/meetings/${meeting.id}`} className="font-medium hover:text-brand">
                      {meeting.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                    {formatDate(meeting.started_at)}, {formatTime(meeting.started_at)}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{SOURCE_LABELS[meeting.source] ?? meeting.source}</td>
                  <td className="px-4 py-2.5">
                    <Badge ok={meeting.duration_seconds > 0}>
                      {meeting.duration_seconds > 0 ? `Processed, ${formatDuration(meeting.duration_seconds)}` : "No transcript"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge ok={Boolean(meeting.overview)}>{meeting.overview ? "Ready" : "Not generated"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Page>
  );
}
