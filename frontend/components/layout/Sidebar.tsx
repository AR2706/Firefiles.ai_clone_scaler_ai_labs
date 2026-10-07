"use client";

import { AudioLines, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActive, NAV_GROUPS, type NavItem } from "./nav";

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
        collapsed ? "justify-center" : ""
      } ${active ? "bg-brand-soft text-brand" : "text-muted hover:bg-hover hover:text-ink"}`}
    >
      <item.icon size={16} className="shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!collapsed && item.soon && (
        <span className="rounded bg-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Soon
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-150 md:flex ${
        collapsed ? "w-[60px]" : "w-[216px]"
      }`}
    >
      <div className={`flex h-14 items-center gap-2 ${collapsed ? "justify-center" : "px-3.5"}`}>
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="Fireflies.ai_clone home">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-white dark:text-[#16131f]">
            <AudioLines size={16} />
          </span>
          {!collapsed && <span className="truncate text-[15px] font-semibold tracking-tight">Fireflies.ai_clone</span>}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="ml-auto rounded-md p-1 text-muted hover:bg-hover hover:text-ink"
          >
            <ChevronsLeft size={16} />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 pb-3">
        {NAV_GROUPS.map((group, index) => (
          <div key={index} className={index > 0 ? "mt-2 border-t border-line pt-2" : ""}>
            <div className="flex flex-col gap-0.5">
              {group.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
        {collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="mt-auto flex h-9 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-ink"
          >
            <ChevronsRight size={16} />
          </button>
        )}
      </nav>
    </aside>
  );
}
