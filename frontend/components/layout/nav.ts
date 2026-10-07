import {
  Activity,
  BarChart3,
  Blocks,
  Home,
  ListChecks,
  Settings,
  Upload,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

/** Sidebar groups, top to bottom. Each inner list is separated by a divider. */
export const NAV_GROUPS: NavItem[][] = [
  [
    { href: "/", label: "Home", icon: Home },
    { href: "/meetings", label: "Meetings", icon: Video },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/status", label: "Meeting status", icon: Activity },
    { href: "/uploads", label: "Uploads", icon: Upload },
  ],
  [
    { href: "/integrations", label: "Integrations", icon: Blocks, soon: true },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ],
  [
    { href: "/team", label: "Team", icon: Users, soon: true },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** The name shown in the top bar for the current page. */
export function pageTitle(pathname: string): string {
  if (pathname.startsWith("/search")) return "Search";
  if (pathname.startsWith("/live")) return "Live capture";
  const match = NAV_GROUPS.flat().find((item) => isActive(pathname, item.href));
  return match?.label ?? "Fireflies.ai_clone";
}
