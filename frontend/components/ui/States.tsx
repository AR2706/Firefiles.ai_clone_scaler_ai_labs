import { Loader2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 size={18} className="animate-spin" />
      <span>{label}…</span>
    </div>
  );
}

interface EmptyProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Icon size={22} />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** A placeholder page for features that are out of scope for now. */
export function ComingSoon({ icon, title, description, points }: EmptyProps & { points: string[] }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-line bg-surface">
        <EmptyState icon={icon} title={title} description={description} />
        <ul className="border-t border-line px-8 py-5 text-muted">
          {points.map((point) => (
            <li key={point} className="flex gap-2 py-1">
              <span className="text-brand">•</span>
              {point}
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-8 py-4 text-center">
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
