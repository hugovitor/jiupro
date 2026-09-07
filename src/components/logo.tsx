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
          "block size-3.5 rounded-sm",
          inverted ? "bg-teal-400" : "bg-primary",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "text-[13px] font-semibold tracking-[0.22em] uppercase",
          inverted ? "text-white" : "text-foreground",
        )}
      >
        JiuPro
      </span>
    </span>
  );
}
