import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative h-5 w-9 overflow-hidden ring-1 ring-white/15",
          markClassName,
        )}
        aria-hidden
      >
        <span className="absolute inset-y-0 left-0 w-[62%] bg-neutral-950" />
        <span className="absolute inset-y-0 right-0 w-[38%] bg-primary" />
        <span className="absolute inset-y-[3px] right-[3px] flex gap-[2px]">
          <span className="h-full w-[2px] bg-white" />
          <span className="h-full w-[2px] bg-white" />
          <span className="h-full w-[2px] bg-white" />
        </span>
      </span>
      <span className="font-display text-[1.35rem] font-semibold leading-none">
        JIU<span className="text-primary">PRO</span>
      </span>
    </span>
  );
}
