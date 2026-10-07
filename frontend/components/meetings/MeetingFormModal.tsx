"use client";

import { FileUp } from "lucide-react";
import { useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Field, TextInput, inputClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { splitNames } from "@/lib/format";
import type { MeetingDetail } from "@/lib/types";

export type Mode = "paste" | "upload" | "form";

const MODES: { id: Mode; label: string }[] = [
  { id: "paste", label: "Paste transcript" },
  { id: "upload", label: "Upload file" },
  { id: "form", label: "Details only" },
];

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED = [".txt", ".vtt", ".json"];
const PLACEHOLDER = `Asha: Thanks for joining. Let's review the launch plan.
Ben: The build is ready. I'll send the release notes by Friday.

Timestamps are optional: [00:01:30] Asha: ...`;

interface Props {
  /** Pass a meeting to edit its details; leave out to create a new one. */
  meeting?: MeetingDetail;
  /** Which tab a new meeting starts on. */
  initialMode?: Mode;
  onClose: () => void;
  onSaved: (meeting: MeetingDetail) => void;
}

export function MeetingFormModal({ meeting, initialMode = "paste", onClose, onSaved }: Props) {
  const toast = useToast();
  const editing = Boolean(meeting);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [participants, setParticipants] = useState(
    meeting?.participants.map((p) => p.name).join(", ") ?? "",
  );
  const [tags, setTags] = useState(meeting?.tags.map((t) => t.name).join(", ") ?? "");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    if (!chosen) return setFile(null);
    // Check on the client first so people find out before uploading.
    if (!ACCEPTED.some((extension) => chosen.name.toLowerCase().endsWith(extension))) {
      toast.error("Please choose a .txt, .vtt or .json file.");
      event.target.value = "";
      return;
    }
    if (chosen.size > MAX_FILE_BYTES) {
      toast.error("Transcript files are limited to 2 MB.");
      event.target.value = "";
      return;
    }
    setFile(chosen);
    if (!title.trim()) setTitle(chosen.name.replace(/\.[^.]+$/, ""));
  };

  const validationError = (): string | null => {
    if (!title.trim()) return "Give the meeting a title.";
    if (editing) return null;
    if (mode === "paste" && !transcript.trim()) return "Paste a transcript first.";
    if (mode === "upload" && !file) return "Choose a transcript file first.";
    return null;
  };

  const save = async (): Promise<MeetingDetail> => {
    const details = {
      title: title.trim(),
      participants: splitNames(participants),
      tags: splitNames(tags),
    };
    if (meeting) return api.updateMeeting(meeting.id, details);
    if (mode === "upload" && file) {
      const form = new FormData();
      form.append("file", file);
      form.append("title", details.title);
      form.append("participants", details.participants.join(","));
      form.append("tags", details.tags.join(","));
      return api.uploadMeeting(form);
    }
    return api.createMeeting({ ...details, transcript: mode === "paste" ? transcript : undefined });
  };

  const onSubmit = async () => {
    const problem = validationError();
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      const saved = await save();
      toast.success(editing ? "Meeting updated" : "Meeting created");
      onSaved(saved);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? "Edit meeting" : "New meeting"}
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSubmit} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create meeting"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!editing && (
          <div className="flex rounded-lg bg-bg p-1" role="tablist">
            {MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={mode === option.id}
                onClick={() => setMode(option.id)}
                className={`flex-1 rounded-md py-1.5 text-[13px] font-medium ${
                  mode === option.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <Field label="Title">
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Weekly product sync"
            autoFocus
          />
        </Field>

        {!editing && mode === "paste" && (
          <Field label="Transcript" hint="One line per speaker turn, as “Name: what they said”. Notes are generated for you.">
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder={PLACEHOLDER}
              rows={8}
              className={`${inputClass} resize-y font-mono text-[13px]`}
            />
          </Field>
        )}

        {!editing && mode === "upload" && (
          <Field label="Transcript file" hint="Accepts .txt, .vtt or .json up to 2 MB.">
            <span className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line bg-bg px-4 py-5 hover:border-brand">
              <FileUp size={20} className="text-brand" />
              <span className="min-w-0 flex-1 truncate">
                {file ? file.name : "Choose a file from your computer"}
              </span>
              <input type="file" accept={ACCEPTED.join(",")} onChange={onFileChange} className="sr-only" />
            </span>
          </Field>
        )}

        <Field
          label="Participants"
          hint={editing ? "Separate names with commas." : "Separate names with commas. Speakers in the transcript are added automatically."}
        >
          <TextInput
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
            placeholder="Asha Rao, Ben Carter"
          />
        </Field>

        <Field label="Tags" hint="Separate tags with commas.">
          <TextInput
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Product, Planning"
          />
        </Field>
      </div>
    </Modal>
  );
}
