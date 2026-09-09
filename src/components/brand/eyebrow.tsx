import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  icon = true,
}: {
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3.5 py-2 text-[11px] font-black tracking-[0.18em] text-red-400 uppercase",
        className,
      )}
    >
      {icon ? <Sparkles className="h-3.5 w-3.5" /> : null}
      {children}
    </div>
  );
}
