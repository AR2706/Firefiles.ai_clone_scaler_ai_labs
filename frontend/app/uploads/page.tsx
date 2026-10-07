"use client";

import { FileUp, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";

import { useCapture } from "@/components/layout/AppShell";
import { MeetingRow } from "@/components/meetings/MeetingRow";
import { Button } from "@/components/ui/Button";
import { Card, Page } from "@/components/ui/Page";
import { EmptyState, Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useMeetings } from "@/lib/useMeetings";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED = [".txt", ".vtt", ".json"];

export default function UploadsPage() {
  const router = useRouter();
  const toast = useToast();
  const openCapture = useCapture();
  const input = useRef<HTMLInputElement>(null);
  const { meetings, error } = useMeetings("upload,paste");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.some((extension) => file.name.toLowerCase().endsWith(extension))) {
      return toast.error("Please choose a .txt, .vtt or .json file.");
    }
    if (file.size > MAX_FILE_BYTES) return toast.error("Transcript files are limited to 2 MB.");

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const meeting = await api.uploadMeeting(form);
      toast.success("Transcript uploaded and notes generated");
      router.push(`/meetings/${meeting.id}`);
    } catch (reason) {
      toast.error((reason as Error).message);
      setUploading(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files[0]);
  };

  return (
    <Page
      title="Uploads"
      subtitle="Turn a transcript file into a meeting with notes."
      action={<Button onClick={() => openCapture("paste")}>Paste a transcript instead</Button>}
    >
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center ${
          dragging ? "border-brand bg-brand-soft" : "border-line bg-surface"
        }`}
      >
        <UploadCloud size={28} className="text-brand" />
        <p className="mt-2 font-semibold">{uploading ? "Uploading…" : "Drag and drop a transcript here"}</p>
        <p className="text-[13px] text-muted">.txt, .vtt or .json, up to 2 MB. Audio and video upload is coming soon.</p>
        <Button variant="primary" className="mt-4" disabled={uploading} onClick={() => input.current?.click()}>
          <FileUp size={15} /> Browse files
        </Button>
        <input
          ref={input}
          type="file"
          accept={ACCEPTED.join(",")}
          aria-label="Transcript file"
          className="sr-only"
          onChange={(event) => {
            upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wide text-muted">Your uploads</h2>
      <Card className="overflow-hidden">
        {error ? (
          <EmptyState icon={FileUp} title="Could not load uploads" description={error} />
        ) : meetings === null ? (
          <Spinner label="Loading uploads" />
        ) : meetings.length === 0 ? (
          <EmptyState icon={FileUp} title="No uploads yet" description="Meetings you create from a file or pasted transcript appear here." />
        ) : (
          <div className="divide-y divide-line">
            {meetings.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}
