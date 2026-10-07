"use client";

import { ChevronRight, Download, Link2, MoreHorizontal, Pencil, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Dropdown, MenuItem } from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { MeetingDetail } from "@/lib/types";

const EXPORTS = [
  { content: "summary", format: "md", label: "Summary as Markdown" },
  { content: "summary", format: "txt", label: "Summary as text" },
  { content: "transcript", format: "md", label: "Transcript as Markdown" },
  { content: "transcript", format: "txt", label: "Transcript as text" },
] as const;

interface Props {
  meeting: MeetingDetail;
  canRegenerate: boolean;
  onEdit: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}

export function MeetingHeader({ meeting, canRegenerate, onEdit, onRegenerate, onDelete }: Props) {
  const toast = useToast();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      toast.success("Link copied");
    } catch {
      toast.error("Copying is blocked in this browser.");
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-4">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
        <Link href="/meetings" className="shrink-0 text-muted hover:text-ink">
          My meetings
        </Link>
        <ChevronRight size={14} className="shrink-0 text-muted" />
        <span className="truncate font-medium">{meeting.title}</span>
      </nav>

      <Dropdown
        align="left"
        trigger={(toggle, open) => (
          <button
            type="button"
            onClick={toggle}
            aria-label="Meeting actions"
            aria-haspopup="menu"
            aria-expanded={open}
            className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-ink"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      >
        {(close) => (
          <>
            <MenuItem onClick={() => { close(); onEdit(); }}>
              <Pencil size={14} /> Edit details
            </MenuItem>
            {canRegenerate && (
              <MenuItem onClick={() => { close(); onRegenerate(); }}>
                <RefreshCw size={14} /> Regenerate summary
              </MenuItem>
            )}
            <div className="my-1 border-t border-line" />
            <MenuItem danger onClick={() => { close(); onDelete(); }}>
              <Trash2 size={14} /> Delete meeting
            </MenuItem>
          </>
        )}
      </Dropdown>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Dropdown
          trigger={(toggle, open) => (
            <Button size="sm" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
              <Download size={14} /> <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        >
          {(close) =>
            EXPORTS.map((option) => (
              // A plain link: the API answers with a file download.
              <a
                key={option.label}
                role="menuitem"
                href={api.exportUrl(meeting.id, option.content, option.format)}
                onClick={close}
                className="block rounded-lg px-2.5 py-2 text-[13px] hover:bg-hover"
              >
                {option.label}
              </a>
            ))
          }
        </Dropdown>
        <Button size="sm" variant="primary" onClick={copyLink}>
          <Link2 size={14} /> <span className="hidden sm:inline">Copy link</span>
        </Button>
      </div>
    </header>
  );
}
