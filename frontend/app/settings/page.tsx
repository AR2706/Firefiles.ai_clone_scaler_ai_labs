"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";
import { useTheme } from "@/components/ui/Theme";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

type SectionId = "meeting" | "account" | "appearance" | "notifications" | "billing";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "meeting", label: "Meeting settings" },
  { id: "account", label: "Account settings" },
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
];

const LANGUAGES = ["Automatically detect language", "English (Global)", "English (US)", "English (India)", "Hindi", "Spanish", "French", "German"];
const AUTO_JOIN = ["Only meetings I organise", "All meetings with a web-conference link", "Only when I invite the notetaker"];

function Setting({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="border-b border-line py-5 first:pt-0 last:border-b-0">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-3 text-[13px] text-muted">{description}</p>
      {children}
    </div>
  );
}

/** A control that is shown but not wired up yet. */
function SoonSelect({ options, label }: { options: string[]; label: string }) {
  return (
    <div className="flex max-w-md items-center gap-3">
      <select
        disabled
        aria-label={label}
        className="h-9 flex-1 cursor-not-allowed rounded-lg border border-line bg-bg px-2.5 text-[13px] text-muted"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <span className="shrink-0 rounded-full bg-hover px-2.5 py-1 text-xs font-semibold text-muted">Coming soon</span>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { theme, toggle } = useTheme();
  const [section, setSection] = useState<SectionId>("meeting");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto md:flex-col">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={section === item.id ? "page" : undefined}
            onClick={() => setSection(item.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-left text-[13px] font-medium ${
              section === item.id ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:bg-hover hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="rounded-2xl border border-line bg-surface p-6">
        {section === "meeting" && (
          <>
            <Setting title="Meeting language" description="Select the language spoken during your meetings to get matching transcripts.">
              <SoonSelect options={LANGUAGES} label="Meeting language" />
            </Setting>
            <Setting title="Auto-join" description="Choose which calendar meetings the notetaker joins on its own.">
              <SoonSelect options={AUTO_JOIN} label="Auto-join" />
            </Setting>
            <Setting title="Recording notice" description="The notetaker announces itself when it joins, so everyone knows the call is recorded.">
              <SoonSelect options={["Announce in chat and by voice", "Announce in chat only"]} label="Recording notice" />
            </Setting>
          </>
        )}

        {section === "account" && (
          <Setting title="Profile" description="This workspace uses one default account. Sign-in is coming soon.">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name ?? "Account"} size={52} />
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <TextInput value={user?.name ?? ""} readOnly />
                </Field>
                <Field label="Email">
                  <TextInput value={user?.email ?? ""} readOnly />
                </Field>
              </div>
            </div>
          </Setting>
        )}

        {section === "appearance" && (
          <Setting title="Theme" description="Choose how Fireflies.ai_clone looks on this device.">
            <div className="flex items-center gap-4">
              <span>
                Current theme: <span className="font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
              </span>
              <Button
                onClick={() => {
                  toggle();
                  toast.success(`Switched to ${theme === "dark" ? "light" : "dark"} mode`);
                }}
              >
                Switch to {theme === "dark" ? "light" : "dark"} mode
              </Button>
            </div>
          </Setting>
        )}

        {section === "notifications" && (
          <Setting title="Email recap" description="Get the summary and action items by email when a meeting ends.">
            <SoonSelect options={["Send to me", "Send to all participants", "Do not send"]} label="Email recap" />
          </Setting>
        )}

        {section === "billing" && (
          <Setting title="Plan" description="View your plan, usage and invoices.">
            <SoonSelect options={["Free"]} label="Plan" />
          </Setting>
        )}
      </div>
    </div>
  );
}
