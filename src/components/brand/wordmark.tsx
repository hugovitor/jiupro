import Link from "next/link";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { ProductLogo } from "./product-logo";

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
    <span className={cn("inline-flex flex-col items-start", className)}>
      <ProductLogo decorative={Boolean(href)} />
      {kicker ? (
        <span
          className={cn(
            "mt-1 text-[8px] font-semibold tracking-[0.32em] uppercase",
            inverted ? "text-white/40" : "text-black/40",
          )}
        >
          {PRODUCT_TAGLINE}
        </span>
      ) : null}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="group shrink-0" aria-label={PRODUCT_NAME}>
      {mark}
    </Link>
  );
}
