"use client";

import { AudioLines, Bell, ChevronDown, ClipboardPaste, Moon, Radio, Search, Settings, Sun, Upload, Video } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, MenuItem } from "@/components/ui/Dropdown";
import { useTheme } from "@/components/ui/Theme";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

import { useCapture } from "./AppShell";
import { pageTitle } from "./nav";

const iconButton = "rounded-lg p-2 text-muted hover:bg-hover hover:text-ink";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openCapture = useCapture();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (text) router.push(`/search?q=${encodeURIComponent(text)}`);
  };

  const name = user?.name ?? "Account";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
      <Link
        href="/"
        aria-label="Fireflies.ai_clone home"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-white md:hidden dark:text-[#16131f]"
      >
        <AudioLines size={16} />
      </Link>
      <span className="hidden w-36 shrink-0 truncate text-[13px] font-medium text-muted lg:block">
        {pageTitle(pathname)}
      </span>

      <form onSubmit={onSubmit} className="relative mx-auto w-full max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or keyword"
          aria-label="Search across all meetings"
          className="h-8 w-full rounded-lg border border-line bg-bg pl-9 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-brand"
        />
      </form>

      <div className="flex shrink-0 items-center gap-1.5">
        <Dropdown
          trigger={(toggleMenu, open) => (
            <button
              type="button"
              onClick={toggleMenu}
              aria-haspopup="menu"
              aria-expanded={open}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-[13px] font-medium text-white hover:bg-brand-strong dark:text-[#16131f]"
            >
              <Video size={15} />
              <span className="hidden sm:inline">Capture</span>
              <ChevronDown size={14} />
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuItem onClick={() => { close(); openCapture("paste"); }}>
                <ClipboardPaste size={15} /> Paste a transcript
              </MenuItem>
              <MenuItem onClick={() => { close(); openCapture("upload"); }}>
                <Upload size={15} /> Upload a transcript file
              </MenuItem>
              <MenuItem onClick={() => { close(); router.push("/live"); }}>
                <Radio size={15} /> Add to a live meeting
                <span className="ml-auto rounded bg-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">Soon</span>
              </MenuItem>
            </>
          )}
        </Dropdown>

        <Dropdown
          width="w-64"
          trigger={(toggleMenu) => (
            <button type="button" onClick={toggleMenu} aria-label="Notifications" className={iconButton}>
              <Bell size={16} />
            </button>
          )}
        >
          {() => (
            <div className="px-3 py-4 text-center">
              <p className="font-medium">You&apos;re all caught up</p>
              <p className="mt-0.5 text-xs text-muted">Notifications appear here when notes are ready.</p>
            </div>
          )}
        </Dropdown>

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className={iconButton}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <Dropdown
          trigger={(toggleMenu) => (
            <button type="button" onClick={toggleMenu} aria-label="Account menu" className="ml-1 flex rounded-full">
              <Avatar name={name} size={30} />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="border-b border-line px-2.5 pb-2 pt-1.5">
                <div className="font-semibold">{name}</div>
                <div className="truncate text-xs text-muted">{user?.email}</div>
              </div>
              <div className="mt-1">
                <MenuItem onClick={() => { close(); router.push("/settings"); }}>
                  <Settings size={15} /> Settings
                </MenuItem>
              </div>
              <div className="px-2.5 py-2 text-xs text-muted">Sign-in and accounts are coming soon.</div>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
