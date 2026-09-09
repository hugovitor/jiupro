import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  dark = true,
  centered = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  dark?: boolean;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p
        className={cn(
          "flex items-center gap-3 text-[11px] font-black tracking-[0.24em] text-red-600 uppercase",
          centered && "justify-center",
        )}
      >
        {!centered ? <span className="h-px w-8 bg-red-600" /> : null}
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-5 text-3xl leading-tight font-black tracking-[-0.045em] sm:text-4xl",
          dark ? "text-white" : "text-[#111]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 text-sm leading-7 sm:text-base",
            dark ? "text-white/45" : "text-black/50",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
