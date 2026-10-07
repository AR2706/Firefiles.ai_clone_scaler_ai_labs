import type { ReactNode } from "react";

/** Standard page frame: a title, an optional subtitle and action, then content. */
export function Page({ title, subtitle, action, children, width = "max-w-5xl" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; width?: string }) {
  return (
    <div className={`mx-auto ${width} px-4 py-6 sm:px-6`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface ${className}`}>{children}</div>;
}
