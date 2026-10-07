import { colorFor, initials } from "@/lib/format";

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      title={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface"
      style={{ width: size, height: size, fontSize: size * 0.38, background: colorFor(name) }}
    >
      {initials(name)}
    </span>
  );
}

/** Overlapping avatars with a "+N" badge when there are more than `max`. */
export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const extra = names.length - max;
  return (
    <span className="flex items-center -space-x-1.5">
      {names.slice(0, max).map((name) => (
        <Avatar key={name} name={name} size={24} />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-hover text-[10px] font-semibold text-muted ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </span>
  );
}
