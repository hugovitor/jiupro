import { PRODUCT_MARK } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function AcademyMark({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[10px] font-black">
        {initials || "JJ"}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-lg font-black tracking-[-0.04em] text-white">
          {name}
        </span>
        <span className="block text-[8px] font-semibold tracking-[0.32em] text-white/40 uppercase">
          via {PRODUCT_MARK}
        </span>
      </span>
    </span>
  );
}
