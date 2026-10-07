"use client";

import { CalendarClock, ChevronRight, Link2, ListChecks, Newspaper, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { useCapture } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { colorFor, dayLabel, formatDuration, formatTime } from "@/lib/format";
import type { MeetingListItem, User } from "@/lib/types";

type Tab = "recent" | "upcoming";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface CardProps {
  href: string;
  icon: LucideIcon;
  tint: string;
  title: string;
  detail: string;
}

function AssistantCard({ href, icon: Icon, tint, title, detail }: CardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: tint }}>
        <Icon size={18} />
      </span>
      <div className="mt-3 flex items-center gap-1 font-semibold">
        {title}
        <ChevronRight size={14} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="text-[13px] text-muted">{detail}</div>
    </Link>
  );
}

function RecentMeeting({ meeting }: { meeting: MeetingListItem }) {
  return (
    <Link href={`/meetings/${meeting.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-hover">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold text-white"
        style={{ background: colorFor(meeting.title) }}
      >
        {meeting.title[0]?.toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{meeting.title}</span>
        <span className="block text-xs text-muted">
          {dayLabel(meeting.started_at)} · {formatTime(meeting.started_at)} · {formatDuration(meeting.duration_seconds)}
        </span>
      </span>
      <span className="hidden text-xs text-muted sm:block">
        {meeting.participants.length} {meeting.participants.length === 1 ? "person" : "people"}
      </span>
    </Link>
  );
}

export default function HomePage() {
  const toast = useToast();
  const openCapture = useCapture();
  const [user, setUser] = useState<User | null>(null);
  const [meetings, setMeetings] = useState<MeetingListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [openTasks, setOpenTasks] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("recent");
  const [liveUrl, setLiveUrl] = useState("");

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
    api
      .listMeetings({ sort: "recent", page_size: 8 })
      .then((page) => {
        setMeetings(page.items);
        setTotal(page.total);
      })
      .catch((error: Error) => {
        setMeetings([]);
        toast.error(error.message);
      });
    api.listTasks(false).then((tasks) => setOpenTasks(tasks.length)).catch(() => setOpenTasks(0));
  }, [toast]);

  const latest = meetings?.[0];

  const onLiveSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Joining live calls is not built yet, so say so instead of pretending.
    toast.error("Joining live meetings is coming soon. Paste or upload a transcript for now.");
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}
          {user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>

        <div className="mb-2 mt-6 flex items-center gap-1.5 text-[13px] font-medium text-muted">
          <Sparkles size={14} /> Personal assistant
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <AssistantCard
            href={latest ? `/meetings/${latest.id}` : "/meetings"}
            icon={Newspaper}
            tint="#7c3aed"
            title="Daily digest"
            detail={latest ? `Latest: ${latest.title}` : "No meetings yet"}
          />
          <AssistantCard
            href="/live"
            icon={CalendarClock}
            tint="#0891b2"
            title="Meeting prep"
            detail="No upcoming meetings"
          />
          <AssistantCard
            href="/tasks"
            icon={ListChecks}
            tint="#059669"
            title="Tasks"
            detail={openTasks === null ? "Loading" : `${openTasks} open ${openTasks === 1 ? "task" : "tasks"}`}
          />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex rounded-lg bg-hover p-0.5" role="tablist">
            {(["recent", "upcoming"] as Tab[]).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={tab === option}
                onClick={() => setTab(option)}
                className={`rounded-md px-3 py-1 text-[13px] font-medium capitalize ${
                  tab === option ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <Link href="/meetings" className="text-[13px] font-medium text-brand hover:underline">
            View all {total > 0 ? `(${total})` : ""}
          </Link>
        </div>

        <div className="mt-3 rounded-2xl border border-line bg-surface p-2">
          {tab === "upcoming" ? (
            <p className="px-3 py-8 text-center text-muted">
              No upcoming meetings. Calendar sync is coming soon.
            </p>
          ) : meetings === null ? (
            <Spinner label="Loading meetings" />
          ) : meetings.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-muted">No meetings yet.</p>
              <Button variant="primary" className="mt-3" onClick={() => openCapture("paste")}>
                Add your first meeting
              </Button>
            </div>
          ) : (
            meetings.map((meeting) => <RecentMeeting key={meeting.id} meeting={meeting} />)
          )}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Capture with notetaker</h2>
        <p className="mt-0.5 text-[13px] text-muted">A notetaker joins your call and records audio and speaker names.</p>
        <form onSubmit={onLiveSubmit} className="relative mt-3">
          <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={liveUrl}
            onChange={(event) => setLiveUrl(event.target.value)}
            placeholder="Paste live meeting URL"
            aria-label="Live meeting URL"
            className="h-9 w-full rounded-lg border border-line bg-bg pl-9 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-brand"
          />
        </form>
        <p className="mt-1.5 text-xs text-muted">Coming soon. Today you can add a meeting from a transcript:</p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={() => openCapture("paste")}>Paste transcript</Button>
          <Button size="sm" onClick={() => openCapture("upload")}>Upload file</Button>
        </div>

        <h2 className="mt-6 border-t border-line pt-4 font-semibold">Upcoming</h2>
        <p className="mt-1 text-[13px] text-muted">No upcoming meetings</p>
      </aside>
    </div>
  );
}
