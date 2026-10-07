"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { ActionItem } from "@/lib/types";

const fieldClass =
  "h-8 rounded-lg border border-line bg-surface px-2.5 text-[13px] outline-none placeholder:text-muted focus:border-brand";

interface Props {
  meetingId: number;
  items: ActionItem[];
  onChange: (items: ActionItem[]) => void;
  onSeek: (ms: number) => void;
}

export function ActionItems({ meetingId, items, onChange, onSeek }: Props) {
  const toast = useToast();
  const [newText, setNewText] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editAssignee, setEditAssignee] = useState("");

  const replace = (updated: ActionItem) =>
    onChange(items.map((item) => (item.id === updated.id ? updated : item)));

  const toggleDone = async (item: ActionItem) => {
    // Update the screen first so the checkbox feels instant, then confirm with
    // the server and put the old value back if the request fails.
    replace({ ...item, is_done: !item.is_done });
    try {
      replace(await api.updateActionItem(item.id, { is_done: !item.is_done }));
    } catch (error) {
      replace(item);
      toast.error((error as Error).message);
    }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (!newText.trim()) return;
    try {
      const created = await api.addActionItem(meetingId, {
        text: newText.trim(),
        assignee: newAssignee.trim() || null,
      });
      onChange([...items, created]);
      setNewText("");
      setNewAssignee("");
      toast.success("Action item added");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const startEditing = (item: ActionItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditAssignee(item.assignee ?? "");
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (editingId === null || !editText.trim()) return;
    try {
      replace(
        await api.updateActionItem(editingId, {
          text: editText.trim(),
          assignee: editAssignee.trim() || null,
        }),
      );
      setEditingId(null);
      toast.success("Action item updated");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const remove = async (item: ActionItem) => {
    try {
      await api.deleteActionItem(item.id);
      onChange(items.filter((other) => other.id !== item.id));
      toast.success("Action item deleted");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div>
      {items.length === 0 && <p className="mb-2 text-muted">No action items yet. Add the first one below.</p>}

      <ul className="space-y-1">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id}>
              <form onSubmit={saveEdit} className="flex flex-wrap items-center gap-2 rounded-lg bg-hover p-2">
                <input
                  value={editText}
                  onChange={(event) => setEditText(event.target.value)}
                  aria-label="Task"
                  autoFocus
                  className={`${fieldClass} min-w-[180px] flex-1`}
                />
                <input
                  value={editAssignee}
                  onChange={(event) => setEditAssignee(event.target.value)}
                  placeholder="Owner"
                  aria-label="Owner"
                  className={`${fieldClass} w-32`}
                />
                <button type="submit" aria-label="Save" className="rounded-md p-1.5 text-brand hover:bg-surface">
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label="Cancel"
                  className="rounded-md p-1.5 text-muted hover:bg-surface"
                >
                  <X size={16} />
                </button>
              </form>
            </li>
          ) : (
            <li key={item.id} className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-hover">
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={() => toggleDone(item)}
                aria-label={`Mark "${item.text}" as ${item.is_done ? "not done" : "done"}`}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--brand)]"
              />
              <div className="min-w-0 flex-1">
                <span className={item.is_done ? "text-muted line-through" : ""}>{item.text}</span>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  {item.assignee && (
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand">
                      {item.assignee}
                    </span>
                  )}
                  {item.source_start_ms !== null && (
                    <button
                      type="button"
                      onClick={() => onSeek(item.source_start_ms as number)}
                      title="Jump to where this was said"
                      className="tabular-nums hover:text-brand hover:underline"
                    >
                      {formatTimestamp(item.source_start_ms)}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 opacity-0 focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => startEditing(item)}
                  aria-label="Edit action item"
                  className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label="Delete action item"
                  className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ),
        )}
      </ul>

      <form onSubmit={add} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={newText}
          onChange={(event) => setNewText(event.target.value)}
          placeholder="Add an action item"
          aria-label="New action item"
          className={`${fieldClass} min-w-[180px] flex-1`}
        />
        <input
          value={newAssignee}
          onChange={(event) => setNewAssignee(event.target.value)}
          placeholder="Owner (optional)"
          aria-label="Owner"
          className={`${fieldClass} w-36`}
        />
        <button
          type="submit"
          disabled={!newText.trim()}
          className="flex h-8 items-center gap-1 rounded-lg bg-brand px-3 text-[13px] font-medium text-white disabled:opacity-50 dark:text-[#16131f]"
        >
          <Plus size={14} /> Add
        </button>
      </form>
    </div>
  );
}
