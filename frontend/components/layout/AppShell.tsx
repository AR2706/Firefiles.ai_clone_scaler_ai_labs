"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useState, type ReactNode } from "react";

import { MeetingFormModal, type Mode } from "@/components/meetings/MeetingFormModal";

import { isActive, NAV_GROUPS } from "./nav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Lets any page open the "new meeting" dialog without owning it. */
const CaptureContext = createContext<(mode?: Mode) => void>(() => {});
export const useCapture = () => useContext(CaptureContext);

/** On phones the sidebar is hidden, so the same links sit in a bar at the bottom. */
function MobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex shrink-0 justify-around border-t border-line bg-surface px-1 py-1 md:hidden">
      {NAV_GROUPS.flat()
        .filter((item) => !item.soon)
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={`rounded-lg p-2.5 ${isActive(pathname, item.href) ? "bg-brand-soft text-brand" : "text-muted"}`}
          >
            <item.icon size={18} />
          </Link>
        ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [captureMode, setCaptureMode] = useState<Mode | null>(null);
  const openCapture = useCallback((mode: Mode = "paste") => setCaptureMode(mode), []);

  return (
    <CaptureContext.Provider value={openCapture}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar reads the URL's search params, which needs a Suspense boundary. */}
          <Suspense fallback={<div className="h-14 border-b border-line bg-surface" />}>
            <Topbar />
          </Suspense>
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          <MobileNav />
        </div>
      </div>
      {captureMode && (
        <MeetingFormModal
          initialMode={captureMode}
          onClose={() => setCaptureMode(null)}
          onSaved={(meeting) => {
            setCaptureMode(null);
            router.push(`/meetings/${meeting.id}`);
          }}
        />
      )}
    </CaptureContext.Provider>
  );
}
