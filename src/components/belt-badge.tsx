import { beltLabel, beltMeta } from "@/lib/belts";
import { cn } from "@/lib/utils";

export function BeltBadge({
  belt,
  stripes,
  compact,
  className,
}: {
  belt: string;
  stripes: number;
  compact?: boolean;
  className?: string;
}) {
  const meta = beltMeta(belt);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 pr-2.5 pl-1.5 py-0.5 text-xs",
        className,
      )}
    >
      <span
        className="relative h-3 w-8 overflow-hidden rounded-sm ring-1 ring-black/30"
        style={{ background: meta.swatch }}
        aria-hidden
      >
        <span className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center gap-px">
          {Array.from({ length: stripes }).map((_, i) => (
            <span key={i} className="h-3 w-0.5 bg-black/70" />
          ))}
        </span>
      </span>
      <span className="text-foreground/90">
        {compact ? `${meta.label}${stripes ? ` ${stripes}` : ""}` : beltLabel(belt, stripes)}
      </span>
    </span>
  );
}

export function PersonAvatar({
  name,
  hue,
  size = "md",
}: {
  name: string;
  hue: number;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const dim = size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-14 text-lg" : "size-10 text-sm";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        dim,
      )}
      style={{ background: `oklch(0.42 0.08 ${hue})` }}
    >
      {initials}
    </span>
  );
}
