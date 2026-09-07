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
          "relative size-9 overflow-hidden rounded-full ring-1 ring-white/20",
          markClassName,
        )}
        aria-hidden
      >
        <span className="absolute inset-0 bg-[#111113]" />
        <span className="absolute inset-y-0 right-0 w-[34%] bg-primary" />
        <span className="absolute inset-y-[7px] right-[5px] flex gap-[2px]">
          <span className="h-full w-[2px] rounded-full bg-white" />
          <span className="h-full w-[2px] rounded-full bg-white" />
          <span className="h-full w-[2px] rounded-full bg-white" />
        </span>
      </span>
      <span className="font-display text-[1.7rem] leading-none">
        JIU<span className="text-primary">PRO</span>
      </span>
    </span>
  );
}
