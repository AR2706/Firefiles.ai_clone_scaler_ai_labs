"use client";

import { CheckSquare, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AvatarStack } from "@/components/ui/Avatar";
import { formatDuration, formatTime } from "@/lib/format";
import type { MeetingListItem } from "@/lib/types";
import { api } from "@/lib/api";

export function TagChip({ name }: { name: string }) {
  return (
    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
      {name}
    </span>
  );
}

export function MeetingRow({ meeting }: { meeting: MeetingListItem }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const names = meeting.participants.map((participant) => participant.name);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to delete "${meeting.title}"?`)) return;
    
    setIsDeleting(true);
    try {
      await api.deleteMeeting(meeting.id);
      window.location.reload();
    } catch (err) {
      alert("Failed to delete meeting");
      setIsDeleting(false);
    }
  };

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className={`group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-hover ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
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
      <button 
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-red-500 transition-opacity ml-2 rounded hover:bg-red-50 dark:hover:bg-red-950"
        title="Delete meeting"
      >
        <Trash2 size={16} />
      </button>
    </Link>
  );
}
