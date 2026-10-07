"use client";

import { BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Card, Page } from "@/components/ui/Page";
import { EmptyState, Spinner } from "@/components/ui/States";
import { api } from "@/lib/api";
import { colorFor, formatDuration } from "@/lib/format";
import type { Task } from "@/lib/types";
import { useMeetings } from "@/lib/useMeetings";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="p-4">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </Card>
  );
}

/** Count how often each name appears and return the most frequent first. */
function topCounts(names: string[], limit: number): [string, number][] {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function Bars({ rows, showAvatar }: { rows: [string, number][]; showAvatar?: boolean }) {
  const max = Math.max(1, ...rows.map(([, count]) => count));
  return (
    <ul className="space-y-2.5">
      {rows.map(([name, count]) => (
        <li key={name} className="flex items-center gap-3">
          {showAvatar && <Avatar name={name} size={24} />}
          <span className="w-36 shrink-0 truncate text-[13px]">{name}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-hover">
            <span className="block h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: colorFor(name) }} />
          </span>
          <span className="w-6 text-right text-[13px] tabular-nums text-muted">{count}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AnalyticsPage() {
  const { meetings, error } = useMeetings();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.listTasks().then(setTasks).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const list = meetings ?? [];
    const seconds = list.reduce((sum, meeting) => sum + meeting.duration_seconds, 0);
    const done = tasks.filter((task) => task.is_done).length;
    return {
      seconds,
      average: list.length ? Math.round(seconds / list.length) : 0,
      done,
      people: topCounts(list.flatMap((m) => m.participants.map((p) => p.name)), 6),
      tags: topCounts(list.flatMap((m) => m.tags.map((t) => t.name)), 6),
    };
  }, [meetings, tasks]);

  if (error) return <EmptyState icon={BarChart3} title="Could not load analytics" description={error} />;
  if (meetings === null) return <Spinner label="Loading analytics" />;

  return (
    <Page title="Analytics" subtitle="Totals across your meetings.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Meetings" value={String(meetings.length)} />
        <Stat label="Time recorded" value={formatDuration(stats.seconds)} note={`${formatDuration(stats.average)} on average`} />
        <Stat label="Action items" value={String(tasks.length)} note={`${tasks.length - stats.done} still open`} />
        <Stat
          label="Tasks completed"
          value={tasks.length ? `${Math.round((stats.done / tasks.length) * 100)}%` : "0%"}
          note={`${stats.done} of ${tasks.length}`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Meetings by participant</h2>
          {stats.people.length ? <Bars rows={stats.people} showAvatar /> : <p className="text-muted">No participants yet.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Meetings by tag</h2>
          {stats.tags.length ? <Bars rows={stats.tags} /> : <p className="text-muted">No tags yet.</p>}
        </Card>
      </div>
      <p className="mt-4 text-xs text-muted">Sentiment and topic trends are coming soon.</p>
    </Page>
  );
}
