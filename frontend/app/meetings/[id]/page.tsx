"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AskPanel } from "@/components/meeting/AskPanel";
import { CommentsPanel } from "@/components/meeting/CommentsPanel";
import { MeetingHeader } from "@/components/meeting/MeetingHeader";
import { NotesPanel } from "@/components/meeting/NotesPanel";
import { Player } from "@/components/meeting/Player";
import { SmartSearchPanel, type TranscriptFilter } from "@/components/meeting/SmartSearchPanel";
import { TranscriptPanel } from "@/components/meeting/TranscriptPanel";
import { MeetingFormModal } from "@/components/meetings/MeetingFormModal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { Comment, Insights, MeetingDetail, Segment } from "@/lib/types";
import { usePlayback } from "@/lib/usePlayback";

// The left pane holds the notes; the right pane holds the transcript and chat.
// On small screens there is one pane, so every view is a tab in one row.
type LeftTab = "notes" | "smart" | "comments";
type RightTab = "transcript" | "ask";
type Tab = LeftTab | RightTab;

const LEFT_TABS: { id: LeftTab; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "smart", label: "Smart search" },
  { id: "comments", label: "Comments" },
];
const RIGHT_TABS: { id: RightTab; label: string }[] = [
  { id: "transcript", label: "Transcript" },
  { id: "ask", label: "Ask" },
];

