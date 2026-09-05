import { beltLabel, beltMeta } from "@/lib/belts";
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
  const bars = Math.max(0, Math.min(meta.maxDegrees || 4, stripes));
  const light =
    meta.body === "#f4f1ea" ||
    meta.body === "#eab308" ||
    meta.tip === "#f4f1ea";

  return (
    <span
      className={cn(
        "relative inline-flex h-3.5 w-[4.5rem] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        light && "ring-1 ring-black/25",
        className,
      )}
      aria-hidden
    >
      {meta.coral ? (
        <span className="flex h-full flex-[2.6]">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="h-full flex-1"
              style={{ background: meta.coral![i % 2] }}
            />
          ))}
        </span>
      ) : (
        <span className="relative h-full flex-[2.4]" style={{ background: meta.body }}>
          {meta.center && (
            <span
              className="absolute inset-y-[32%] right-0 left-0"
              style={{ background: meta.center }}
            />
          )}
        </span>
      )}
      <span
        className="relative flex h-full flex-1 items-center justify-end gap-[2px] pr-[3px]"
        style={{ background: meta.tip }}
      >
        {Array.from({ length: bars }).map((_, i) => (
          <span
            key={i}
            className="h-[11px] w-[2.5px]"
            style={{
              background: meta.tip === "#f4f1ea" ? "#c41e3a" : "#ffffff",
            }}
          />
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
