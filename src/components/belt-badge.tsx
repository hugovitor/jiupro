import { beltLabel, beltMeta, beltTipColor } from "@/lib/belts";
import { cn } from "@/lib/utils";

export function BeltStrip({
  belt,
  stripes,
  className,
}: {
  belt: string;
  stripes: number;
  className?: string;
}) {
  const meta = beltMeta(belt);
  const tip = beltTipColor(belt);
  const bars = Math.max(0, Math.min(4, stripes));
  const light = meta.swatch === "#f4f1ea" || meta.swatch === "#eab308";

  return (
    <span
      className={cn(
        "relative inline-flex h-3.5 w-[4.25rem] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        light && "ring-1 ring-black/25",
        className,
      )}
      aria-hidden
    >
      <span className="h-full flex-[2.4]" style={{ background: meta.swatch }} />
      <span
        className="relative flex h-full flex-1 items-center justify-end gap-[3px] pr-[4px]"
        style={{ background: tip }}
      >
        {Array.from({ length: bars }).map((_, i) => (
          <span key={i} className="h-[11px] w-[3px] bg-white" />
        ))}
      </span>
    </span>
  );
}

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
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border border-border bg-secondary/80 py-0.5 pr-2.5 pl-1.5 text-xs",
        className,
      )}
    >
      <BeltStrip belt={belt} stripes={stripes} />
      <span className="text-foreground/90">
        {compact
          ? `${beltMeta(belt).label}${stripes ? ` ${stripes}` : ""}`
          : beltLabel(belt, stripes)}
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
  const dim =
    size === "sm" ? "size-8 text-xs" : size === "lg" ? "size-14 text-lg" : "size-10 text-sm";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-display font-medium text-white",
        dim,
      )}
      style={{ background: `hsl(${hue} 10% 18%)` }}
    >
      {initials}
    </span>
  );
}
