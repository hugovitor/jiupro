import { cn } from "@/lib/utils";

export function BeltMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative block h-7 w-11 overflow-hidden rounded-sm bg-[#191919] shadow-inner shadow-black",
        className,
      )}
      aria-hidden
    >
      <span className="absolute inset-y-0 right-0 w-3.5 bg-red-600" />
      <span className="absolute top-1 right-1 h-5 w-[2px] bg-white" />
    </span>
  );
}
