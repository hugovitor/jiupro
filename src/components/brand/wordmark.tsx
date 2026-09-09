import Link from "next/link";
import { PRODUCT_MARK, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { BeltMark } from "./belt-mark";

export function Wordmark({
  href = "/",
  kicker = true,
  inverted = true,
  className,
}: {
  href?: string | null;
  kicker?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  const mark = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <BeltMark />
      <span>
        <span
          className={cn(
            "block text-lg font-black tracking-[-0.04em]",
            inverted ? "text-white" : "text-[#111]",
          )}
        >
          {PRODUCT_MARK}
        </span>
        {kicker ? (
          <span
            className={cn(
              "block text-[8px] font-semibold tracking-[0.32em] uppercase",
              inverted ? "text-white/40" : "text-black/40",
            )}
          >
            {PRODUCT_TAGLINE}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="group shrink-0" aria-label={PRODUCT_NAME}>
      {mark}
    </Link>
  );
}
