import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-md bg-primary text-[11px] font-semibold tracking-tight text-white",
          markClassName,
        )}
        aria-hidden
      >
        J
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        JiuPro
      </span>
    </span>
  );
}
