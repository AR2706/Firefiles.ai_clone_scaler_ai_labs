// Small display helpers shared across pages.

/** 754000 -> "12:34", 3723000 -> "1:02:03" */
export function formatTimestamp(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

/** 452 -> "8 min", 4500 -> "1 hr 15 min" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return seconds > 0 ? "1 min" : "0 min";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} hr ${rest} min` : `${Math.floor(minutes / 60)} hr`;
}

/** The API sends UTC times; `Date` shows them in the viewer's own time zone. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "Today", "Yesterday", or a full date. Used to group the meetings list. */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return formatDate(iso);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const AVATAR_COLORS = [
  "#7c3aed", "#db2777", "#0891b2", "#059669", "#d97706", "#4f46e5", "#dc2626", "#0d9488",
];

/** The same name always gets the same colour, so speakers are easy to follow. */
export function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Split a comma-separated field into trimmed, non-empty names. */
export function splitNames(value: string): string[] {
  return value.split(",").map((name) => name.trim()).filter(Boolean);
}

/** Turn a date picker value ("2026-10-05") into the UTC instant at which that
 *  day starts or ends in the viewer's time zone. */
export function dayBoundary(day: string | undefined, edge: "start" | "end"): string | undefined {
  if (!day) return undefined;
  const time = edge === "start" ? "T00:00:00.000" : "T23:59:59.999";
  return new Date(`${day}${time}`).toISOString();
}
