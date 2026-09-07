import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverted,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "block h-3.5 w-3.5",
          inverted ? "bg-white" : "bg-foreground",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "text-[13px] font-semibold tracking-[0.28em] uppercase",
          inverted ? "text-white" : "text-foreground",
        )}
      >
        JiuPro
      </span>
    </span>
  );
}
