import { PRODUCT_LOGO_SRC, PRODUCT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function ProductLogo({
  className,
  decorative = true,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- marca estática em public/
    <img
      src={PRODUCT_LOGO_SRC}
      alt={decorative ? "" : PRODUCT_NAME}
      className={cn("h-8 w-auto max-w-[168px] object-contain object-left sm:h-9 sm:max-w-[196px]", className)}
    />
  );
}
