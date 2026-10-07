"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  /** Renders the button; call `toggle` from its onClick. */
  trigger: (toggle: () => void, open: boolean) => ReactNode;
  /** Renders the menu contents; call `close` after an item is chosen. */
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  width?: string;
}

/** A small popover menu that closes on outside click or Escape. */
export function Dropdown({ trigger, children, align = "right", width = "w-56" }: Props) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      {trigger(() => setOpen((value) => !value), open)}
      {open && (
        <div
          role="menu"
          className={`absolute top-[calc(100%+6px)] z-40 ${width} rounded-xl border border-line bg-surface p-1.5 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-hover ${
        danger ? "text-red-500" : ""
      }`}
    >
      {children}
    </button>
  );
}
