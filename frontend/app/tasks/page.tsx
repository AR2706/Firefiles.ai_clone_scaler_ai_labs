"use client";

import { ListChecks } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Card, Page } from "@/components/ui/Page";
import { EmptyState, Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";

type Show = "open" | "done" | "all";
const OPTIONS: { id: Show; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
];

export default function TasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [show, setShow] = useState<Show>("open");

  useEffect(() => {
    api.listTasks().then(setTasks).catch((error: Error) => {
      setTasks([]);
      toast.error(error.message);
    });
  }, [toast]);

  const toggle = async (task: Task) => {
    const setDone = (isDone: boolean) =>
      setTasks((current) => current?.map((t) => (t.id === task.id ? { ...t, is_done: isDone } : t)) ?? null);
    setDone(!task.is_done); // Update at once; undo below if the server refuses.
    try {
      await api.updateActionItem(task.id, { is_done: !task.is_done });
    } catch (error) {
      setDone(task.is_done);
      toast.error((error as Error).message);
    }
  };

  // Group the visible tasks under the meeting they came from.
  const groups = useMemo(() => {
    const visible = (tasks ?? []).filter(
      (task) => show === "all" || (show === "done") === task.is_done,
    );
    const byMeeting = new Map<number, { title: string; tasks: Task[] }>();
    for (const task of visible) {
      const group = byMeeting.get(task.meeting_id) ?? { title: task.meeting_title, tasks: [] };
      group.tasks.push(task);
      byMeeting.set(task.meeting_id, group);
    }
    return [...byMeeting.entries()];
  }, [tasks, show]);

  const openCount = tasks?.filter((task) => !task.is_done).length ?? 0;

  return (
    <Page
      title="Tasks"
      subtitle={tasks ? `${openCount} open across all meetings` : "Loading tasks"}
      width="max-w-3xl"
      action={
        <div className="flex rounded-lg bg-hover p-0.5" role="tablist">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={show === option.id}
              onClick={() => setShow(option.id)}
              className={`rounded-md px-3 py-1 text-[13px] font-medium ${
                show === option.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      {tasks === null ? (
        <Spinner label="Loading tasks" />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListChecks}
            title={show === "open" ? "Nothing left to do" : "No tasks here"}
            description="Action items from your meetings appear on this page."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(([meetingId, group]) => (
            <Card key={meetingId}>
              <Link
                href={`/meetings/${meetingId}`}
                className="block border-b border-line px-4 py-2.5 text-[13px] font-semibold hover:text-brand"
              >
                {group.title}
              </Link>
              <ul className="divide-y divide-line">
                {group.tasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={task.is_done}
                      onChange={() => toggle(task)}
                      aria-label={`Mark "${task.text}" as ${task.is_done ? "not done" : "done"}`}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--brand)]"
                    />
                    <span className={`flex-1 ${task.is_done ? "text-muted line-through" : ""}`}>{task.text}</span>
                    {task.assignee && (
                      <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                        {task.assignee}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
