import { PRODUCT_MARK } from "@/lib/brand";
import { academyInitials, studentAppKicker } from "@/lib/academy-brand";
import { cn } from "@/lib/utils";

export function AcademyMark({
  name,
  logo,
  tagline,
  branded = true,
  className,
}: {
  name: string;
  logo?: string;
  tagline?: string;
  branded?: boolean;
  className?: string;
}) {
  const initials = academyInitials(name);

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded or static academy mark
        <img
          src={logo}
          alt=""
          className="size-8 shrink-0 rounded-lg object-cover ring-1 ring-white/15"
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-[10px] font-black">
          {initials}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-black tracking-[-0.04em] text-white leading-tight">
          {name}
        </span>
        <span className="block truncate text-[9px] font-semibold tracking-[0.16em] text-white/45 uppercase">
          {branded ? studentAppKicker(tagline, true) : PRODUCT_MARK}
        </span>
      </span>
    </span>
  );
}
