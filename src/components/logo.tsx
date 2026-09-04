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
          "relative flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground",
          markClassName,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path
            fill="currentColor"
            d="M4 7.5h16v2.2H4zm2.2 3.4h11.6v2.2H6.2zm2.3 3.4h7v2.2h-7zM12 4.2 9.4 7.5h5.2z"
          />
          <circle cx="12" cy="18.6" r="1.4" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-[0.18em]">
        TATAME
      </span>
    </span>
  );
}