function TabButton({ active, onClick, className = "", children }: { active: boolean; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium ${className} ${
        active ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export default function MeetingDetailPage() {
  const meetingId = Number(useParams<{ id: string }>().id);
  const startAt = Number(useSearchParams().get("t") ?? 0);
  const router = useRouter();
  const toast = useToast();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("notes");
  const [rightTab, setRightTab] = useState<RightTab>("transcript");
  const [filter, setFilter] = useState<TranscriptFilter | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // The transcript's last line is the most reliable measure of length.
  const durationMs = segments.length
    ? segments[segments.length - 1].end_ms
    : (meeting?.duration_seconds ?? 0) * 1000;
  const playback = usePlayback(durationMs);
  const { seek } = playback;

  useEffect(() => {
    setMeeting(null);
    setError(null);
    setFilter(null);
    Promise.all([api.getMeeting(meetingId), api.getTranscript(meetingId)])
      .then(([loadedMeeting, loadedSegments]) => {
        setMeeting(loadedMeeting);
        setSegments(loadedSegments);
      })
      .catch((reason: Error) => setError(reason.message));
    // These two are extras: the page still works if either fails.
    api.listComments(meetingId).then(setComments).catch(() => setComments([]));
    api.getInsights(meetingId).then(setInsights).catch(() => setInsights(null));
  }, [meetingId]);

  // Search results link here with ?t=<ms> to open at a specific moment.
  useEffect(() => {
    if (startAt > 0 && durationMs > 0) seek(startAt);
  }, [startAt, durationMs, seek]);

  const speakerLineIds = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const segment of segments) {
      map.set(segment.speaker_name, [...(map.get(segment.speaker_name) ?? []), segment.id]);
    }
    return map;
  }, [segments]);

  /** Choosing a filter also brings the transcript into view. */
  const applyFilter = (next: TranscriptFilter | null) => {
    setFilter(next);
    if (next) setRightTab("transcript");
  };

  const addComment = useCallback(
    async (segmentId: number, body: string) => {
      try {
        const comment = await api.addComment(meetingId, segmentId, body);
        setComments((current) => [...current, comment]);
        toast.success("Comment added");
        return true;
      } catch (reason) {
        toast.error((reason as Error).message);
        return false;
      }
    },
    [meetingId, toast],
  );

  const deleteComment = useCallback(
    async (commentId: number) => {
      try {
        await api.deleteComment(commentId);
        setComments((current) => current.filter((comment) => comment.id !== commentId));
        toast.success("Comment deleted");
      } catch (reason) {
        toast.error((reason as Error).message);
      }
    },
    [toast],
  );

  const regenerate = async () => {
    try {
      setMeeting(await api.regenerateSummary(meetingId));
      toast.success("Summary regenerated from the transcript");
    } catch (reason) {
      toast.error((reason as Error).message);
    }
  };

  const deleteMeeting = async () => {
    setDeleting(true);
    try {
      await api.deleteMeeting(meetingId);
      toast.success("Meeting deleted");
      router.push("/meetings");
    } catch (reason) {
      toast.error((reason as Error).message);
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Meeting not available"
        description={error}
        action={
          <Link href="/meetings">
            <Button>Back to meetings</Button>
          </Link>
        }
      />
    );
  }
  if (!meeting) return <Spinner label="Loading meeting" />;

  const transcript = (
    <TranscriptPanel
      segments={segments}
      currentMs={playback.currentMs}
      playing={playback.playing}
      comments={comments}
      filter={filter}
      onClearFilter={() => setFilter(null)}
      onSeek={seek}
      onAddComment={addComment}
      onDeleteComment={deleteComment}
    />
  );
  const ask = <AskPanel meetingId={meeting.id} onSeek={seek} />;
  const isRightView = tab === "transcript" || tab === "ask";

  return (
    <div className="flex h-full flex-col">
      <MeetingHeader
        meeting={meeting}
        canRegenerate={segments.length > 0}
        onEdit={() => setEditing(true)}
        onRegenerate={regenerate}
        onDelete={() => setConfirmingDelete(true)}
      />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(380px,40%)]">
        <div className="flex min-h-0 flex-col">
          <div className="flex shrink-0 overflow-x-auto border-b border-line bg-surface px-3" role="tablist">
            {LEFT_TABS.map((option) => (
              <TabButton key={option.id} active={tab === option.id} onClick={() => setTab(option.id)}>
                {option.label}
                {option.id === "comments" && comments.length > 0 ? ` (${comments.length})` : ""}
              </TabButton>
            ))}
            {RIGHT_TABS.map((option) => (
              <TabButton key={option.id} active={tab === option.id} onClick={() => setTab(option.id)} className="lg:hidden">
                {option.label}
              </TabButton>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* If a right-pane view was chosen on a phone and the window is then
                widened, fall back to the notes here instead of an empty pane. */}
            {(tab === "notes" || isRightView) && (
              <div className={isRightView ? "hidden lg:block" : ""}>
                <NotesPanel
                  meeting={meeting}
                  currentMs={playback.currentMs}
                  hasTranscript={segments.length > 0}
                  onMeetingChange={setMeeting}
                  onSeek={seek}
                />
              </div>
            )}
            {tab === "smart" && (
              <SmartSearchPanel
                insights={insights}
                speakerLineIds={speakerLineIds}
                active={filter}
                onChange={(next) => {
                  applyFilter(next);
                }}
              />
            )}
            {tab === "comments" && (
              <CommentsPanel comments={comments} segments={segments} onSeek={seek} onDelete={deleteComment} />
            )}
            {tab === "transcript" && <div className="h-full bg-surface lg:hidden">{transcript}</div>}
            {tab === "ask" && <div className="h-full lg:hidden">{ask}</div>}
          </div>
        </div>

        <div className="hidden min-h-0 flex-col border-l border-line bg-surface lg:flex">
          <div className="flex shrink-0 border-b border-line px-3" role="tablist">
            {RIGHT_TABS.map((option) => (
              <TabButton key={option.id} active={rightTab === option.id} onClick={() => setRightTab(option.id)}>
                {option.label}
              </TabButton>
            ))}
          </div>
          <div className="min-h-0 flex-1">{rightTab === "transcript" ? transcript : ask}</div>
        </div>
      </div>

      <Player
        playback={playback}
        durationMs={durationMs}
        segments={segments}
        chapters={meeting.chapters}
        downloadUrl={api.exportUrl(meeting.id, "transcript", "txt")}
      />

      {editing && (
        <MeetingFormModal
          meeting={meeting}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            setMeeting(updated);
            setEditing(false);
          }}
        />
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this meeting?"
          message={`“${meeting.title}” and its transcript, summary, action items and comments will be removed. This cannot be undone.`}
          confirmLabel="Delete meeting"
          busy={deleting}
          onConfirm={deleteMeeting}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
