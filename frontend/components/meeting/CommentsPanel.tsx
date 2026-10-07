"use client";

import { MessageSquare, Trash2 } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { formatTimestamp } from "@/lib/format";
import type { Comment, Segment } from "@/lib/types";

interface Props {
  comments: Comment[];
  segments: Segment[];
  onSeek: (ms: number) => void;
  onDelete: (commentId: number) => void;
}

/** Every comment on the meeting in one thread, each linked to its transcript line. */
export function CommentsPanel({ comments, segments, onSeek, onDelete }: Props) {
  if (comments.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <MessageSquare size={22} className="mx-auto mb-2 text-brand" />
        <p className="font-semibold">No comments yet</p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">
          Hover a line in the transcript and choose the comment icon to start a thread.
        </p>
      </div>
    );
  }

  const segmentById = new Map(segments.map((segment) => [segment.id, segment]));
  return (
    <ul className="mx-auto max-w-2xl space-y-4 px-5 py-7">
      {comments.map((comment) => {
        const segment = segmentById.get(comment.segment_id);
        return (
          <li key={comment.id} className="flex gap-3">
            <Avatar name={comment.author.name} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-semibold">{comment.author.name}</span>
                <span className="text-muted">
                  {new Date(comment.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  aria-label="Delete comment"
                  className="ml-auto rounded p-1 text-muted hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-0.5 leading-relaxed">{comment.body}</p>
              {segment && (
                <button
                  type="button"
                  onClick={() => onSeek(segment.start_ms)}
                  className="mt-1.5 block w-full rounded-lg border-l-2 border-brand bg-hover px-2.5 py-1.5 text-left text-[13px] text-muted hover:text-ink"
                >
                  <span className="font-medium text-brand">
                    {segment.speaker_name} at {formatTimestamp(segment.start_ms)}
                  </span>
                  <span className="line-clamp-2">{segment.text}</span>
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
