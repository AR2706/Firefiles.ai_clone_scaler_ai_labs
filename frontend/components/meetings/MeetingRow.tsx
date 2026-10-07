import { CheckSquare, Clock } from "lucide-react";
import Link from "next/link";

import { AvatarStack } from "@/components/ui/Avatar";
import { formatDuration, formatTime } from "@/lib/format";
import type { MeetingListItem } from "@/lib/types";

export function TagChip({ name }: { name: string }) {
  return (
    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
      {name}
    </span>
  );
}

export function MeetingRow({ meeting }: { meeting: MeetingListItem }) {
  const names = meeting.participants.map((participant) => participant.name);
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-hover"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[15px] font-semibold">{meeting.title}</span>
          {meeting.tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} />
          ))}
        </div>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">
          {meeting.overview || "No summary yet."}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>{formatTime(meeting.started_at)}</span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {formatDuration(meeting.duration_seconds)}
          </span>
          {meeting.action_items_total > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare size={13} /> {meeting.action_items_done}/{meeting.action_items_total} tasks done
            </span>
          )}
          <span className="truncate sm:hidden">{names.join(", ")}</span>
        </div>
      </div>
      <div className="hidden shrink-0 sm:block">
        <AvatarStack names={names} />
      </div>
    </Link>
  );
}
