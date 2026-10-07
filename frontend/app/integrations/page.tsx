"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { colorFor } from "@/lib/format";

interface Integration {
  name: string;
  category: string;
  description: string;
}

// Nothing here connects yet. The page shows what is planned and how each
// integration would be used, so the layout is ready when they are built.
const INTEGRATIONS: Integration[] = [
  { name: "Google Meet", category: "Video conferencing", description: "The notetaker joins your Google Meet call as a participant at the start of the meeting to record, transcribe and take notes." },
  { name: "Zoom", category: "Video conferencing", description: "The notetaker joins Zoom meetings from your calendar or from a pasted link." },
  { name: "Microsoft Teams", category: "Video conferencing", description: "The notetaker joins Teams meetings and captures audio and speaker names." },
  { name: "Google Calendar", category: "Calendar", description: "Find upcoming meetings and send the notetaker to the ones you choose." },
  { name: "Outlook Calendar", category: "Calendar", description: "Sync Outlook events so meetings are captured automatically." },
  { name: "Slack", category: "Collaboration", description: "Post the summary and action items to a channel when a meeting ends." },
  { name: "Notion", category: "Collaboration", description: "Save meeting notes as pages in a Notion database." },
  { name: "Asana", category: "Project management", description: "Create tasks from action items, assigned to the right person." },
  { name: "HubSpot", category: "CRM", description: "Attach call notes to the matching contact and deal." },
  { name: "Salesforce", category: "CRM", description: "Log meeting notes and next steps on the opportunity." },
];

const CATEGORIES = ["All", ...new Set(INTEGRATIONS.map((item) => item.category))];

function Tile({ name, size }: { name: string; size: number }) {
  // A lettered tile stands in for the product's logo.
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: colorFor(name) }}
    >
      {name[0]}
    </span>
  );
}

export default function IntegrationsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedName, setSelectedName] = useState(INTEGRATIONS[0].name);

  const visible = useMemo(
    () =>
      INTEGRATIONS.filter(
        (item) =>
          (category === "All" || item.category === category) &&
          item.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, category],
  );
  const selected = INTEGRATIONS.find((item) => item.name === selectedName) ?? INTEGRATIONS[0];

  return (
    <div className="grid h-full md:grid-cols-[300px_minmax(0,1fr)]">
      <div className="flex min-h-0 flex-col border-b border-line md:border-b-0 md:border-r">
        <div className="space-y-2 p-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search integrations"
              aria-label="Search integrations"
              className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-brand"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Category"
            className="h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-[13px] outline-none focus:border-brand"
          >
            {CATEGORIES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
        <ul className="max-h-64 min-h-0 flex-1 overflow-y-auto px-2 pb-3 md:max-h-none">
          {visible.length === 0 && <li className="px-3 py-6 text-center text-muted">No integrations match.</li>}
          {visible.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                onClick={() => setSelectedName(item.name)}
                aria-pressed={item.name === selected.name}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left ${
                  item.name === selected.name ? "bg-surface shadow-sm ring-1 ring-line" : "hover:bg-hover"
                }`}
              >
                <Tile name={item.name} size={36} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="mt-0.5 inline-block rounded bg-hover px-1.5 py-0.5 text-[11px] text-muted">
                    {item.category}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface p-6 sm:p-10">
        <div className="flex items-center gap-4">
          <Tile name={selected.name} size={64} />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{selected.name} integration</h1>
            <div className="mt-1.5 flex gap-2 text-xs">
              <span className="rounded bg-hover px-2 py-1 text-muted">{selected.category}</span>
              <span className="rounded bg-brand-soft px-2 py-1 font-semibold text-brand">Coming soon</span>
            </div>
          </div>
        </div>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">{selected.description}</p>
        <button
          type="button"
          disabled
          className="mt-6 h-9 cursor-not-allowed rounded-lg bg-hover px-4 text-[13px] font-medium text-muted"
        >
          Connect (not available yet)
        </button>
      </div>
    </div>
  );
}
